import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import {
  PublicDeliveryRoute,
  PublicRouteService,
  PublicRouteStop,
} from '../../services/public-route.service';

@Component({
  selector: 'app-public-route-page',
  standalone: true,
  imports: [IconComponent, LoadingComponent],
  templateUrl: './public-route-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRoutePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PublicRouteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly deliveryRoute = signal<PublicDeliveryRoute | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deliveryError = signal<string | null>(null);
  readonly uploadingOrderId = signal<number | null>(null);

  constructor() {
    this.load();
  }

  phoneUrl(phone: string | null): string | null {
    const normalized = phone?.replace(/\D/g, '') ?? '';
    return normalized ? `https://wa.me/${normalized}` : null;
  }

  mapUrl(stop: PublicRouteStop): string | null {
    if (stop.latitude === null || stop.latitude === undefined || stop.longitude === null || stop.longitude === undefined) {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
  }

  isDelivered(stop: PublicRouteStop): boolean {
    return stop.status === 'delivered' || stop.delivery_evidence !== null;
  }

  isUploading(stop: PublicRouteStop): boolean {
    return this.uploadingOrderId() === stop.order_id;
  }

  deliveryStatusLabel(stop: PublicRouteStop): string {
    return this.isDelivered(stop) ? 'Entregado' : 'Pendiente de entrega';
  }

  productImage(stop: PublicRouteStop): string | null {
    return stop.product?.image_thumbnail_url ?? stop.product?.image_url ?? null;
  }

  onEvidenceSelected(stop: PublicRouteStop, event: Event): void {
    const input = event.target as HTMLInputElement;
    const [evidence] = input.files ?? [];
    input.value = '';
    if (!evidence || this.isDelivered(stop) || this.isUploading(stop)) {
      return;
    }

    const validationError = validateEvidence(evidence);
    if (validationError) {
      this.deliveryError.set(validationError);
      return;
    }

    this.deliveryError.set(null);
    this.uploadingOrderId.set(stop.order_id);
    this.service
      .confirmDelivery(this.token, stop.order_id, evidence)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploadingOrderId.set(null)),
      )
      .subscribe({
        next: (deliveryRoute) => this.deliveryRoute.set(deliveryRoute),
        error: (error: unknown) =>
          this.deliveryError.set(
            getApiErrorMessage(error, 'No se pudo registrar la evidencia de entrega.'),
          ),
      });
  }

  private load(): void {
    if (!this.token) {
      this.error.set('El enlace de la ruta no es valido.');
      this.loading.set(false);
      return;
    }

    this.service
      .get(this.token)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (deliveryRoute) => this.deliveryRoute.set(deliveryRoute),
        error: () => this.error.set('El enlace no esta disponible o ha vencido.'),
      });
  }
}

function validateEvidence(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Selecciona una imagen JPG, PNG o WEBP.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'La foto de evidencia no puede superar los 5 MB.';
  }
  return null;
}
