import { Injectable, inject } from '@angular/core';
import { GoogleMapsLoaderService } from '@shared/services/google-maps-loader.service';
import { RouteMapOrder, RouteOrigin, RoutePreview } from '../models/delivery-route.model';

interface RouteResult {
  distanceMeters?: number;
  durationMillis?: number;
  path?: { lat: number; lng: number }[];
}

interface RoutesLibrary {
  Route: {
    computeRoutes(request: Record<string, unknown>): Promise<{ routes?: RouteResult[] }>;
  };
}

/** Calculates and caches a preview for the exact origin and selected stop order. */
@Injectable({ providedIn: 'root' })
export class RoutePreviewService {
  private readonly mapsLoader = inject(GoogleMapsLoaderService);
  private readonly previews = new Map<string, Promise<RoutePreview>>();

  calculate(origin: RouteOrigin, orders: RouteMapOrder[]): Promise<RoutePreview> {
    const key = [origin.id, ...orders.map((order) => order.id)].join(':');
    const existing = this.previews.get(key);
    if (existing) return existing;

    const preview = this.compute(origin, orders).catch((error: unknown) => {
      this.previews.delete(key);
      throw error;
    });
    this.previews.set(key, preview);
    return preview;
  }

  private async compute(origin: RouteOrigin, orders: RouteMapOrder[]): Promise<RoutePreview> {
    if (orders.length === 0) throw new Error('Selecciona al menos un pedido.');

    const google = await this.mapsLoader.load();
    const { Route } = (await google.importLibrary('routes')) as RoutesLibrary;
    const destination = orders.at(-1)!;
    const response = await Route.computeRoutes({
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude },
      intermediates: orders.slice(0, -1).map((order) => ({
        location: { lat: order.latitude, lng: order.longitude },
        vehicleStopover: true,
      })),
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE',
      fields: ['path', 'distanceMeters', 'durationMillis'],
    });
    const route = response.routes?.[0];
    if (
      !route?.path?.length ||
      route.distanceMeters === undefined ||
      route.durationMillis === undefined
    ) {
      throw new Error('No se pudo calcular la ruta para las paradas seleccionadas.');
    }

    return {
      distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
      estimatedMinutes: Math.max(1, Math.round(route.durationMillis / 60_000)),
      path: route.path.map((point) => ({ lat: point.lat, lng: point.lng })),
    };
  }
}
