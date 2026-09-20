import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  GenerateRoutePayload,
  RouteOrigin,
  RouteMapOrder,
  RoutePreview,
} from '../../models/delivery-route.model';
import { RoutePreviewService } from '../../services/route-preview.service';

@Component({
  selector: 'app-route-generator-modal',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './route-generator-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteGeneratorModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() campaignId: number | null = null;
  @Input() orders: RouteMapOrder[] = [];
  @Input() origin: RouteOrigin | null = null;
  @Input() selectedOrderIds: number[] = [];
  @Input() saving = false;
  @Input() error: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly submitted = new EventEmitter<GenerateRoutePayload>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly routePreviewService = inject(RoutePreviewService);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(5000)],
  });
  readonly orderedIds = signal<number[]>([]);
  readonly preview = signal<RoutePreview | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  private previewVersion = 0;
  readonly selectedOrders = computed(() => {
    const orders = new Map(this.orders.map((order) => [order.id, order]));
    return this.orderedIds().flatMap((id) => {
      const order = orders.get(id);
      return order ? [order] : [];
    });
  });
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.form.reset({ name: '', description: '' });
    }
    if (this.isOpen && (changes['isOpen']?.currentValue || changes['selectedOrderIds'])) {
      this.orderedIds.set(this.selectedOrderIds);
      this.updatePreview();
    }
  }
  moveOrder(orderId: number, direction: -1 | 1): void {
    this.orderedIds.update((current) => {
      const index = current.indexOf(orderId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    this.updatePreview();
  }
  submit(): void {
    const preview = this.preview();
    if (this.form.invalid || !this.campaignId || this.orderedIds().length === 0 || !preview) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      campaign_id: this.campaignId,
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      stops: this.orderedIds().map((orderId, index) => ({
        order_id: orderId,
        sort_order: index + 1,
      })),
      estimated_distance_km: preview.distanceKm,
      estimated_minutes: preview.estimatedMinutes,
      request_key: `route-${crypto.randomUUID()}`,
    });
  }

  private updatePreview(): void {
    const origin = this.origin;
    const orders = this.selectedOrders();
    this.preview.set(null);
    this.previewError.set(null);
    if (!origin || orders.length === 0) return;

    this.previewLoading.set(true);
    const version = ++this.previewVersion;
    void this.routePreviewService
      .calculate(origin, orders)
      .then((preview) => {
        if (version === this.previewVersion) this.preview.set(preview);
      })
      .catch(() => {
        if (version === this.previewVersion) {
          this.previewError.set('No se pudo calcular la distancia y el tiempo de la ruta.');
        }
      })
      .finally(() => {
        if (version === this.previewVersion) this.previewLoading.set(false);
      });
  }
}
