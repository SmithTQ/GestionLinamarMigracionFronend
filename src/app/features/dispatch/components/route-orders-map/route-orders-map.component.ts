import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { GoogleMapsLoaderService } from '@shared/services/google-maps-loader.service';
import {
  RouteMapOrder,
  RouteOrigin,
  RoutePreview,
  isRouteOrderSelectable,
} from '../../models/delivery-route.model';
import { RoutePreviewService } from '../../services/route-preview.service';

interface Listener {
  remove(): void;
}
interface Bounds {
  extend(position: Point): void;
}
interface MapInstance {
  fitBounds(bounds: Bounds): void;
}
interface Marker {
  map: MapInstance | null;
}
interface Polyline {
  setMap(map: MapInstance | null): void;
}
interface InfoWindow {
  setContent(content: Node): void;
  open(options: { map: MapInstance; anchor: Marker }): void;
  close(): void;
}
interface Point {
  lat: number;
  lng: number;
}
interface MapsLibrary {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  Polyline: new (options: Record<string, unknown>) => Polyline;
  InfoWindow: new () => InfoWindow;
}
interface CoreLibrary {
  LatLngBounds: new () => Bounds;
}
interface MarkerLibrary {
  AdvancedMarkerElement: new (options: Record<string, unknown>) => Marker;
}

@Component({
  selector: 'app-route-orders-map',
  standalone: true,
  templateUrl: './route-orders-map.component.html',
  styleUrl: './route-orders-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RouteOrdersMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() orders: RouteMapOrder[] = [];
  @Input() origin: RouteOrigin | null = null;
  @Input() selectedOrderIds: number[] = [];
  @Output() readonly orderToggled = new EventEmitter<number>();
  @Output() readonly previewChanged = new EventEmitter<RoutePreview | null>();
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLElement>;

  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private readonly previews = inject(RoutePreviewService);
  readonly loading = signal(false);
  readonly previewLoading = signal(false);
  readonly error = signal<string | null>(null);
  private map?: MapInstance;
  private maps?: MapsLibrary;
  private core?: CoreLibrary;
  private markersApi?: MarkerLibrary;
  private infoWindow?: InfoWindow;
  private markers: Marker[] = [];
  private polylines: Polyline[] = [];
  private listeners: Listener[] = [];
  private previewVersion = 0;
  private previewTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    void this.initialize();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['orders'] || changes['origin'] || changes['selectedOrderIds']) && this.map) {
      this.renderMarkers();
      this.schedulePreview();
    }
  }
  ngOnDestroy(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.clearMarkers();
    this.clearPolylines();
  }

  private async initialize(): Promise<void> {
    if (!this.mapContainer || !environment.googleMapsApiKey) {
      this.error.set('El mapa no esta configurado.');
      return;
    }
    this.loading.set(true);
    try {
      const google = await this.mapsLoader.load();
      const [maps, markers, core] = await Promise.all([
        google.importLibrary('maps') as Promise<MapsLibrary>,
        google.importLibrary('marker') as Promise<MarkerLibrary>,
        google.importLibrary('core') as Promise<CoreLibrary>,
      ]);
      this.maps = maps;
      this.markersApi = markers;
      this.core = core;
      this.infoWindow = new maps.InfoWindow();
      this.map = new maps.Map(this.mapContainer.nativeElement, {
        center: this.center(),
        zoom: 12,
        clickableIcons: false,
        mapId: environment.googleMapsMapId,
      });
      this.renderMarkers();
      this.schedulePreview();
    } catch {
      this.error.set('No se pudo cargar el mapa de pedidos.');
    } finally {
      this.loading.set(false);
    }
  }

  private renderMarkers(): void {
    if (!this.map || !this.markersApi) return;
    this.clearMarkers();
    const selected = new Set(this.selectedOrderIds);
    if (this.origin) this.addOriginMarker();
    this.orders.filter(hasCoordinates).forEach((order) => this.addOrderMarker(order, selected.has(order.id)));
    this.fitToMarkers();
  }
  private addOriginMarker(): void {
    const origin = this.origin!;
    const content = createMarkerContent('S', 'route-map-marker--origin');
    const marker = new this.markersApi!.AdvancedMarkerElement({
      map: this.map,
      position: { lat: origin.latitude, lng: origin.longitude },
      title: `Salida: ${origin.name}`,
      content,
      gmpClickable: true,
    });
    this.listenToMarkerContent(content, () =>
      this.openInfo(marker, 'Punto de partida', [
        ['Sucursal', origin.name],
        ['Direccion', origin.address || 'Sin direccion registrada'],
      ]),
    );
    this.markers.push(marker);
  }
  private addOrderMarker(order: RouteMapOrder, selected: boolean): void {
    const selectable = isRouteOrderSelectable(order);
    const content = createMarkerContent(
      String(order.id),
      selectable && selected ? 'route-map-marker--selected' : selectable ? '' : 'route-map-marker--blocked',
      selectable,
    );
    const marker = new this.markersApi!.AdvancedMarkerElement({
      map: this.map,
      position: { lat: order.latitude, lng: order.longitude },
      title: `${order.code} - ${order.recipientName}`,
      content,
      gmpClickable: true,
    });
    const showDetails = () =>
      this.openInfo(marker, `Pedido ${order.code}`, [
        ['Producto', order.productName],
        ['Remitente', person(order.senderName, order.senderPhone)],
        ['Destinatario', person(order.recipientName, order.recipientPhone)],
        ['Horario de entrega', order.deliveryTime || 'Sin horario definido'],
        ...(order.activeRoute
          ? [['Ruta asignada', `${order.activeRoute.code} - ${order.activeRoute.name}`] as [string, string]]
          : selectable
            ? []
            : [['Disponibilidad', 'Este pedido no puede planificarse en su estado actual'] as [string, string]]),
      ]);
    this.listenToMarkerContent(
      content,
      showDetails,
      selectable
        ? () => {
            showDetails();
            this.orderToggled.emit(order.id);
          }
        : showDetails,
    );
    this.markers.push(marker);
  }

  private listenToMarkerContent(
    content: HTMLElement,
    onHover: () => void,
    onClick = onHover,
  ): void {
    const hoverHandler = () => onHover();
    const clickHandler = () => onClick();
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onClick();
    };
    content.addEventListener('mouseenter', hoverHandler);
    content.addEventListener('click', clickHandler);
    content.addEventListener('keydown', keydownHandler);
    this.listeners.push({
      remove: () => {
        content.removeEventListener('mouseenter', hoverHandler);
        content.removeEventListener('click', clickHandler);
        content.removeEventListener('keydown', keydownHandler);
      },
    });
  }

  private schedulePreview(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    const origin = this.origin;
    const orders = this.selectedOrders();
    this.clearPolylines();
    this.error.set(null);
    this.previewChanged.emit(null);
    if (!origin || orders.length === 0) {
      this.previewLoading.set(false);
      return;
    }
    this.previewLoading.set(true);
    const version = ++this.previewVersion;
    this.previewTimer = setTimeout(() => void this.loadPreview(origin, orders, version), 350);
  }
  private async loadPreview(
    origin: RouteOrigin,
    orders: RouteMapOrder[],
    version: number,
  ): Promise<void> {
    try {
      const preview = await this.previews.calculate(origin, orders);
      if (version !== this.previewVersion) return;
      this.drawPreview(preview);
      this.previewChanged.emit(preview);
    } catch {
      if (version === this.previewVersion)
        this.error.set('No se pudo calcular la ruta para los pedidos seleccionados.');
    } finally {
      if (version === this.previewVersion) this.previewLoading.set(false);
    }
  }
  private drawPreview(preview: RoutePreview): void {
    if (!this.map || !this.maps) return;
    this.clearPolylines();
    this.polylines = [
      new this.maps.Polyline({
        map: this.map,
        path: preview.path,
        strokeColor: '#2563eb',
        strokeOpacity: 0.85,
        strokeWeight: 5,
      }),
    ];
    this.fitTo(preview.path);
  }
  private openInfo(marker: Marker, title: string, entries: [string, string][]): void {
    if (!this.infoWindow || !this.map) return;
    const content = document.createElement('div');
    content.className = 'route-map-info';
    const heading = document.createElement('strong');
    heading.textContent = title;
    content.append(heading);
    entries.forEach(([label, value]) => {
      const item = document.createElement('p');
      item.textContent = `${label}: ${value}`;
      content.append(item);
    });
    this.infoWindow.setContent(content);
    this.infoWindow.open({ map: this.map, anchor: marker });
  }
  private clearMarkers(): void {
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];
    this.markers.forEach((marker) => (marker.map = null));
    this.markers = [];
    this.infoWindow?.close();
  }
  private clearPolylines(): void {
    this.polylines.forEach((polyline) => polyline.setMap(null));
    this.polylines = [];
  }
  private selectedOrders(): RouteMapOrder[] {
    const byId = new Map(this.orders.map((order) => [order.id, order]));
    return this.selectedOrderIds.flatMap((id) => {
      const order = byId.get(id);
      return order ? [order] : [];
    });
  }
  private fitToMarkers(): void {
    const points: Point[] = [
      ...this.orders.filter(hasCoordinates).map((order) => ({ lat: order.latitude, lng: order.longitude })),
      ...(this.origin ? [{ lat: this.origin.latitude, lng: this.origin.longitude }] : []),
    ];
    this.fitTo(points);
  }
  private fitTo(points: Point[]): void {
    if (!this.map || !this.core || points.length === 0) return;
    const bounds = new this.core.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    this.map.fitBounds(bounds);
  }
  private center(): Point {
    if (this.origin) return { lat: this.origin.latitude, lng: this.origin.longitude };
    const firstOrder = this.orders.find(hasCoordinates);
    return firstOrder
      ? { lat: firstOrder.latitude, lng: firstOrder.longitude }
      : { lat: -12.0464, lng: -77.0428 };
  }
}

function hasCoordinates(order: RouteMapOrder): boolean {
  return Number.isFinite(order.latitude) && Number.isFinite(order.longitude);
}

function createMarkerContent(label: string, variant: string, interactive = true): HTMLElement {
  const content = document.createElement('span');
  content.className = `route-map-marker ${variant}`.trim();
  content.textContent = label;
  content.tabIndex = interactive ? 0 : -1;
  content.setAttribute('role', interactive ? 'button' : 'img');
  if (!interactive) content.setAttribute('aria-label', `Pedido ${label} no disponible para una nueva ruta`);
  return content;
}

function person(name?: string | null, phone?: string | null): string {
  return [name || 'Sin nombre', phone].filter(Boolean).join(' · ');
}
