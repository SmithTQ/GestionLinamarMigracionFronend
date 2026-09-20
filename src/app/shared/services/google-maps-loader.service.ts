import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GoogleMapsApi {
  importLibrary(library: string): Promise<unknown>;
}

interface GoogleWindow extends Window {
  google?: { maps: GoogleMapsApi };
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loader?: Promise<GoogleMapsApi>;

  load(): Promise<GoogleMapsApi> {
    const existing = (window as GoogleWindow).google;
    if (existing) return Promise.resolve(existing.maps);
    if (this.loader) return this.loader;

    this.loader = new Promise<GoogleMapsApi>((resolve, reject) => {
      const globalWindow = window as unknown as GoogleWindow & Record<string, unknown>;
      const callbackName = '__googleMapsLoaderCallback';
      const script = document.createElement('script');
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(environment.googleMapsApiKey)}` +
        `&v=weekly&loading=async&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      globalWindow[callbackName] = () => {
        delete globalWindow[callbackName];
        const maps = (window as GoogleWindow).google?.maps;
        if (maps) {
          resolve(maps);
          return;
        }
        reject(new Error('Google Maps no esta disponible.'));
      };
      script.onerror = () => {
        delete globalWindow[callbackName];
        this.loader = undefined;
        reject(new Error('No se pudo cargar Google Maps.'));
      };
      document.head.appendChild(script);
    });
    return this.loader;
  }
}
