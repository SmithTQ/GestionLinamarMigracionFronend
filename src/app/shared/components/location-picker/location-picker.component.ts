import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  GoogleMapsApi,
  GoogleMapsLoaderService,
} from '@shared/services/google-maps-loader.service';

export interface LocationValue {
  latitude: string;
  longitude: string;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  prediction: GooglePlacePrediction;
}

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapEvent {
  latLng?: GoogleLatLng;
}

interface GoogleMapsListener {
  remove(): void;
}

interface GoogleMapInstance {
  setCenter(center: { lat: number; lng: number }): void;
  addListener(event: string, callback: (value: GoogleMapEvent) => void): GoogleMapsListener;
}

interface GoogleAdvancedMarkerInstance {
  position: { lat: number; lng: number };
  gmpDraggable: boolean;
  map: GoogleMapInstance | null;
  addListener(event: string, callback: (value: GoogleMapEvent) => void): GoogleMapsListener;
}

interface GooglePlace {
  location?: GoogleLatLng;
  fetchFields(request: { fields: string[] }): Promise<void>;
}

interface GooglePlacePrediction {
  placeId: string;
  text: { toString(): string };
  toPlace(): GooglePlace;
}

interface GoogleAutocompleteSuggestion {
  placePrediction?: GooglePlacePrediction;
}

interface GoogleSessionToken {
  toString(): string;
}

interface GoogleAutocompleteSuggestionClass {
  fetchAutocompleteSuggestions(request: {
    input: string;
    sessionToken: GoogleSessionToken;
    includedRegionCodes?: string[];
  }): Promise<{ suggestions: GoogleAutocompleteSuggestion[] }>;
}

interface GoogleMapsLibrary {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
}

interface GooglePlacesLibrary {
  AutocompleteSuggestion: GoogleAutocompleteSuggestionClass;
  AutocompleteSessionToken: new () => GoogleSessionToken;
}

interface GoogleMarkerLibrary {
  AdvancedMarkerElement: new (options: Record<string, unknown>) => GoogleAdvancedMarkerInstance;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  templateUrl: './location-picker.component.html',
  styleUrl: './location-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude = '';
  @Input() longitude = '';
  @Input() disabled = false;
  @Output() readonly locationChange = new EventEmitter<LocationValue>();
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLElement>;
  @ViewChild('mapWrapper') private mapWrapper?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  readonly mapLoading = signal(false);
  readonly mapError = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly suggestions = signal<LocationSuggestion[]>([]);
  readonly googleMapsConfigured = Boolean(environment.googleMapsApiKey);
  readonly isFullscreen = signal(false);

  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private map?: GoogleMapInstance;
  private marker?: GoogleAdvancedMarkerInstance;
  private google?: GoogleMapsApi;
  private autocompleteSuggestion?: GoogleAutocompleteSuggestionClass;
  private autocompleteSessionTokenFactory?: new () => GoogleSessionToken;
  private autocompleteSessionToken?: GoogleSessionToken;
  private readonly listeners: GoogleMapsListener[] = [];
  private inputDebounce?: ReturnType<typeof setTimeout>;
  private autocompleteRequestId = 0;
  private selectedQuery = '';

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['latitude'] || changes['longitude']) && this.map && this.marker) {
      this.updateMapPosition();
    }
    if (changes['disabled'] && this.marker) {
      this.marker.gmpDraggable = !this.disabled;
    }
  }

  ngOnDestroy(): void {
    if (this.inputDebounce) clearTimeout(this.inputDebounce);
    this.autocompleteRequestId++;
    this.listeners.forEach((listener) => listener.remove());
    if (this.marker) this.marker.map = null;
    this.suggestions.set([]);
  }

  onAddressInput(value: string): void {
    this.autocompleteRequestId++;
    this.searchError.set(null);
    this.suggestions.set([]);
    this.selectedQuery = '';
    if (this.inputDebounce) clearTimeout(this.inputDebounce);

    const query = value.trim();
    if (query.length < 3 || this.disabled) return;

    this.inputDebounce = setTimeout(() => void this.loadSuggestions(query), 250);
  }

  async selectSuggestion(suggestion: LocationSuggestion): Promise<void> {
    if (this.disabled) return;
    this.selectedQuery = suggestion.label;
    if (this.searchInput) this.searchInput.nativeElement.value = suggestion.label;
    this.suggestions.set([]);
    await this.applyPrediction(suggestion.prediction);
  }

  async searchAddress(): Promise<void> {
    const query = this.searchInput?.nativeElement.value.trim();
    if (this.disabled || !query) return;
    if (!this.autocompleteSuggestion || !this.autocompleteSessionTokenFactory) {
      this.searchError.set(
        'El buscador de direcciones no esta disponible. Puedes seleccionar el punto en el mapa.',
      );
      return;
    }
    if (query === this.selectedQuery) return;

    this.searchError.set(null);
    const currentSuggestions = this.suggestions();
    if (currentSuggestions.length > 0) {
      await this.applyPrediction(currentSuggestions[0].prediction);
      return;
    }

    const suggestions = await this.requestSuggestions(query);
    const prediction = suggestions[0]?.placePrediction;
    if (!prediction) {
      this.searchError.set('No se encontro la direccion indicada.');
      return;
    }
    await this.applyPrediction(prediction);
  }

  toggleFullscreen(): void {
    const element = this.mapWrapper?.nativeElement;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void element.requestFullscreen();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(document.fullscreenElement === this.mapWrapper?.nativeElement);
  }

  private async initializeMap(): Promise<void> {
    if (!this.googleMapsConfigured || !this.mapContainer) return;

    this.mapLoading.set(true);
    try {
      const google = await this.mapsLoader.load();
      this.google = google;
      const [mapsLibrary, markerLibrary] = await Promise.all([
        google.importLibrary('maps') as Promise<GoogleMapsLibrary>,
        google.importLibrary('marker') as Promise<GoogleMarkerLibrary>,
      ]);
      const position = this.currentPosition();
      this.map = new mapsLibrary.Map(this.mapContainer.nativeElement, {
        center: position,
        zoom: 15,
        clickableIcons: false,
        disableDefaultUI: true,
        mapId: environment.googleMapsMapId,
        zoomControl: true,
      });
      this.marker = new markerLibrary.AdvancedMarkerElement({
        map: this.map,
        position,
        gmpDraggable: !this.disabled,
        title: 'Ubicacion de entrega',
      });
      this.registerMapListeners();
      this.mapError.set(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      this.mapError.set(
        message === 'La clave de Google Maps no fue aceptada.'
          ? 'La clave de Google Maps no fue aceptada. Verifica la clave y sus restricciones.'
          : 'No se pudo cargar el mapa. Puedes indicar las coordenadas manualmente.',
      );
      this.mapLoading.set(false);
      return;
    }

    try {
      const placesLibrary = (await this.google?.importLibrary('places')) as GooglePlacesLibrary;
      this.autocompleteSuggestion = placesLibrary.AutocompleteSuggestion;
      this.autocompleteSessionTokenFactory = placesLibrary.AutocompleteSessionToken;
      this.searchError.set(null);
    } catch {
      this.searchError.set(
        'El buscador no esta disponible. Puedes seleccionar el punto directamente en el mapa.',
      );
    } finally {
      this.mapLoading.set(false);
    }
  }

  private registerMapListeners(): void {
    if (!this.map || !this.marker) return;
    this.listeners.push(
      this.map.addListener('click', (event) => {
        if (this.disabled || !event.latLng) return;
        this.setMapPosition(event.latLng.lat(), event.latLng.lng());
      }),
      this.marker.addListener('dragend', (event) => {
        if (this.disabled || !event.latLng) return;
        this.setMapPosition(event.latLng.lat(), event.latLng.lng());
      }),
    );
  }

  private async loadSuggestions(query: string): Promise<void> {
    const requestId = ++this.autocompleteRequestId;
    const suggestions = await this.requestSuggestions(query);
    if (requestId !== this.autocompleteRequestId) return;
    this.suggestions.set(
      suggestions.flatMap((suggestion, index) => {
        const prediction = suggestion.placePrediction;
        return prediction
          ? [
              {
                id: `${prediction.placeId}-${index}`,
                label: prediction.text.toString(),
                prediction,
              },
            ]
          : [];
      }),
    );
  }

  private async requestSuggestions(query: string): Promise<GoogleAutocompleteSuggestion[]> {
    if (!this.autocompleteSuggestion || !this.autocompleteSessionTokenFactory) return [];
    this.autocompleteSessionToken ??= new this.autocompleteSessionTokenFactory();
    try {
      const response = await this.autocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken: this.autocompleteSessionToken,
        includedRegionCodes: ['pe'],
      });
      return response.suggestions;
    } catch {
      this.searchError.set('No se pudieron cargar las sugerencias.');
      return [];
    }
  }

  private async applyPrediction(prediction: GooglePlacePrediction): Promise<void> {
    this.mapLoading.set(true);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['location'] });
      if (!place.location) {
        this.searchError.set('La direccion seleccionada no tiene coordenadas.');
        return;
      }
      this.setMapPosition(place.location.lat(), place.location.lng());
      this.searchError.set(null);
      this.autocompleteSessionToken = undefined;
    } catch {
      this.searchError.set('No se pudo obtener la ubicacion seleccionada.');
    } finally {
      this.mapLoading.set(false);
    }
  }

  private setMapPosition(latitude: number, longitude: number): void {
    const position = { lat: latitude, lng: longitude };
    this.map?.setCenter(position);
    if (this.marker) this.marker.position = position;
    this.emitPosition(latitude, longitude);
  }

  private updateMapPosition(): void {
    const position = this.currentPosition();
    this.map?.setCenter(position);
    if (this.marker) this.marker.position = position;
  }

  private currentPosition(): { lat: number; lng: number } {
    const latitude = Number(this.latitude.trim());
    const longitude = Number(this.longitude.trim());
    return this.latitude.trim() &&
      this.longitude.trim() &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : { lat: -12.0464, lng: -77.0428 };
  }

  private emitPosition(latitude: number, longitude: number): void {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    this.locationChange.emit({
      latitude: latitude.toFixed(7),
      longitude: longitude.toFixed(7),
    });
  }
}
