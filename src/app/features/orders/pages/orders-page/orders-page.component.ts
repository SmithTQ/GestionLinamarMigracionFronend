import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { AuthStore } from '@features/auth/store/auth.store';
import { CampaignFormsService } from '@features/campaigns/services/campaign-forms.service';
import { OrdersStore } from '@features/orders/store/orders.store';
import { Order, OrderFileValue, OrderStatus } from '@features/orders/models/order.model';
import {
  OrderListQuery,
  OrderUpdatePayload,
  OrdersService,
} from '@features/orders/services/orders.service';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import {
  TableAction,
  TableBadge,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { FocusInvalidDirective } from '@shared/directives/focus-invalid.directive';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { PublicFormPageComponent } from '@features/public-form/pages/public-form-page/public-form-page.component';
import {
  asOrderFileValue,
  findOrderField,
  formatOrderFieldValue,
} from '@features/orders/utils/order-field.utils';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  validated: 'Validado',
  planned: 'Planificado',
  assigned: 'Asignado',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['validated', 'cancelled'],
  validated: ['planned', 'cancelled'],
  planned: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'failed'],
  failed: ['in_transit', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const DELIVERY_EVIDENCE_BADGE_ID = 'delivery-evidence';
type OrderListFilterKey = 'district' | 'status' | 'deliveryDate';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    TableComponent,
    ButtonComponent,
    ModalComponent,
    LoadingComponent,
    FocusInvalidDirective,
    ReactiveFormsModule,
    PublicFormPageComponent,
    PhoneInputComponent,
  ],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnDestroy {
  private readonly store = inject(OrdersStore);
  private readonly ordersService = inject(OrdersService);
  private readonly campaignContext = inject(CampaignContextStore);
  private readonly formsService = inject(CampaignFormsService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private query: OrderListQuery = { page: 1, pageSize: 10 };
  private filePreviewUrl: string | null = null;
  private deliveryEvidencePreviewObjectUrl: string | null = null;

  readonly columns: TableColumn[] = [
    {
      key: 'code',
      label: '#',
      width: '4.5rem',
      align: 'center',
      sortable: true,
      filterable: false,
    },
    { key: 'product', label: 'Prod.', sortable: true, filterable: false },
    { key: 'sender', label: 'Rem.', sortable: false, filterable: false },
    { key: 'senderPhone', label: 'Tel. rem.', sortable: false, filterable: false },
    { key: 'recipient', label: 'Dest.', sortable: true, filterable: false },
    { key: 'recipientPhone', label: 'Tel. dest.', sortable: false, filterable: false },
    { key: 'district', label: 'Distrito', sortable: true, filterable: false },
    { key: 'status', label: 'Estado', sortable: true, filterable: false, type: 'badge' },
    { key: 'deliveryEvidence', label: 'Evid.', sortable: false, filterable: false, type: 'badges' },
    { key: 'deliveryTime', label: 'Horario', sortable: false, filterable: false },
    { key: 'highlights', label: 'Datos', sortable: false, filterable: false, type: 'badges' },
    { key: 'deliveryDate', label: 'F. entrega', sortable: true, filterable: false, type: 'date' },
    { key: 'createdAt', label: 'F. registro', sortable: true, filterable: false, type: 'date' },
  ];

  readonly actions = computed<TableAction[]>(() => [
    { id: 'view', label: 'Ver', variant: 'ghost', icon: 'eye', disabled: this.isBusy() },
    {
      id: 'edit',
      label: 'Editar',
      variant: 'ghost',
      icon: 'file-pen-line',
      disabled: this.isBusy(),
    },
    {
      id: 'status',
      label: 'Cambiar estado',
      variant: 'outline',
      icon: 'refresh-cw',
      disabled: this.isBusy(),
    },
    {
      id: 'location',
      label: 'Ver ubicación',
      variant: 'ghost',
      icon: 'map-pin',
      disabled: this.isBusy(),
    },
    {
      id: 'archive',
      label: 'Inhabilitar',
      variant: 'ghost',
      icon: 'archive',
      disabled: this.isBusy(),
    },
  ]);

  readonly orders = this.store.orders;
  readonly isLoading = this.store.isLoading;
  readonly loadError = this.store.error;
  readonly selectedOrder = signal<Order | null>(null);
  readonly isDetailOpen = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly isEditOpen = signal(false);
  readonly isStatusOpen = signal(false);
  readonly isLocationOpen = signal(false);
  readonly isFieldValueOpen = signal(false);
  readonly selectedBadge = signal<TableBadge | null>(null);
  readonly selectedFilePreviewUrl = signal<string | null>(null);
  readonly isLoadingFilePreview = signal(false);
  readonly deliveryEvidenceOrder = signal<Order | null>(null);
  readonly deliveryEvidencePreviewUrl = signal<string | null>(null);
  readonly isDeliveryEvidenceOpen = signal(false);
  readonly isLoadingDeliveryEvidence = signal(false);
  readonly isSaving = signal(false);
  readonly isOpeningManualForm = signal(false);
  readonly manualFormKey = signal<string | null>(null);
  readonly isManualFormSubmitting = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly pageSize = signal(10);
  readonly sort = signal<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined);
  readonly filterValues = signal<Record<string, string>>({});
  readonly hasFilters = computed(() => Object.keys(this.filterValues()).length > 0);
  readonly canRegisterOrders = computed(
    () => this.authStore.hasPermission('forms.view') && this.authStore.hasPermission('orders.manage'),
  );
  readonly orderStatusFilters = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  readonly statusOptions = computed(() => {
    const current = this.selectedOrder()?.status;
    return current ? STATUS_TRANSITIONS[current] : [];
  });

  readonly rows = computed(() =>
    this.orders().map((order) => ({
      id: order.id,
      code: order.orderNumber ? `#${order.orderNumber}` : `#${order.id}`,
      product: order.productName ?? 'Producto personalizado',
      sender: order.senderName,
      senderPhone: order.senderPhone,
      recipient: order.recipientName,
      recipientPhone: order.recipientPhone,
      district: order.district,
      deliveryTime: order.deliveryTime ?? 'No indicado',
      highlights: this.highlights(order),
      deliveryEvidence: this.deliveryEvidenceBadges(order),
      address: order.address,
      location:
        order.latitude !== undefined && order.longitude !== undefined
          ? `${order.latitude}, ${order.longitude}`
          : 'Sin ubicación',
      status: this.statusLabel(order.status),
      deliveryDate: order.deliveryDate ?? '-',
      createdAt: order.createdAt,
    })),
  );

  readonly pagination = computed<TablePagination>(() => {
    const page = this.store.pagination();
    return {
      page: page.page,
      pageSize: this.pageSize(),
      total: page.total,
      lastPage: page.totalPages,
      pageSizeOptions: [10, 25, 50],
    };
  });

  readonly editForm = new FormGroup({
    recipient_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    recipient_phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    district: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    delivery_reference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null),
    location_accuracy: new FormControl<number | null>(null),
    dedication: new FormControl('', { nonNullable: true }),
    delivery_date: new FormControl('', { nonNullable: true }),
    delivery_time: new FormControl('', { nonNullable: true }),
  });

  readonly statusForm = new FormGroup({
    status: new FormControl<OrderStatus | null>(null, Validators.required),
  });

  constructor() {
    effect(() => {
      const campaignId = this.campaignContext.activeCampaignId();
      if (!campaignId) return;
      this.query = { page: 1, pageSize: untracked(() => this.pageSize()) };
      this.filterValues.set({});
      this.sort.set(undefined);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.clearFilePreview();
    this.clearDeliveryEvidencePreview();
  }

  load(): void {
    this.store.load(this.query);
  }

  onSort(sort: { key: string; direction: 'asc' | 'desc' }): void {
    this.sort.set(sort);
    this.query = { ...this.query, page: 1, sort };
    this.load();
  }

  onFilter(filter: { key: string; value: string }): void {
    this.setFilter(filter.key as OrderListFilterKey, filter.value);
  }

  onFilterValue(key: OrderListFilterKey, value: string): void {
    this.setFilter(key, value);
  }

  clearFilters(): void {
    if (!Object.keys(this.filterValues()).length) return;
    this.filterValues.set({});
    this.query = { ...this.query, page: 1, filters: {} };
    this.load();
  }

  filterValue(key: OrderListFilterKey): string {
    return this.filterValues()[key] ?? '';
  }

  private setFilter(key: OrderListFilterKey, value: string): void {
    const normalizedValue = value.trim();
    const filters = { ...this.filterValues() };
    if (normalizedValue) {
      filters[key] = normalizedValue;
    } else {
      delete filters[key];
    }
    this.filterValues.set(filters);
    this.query = { ...this.query, page: 1, filters };
    this.load();
  }

  onPage(page: number): void {
    this.query = { ...this.query, page };
    this.load();
  }

  onPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.query = { ...this.query, page: 1, pageSize };
    this.load();
  }

  openManualOrderForm(): void {
    const campaign = this.campaignContext.activeCampaign();
    if (!campaign || this.isOpeningManualForm()) return;

    this.isOpeningManualForm.set(true);
    this.formsService
      .list(campaign.id, campaign.branch?.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isOpeningManualForm.set(false)),
      )
      .subscribe({
        next: (forms) => {
          const form = forms.find((item) => item.status === 'published' && item.publicKey);
          if (!form?.publicKey) {
            this.actionError.set('La campaña activa no tiene un formulario publicado para registrar pedidos.');
            return;
          }
          this.manualFormKey.set(form.publicKey);
        },
        error: (error: unknown) =>
          this.actionError.set(
            getApiErrorMessage(error, 'No se pudo consultar el formulario de la campaña.'),
          ),
      });
  }

  closeManualOrderForm(): void {
    if (this.isManualFormSubmitting()) return;
    this.manualFormKey.set(null);
  }

  onManualOrderSubmitted(): void {
    this.manualFormKey.set(null);
    this.load();
  }

  onAction(event: { action: TableAction; row: Record<string, unknown> }): void {
    const id = Number(event.row['id']);
    if (!Number.isInteger(id)) return;
    if (event.action.id === 'archive') {
      this.archive(id);
      return;
    }
    this.openOrderModal(event.action.id);
    this.isLoadingDetail.set(true);
    this.store
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.selectedOrder.set(order);
          this.actionError.set(null);
          this.isLoadingDetail.set(false);
          if (event.action.id === 'edit') {
            this.editForm.patchValue({
              recipient_name: order.recipientName,
              recipient_phone: order.recipientPhone,
              district: order.district,
              address: order.address,
              delivery_reference: order.deliveryReference ?? '',
              latitude: order.latitude ?? null,
              longitude: order.longitude ?? null,
              location_accuracy: order.locationAccuracy ?? null,
              dedication: order.dedication ?? '',
              delivery_date: order.deliveryDate ?? '',
              delivery_time: order.deliveryTime ?? '',
            });
          } else if (event.action.id === 'status') {
            this.statusForm.reset({ status: null });
          }
        },
        error: () => {
          this.isLoadingDetail.set(false);
          this.actionError.set('No se pudo consultar el pedido.');
        },
      });
  }

  private openOrderModal(actionId: string): void {
    this.selectedOrder.set(null);
    this.actionError.set(null);
    this.isDetailOpen.set(actionId === 'view');
    this.isEditOpen.set(actionId === 'edit');
    this.isStatusOpen.set(actionId === 'status');
    this.isLocationOpen.set(actionId === 'location');
  }

  onBadgeClick(event: { row: Record<string, unknown>; badge: TableBadge }): void {
    const order = this.orders().find((item) => item.id === Number(event.row['id']));
    if (!order) return;
    if (event.badge.id === DELIVERY_EVIDENCE_BADGE_ID) {
      this.openDeliveryEvidence(order);
      return;
    }
    this.selectedOrder.set(order);
    this.selectedBadge.set(event.badge);
    this.loadSelectedFilePreview(order, event.badge);
    this.isFieldValueOpen.set(true);
  }

  saveEdit(): void {
    const order = this.selectedOrder();
    if (!order || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.actionError.set(null);
    const value = this.editForm.getRawValue();
    const payload: OrderUpdatePayload = {
      ...value,
      latitude: value.latitude ?? null,
      longitude: value.longitude ?? null,
      location_accuracy: value.location_accuracy ?? null,
      dedication: value.dedication || null,
      delivery_date: value.delivery_date || null,
      delivery_time: value.delivery_time || null,
    };
    this.store
      .update(order.id, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.isEditOpen.set(false);
          this.load();
        },
        error: () => this.actionError.set('No se pudo actualizar el pedido.'),
      });
  }

  changeStatus(): void {
    const order = this.selectedOrder();
    const status = this.statusForm.controls.status.value;
    if (!order || !status) return;
    this.isSaving.set(true);
    this.actionError.set(null);
    this.store
      .changeStatus(order.id, status)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.isStatusOpen.set(false);
          this.load();
        },
        error: () => this.actionError.set('No se pudo cambiar el estado del pedido.'),
      });
  }

  archive(id: number): void {
    if (!window.confirm('¿Deseas inhabilitar este pedido?')) return;
    this.isSaving.set(true);
    this.actionError.set(null);
    this.store
      .archive(id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.actionError.set('No se pudo inhabilitar el pedido.'),
      });
  }

  closeModals(): void {
    if (this.isSaving() || this.isLoadingDetail()) return;
    this.isDetailOpen.set(false);
    this.isEditOpen.set(false);
    this.isStatusOpen.set(false);
    this.isLocationOpen.set(false);
    this.isFieldValueOpen.set(false);
    this.isLoadingDetail.set(false);
    this.selectedBadge.set(null);
    this.clearFilePreview();
    this.selectedOrder.set(null);
    this.actionError.set(null);
  }

  closeDeliveryEvidence(): void {
    if (this.isLoadingDeliveryEvidence()) return;
    this.isDeliveryEvidenceOpen.set(false);
    this.deliveryEvidenceOrder.set(null);
    this.clearDeliveryEvidencePreview();
  }

  selectedBadgeFile(): OrderFileValue | null {
    const order = this.selectedOrder();
    const badge = this.selectedBadge();
    if (!order || !badge) return null;
    return asOrderFileValue(findOrderField(order, badge.label)?.value);
  }

  statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  highlights(order: Order): TableBadge[] {
    const badges: TableBadge[] = [];
    Object.values(order.optionalFields ?? {})
      .filter((field) => field.filled && field.key !== 'delivery_time')
      .forEach((field) =>
        badges.push({ label: field.label, value: formatOrderFieldValue(field.value) }),
      );
    order.customFields
      ?.filter((field) => field.filled)
      .forEach((field) =>
        badges.push({ label: field.label, value: formatOrderFieldValue(field.value) }),
      );
    return badges;
  }

  deliveryEvidenceBadges(order: Order): TableBadge[] {
    const evidence = order.deliveryEvidence;
    if (!evidence) return [];
    return [
      {
        id: DELIVERY_EVIDENCE_BADGE_ID,
        label: 'Evidencia',
        value: evidence.deliveredAt ?? 'Foto de entrega registrada',
      },
    ];
  }

  customFieldEntries(order: Order): [string, string][] {
    return (order.customFields ?? [])
      .filter((field) => field.filled)
      .map((field) => [field.label, formatOrderFieldValue(field.value)]);
  }

  private loadSelectedFilePreview(order: Order, badge: TableBadge): void {
    this.clearFilePreview();
    const file = asOrderFileValue(findOrderField(order, badge.label)?.value);
    if (!file || !file.mimeType?.startsWith('image/')) return;

    this.isLoadingFilePreview.set(true);
    this.ordersService
      .downloadSubmissionFile(file.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingFilePreview.set(false)),
      )
      .subscribe({
        next: (blob) => {
          this.filePreviewUrl = URL.createObjectURL(blob);
          this.selectedFilePreviewUrl.set(this.filePreviewUrl);
        },
        error: () => this.selectedFilePreviewUrl.set(null),
      });
  }

  private openDeliveryEvidence(order: Order): void {
    if (!order.deliveryEvidence) return;
    this.clearDeliveryEvidencePreview();
    this.deliveryEvidenceOrder.set(order);
    this.isDeliveryEvidenceOpen.set(true);
    this.isLoadingDeliveryEvidence.set(true);
    this.ordersService
      .downloadDeliveryEvidence(order.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingDeliveryEvidence.set(false)),
      )
      .subscribe({
        next: (blob) => {
          this.deliveryEvidencePreviewObjectUrl = URL.createObjectURL(blob);
          this.deliveryEvidencePreviewUrl.set(this.deliveryEvidencePreviewObjectUrl);
        },
        error: () => this.deliveryEvidencePreviewUrl.set(null),
      });
  }

  private clearFilePreview(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
      this.filePreviewUrl = null;
    }
    this.selectedFilePreviewUrl.set(null);
    this.isLoadingFilePreview.set(false);
  }

  private clearDeliveryEvidencePreview(): void {
    if (this.deliveryEvidencePreviewObjectUrl) {
      URL.revokeObjectURL(this.deliveryEvidencePreviewObjectUrl);
      this.deliveryEvidencePreviewObjectUrl = null;
    }
    this.deliveryEvidencePreviewUrl.set(null);
    this.isLoadingDeliveryEvidence.set(false);
  }

  isBusy(): boolean {
    return this.isSaving() || this.isLoading();
  }
}
