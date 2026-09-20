import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import {
  CourierInvitation,
  DeliveryRoute,
  GenerateRoutePayload,
  RouteOrigin,
  RouteMapOrder,
  RoutePreview,
  isRouteOrderSelectable,
} from '../../models/delivery-route.model';
import { DispatchService } from '../../services/dispatch.service';
import { DispatchStore } from '../../store/dispatch.store';
import { RouteGeneratorModalComponent } from '../../components/route-generator-modal/route-generator-modal.component';
import { RouteOrdersMapComponent } from '../../components/route-orders-map/route-orders-map.component';
import {
  CourierInvitationFormValue,
  CourierInvitationModalComponent,
} from '../../components/courier-invitation-modal/courier-invitation-modal.component';

@Component({
  selector: 'app-routes-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    TableComponent,
    ButtonComponent,
    ModalComponent,
    RouteGeneratorModalComponent,
    RouteOrdersMapComponent,
    CourierInvitationModalComponent,
  ],
  templateUrl: './routes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutesPageComponent {
  private readonly store = inject(DispatchStore);
  private readonly service = inject(DispatchService);
  readonly context = inject(CampaignContextStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly routes = this.store.page;
  readonly loading = this.store.loading;
  readonly loadError = this.store.error;
  readonly generatorOpen = signal(false);
  readonly mapOrders = signal<RouteMapOrder[]>([]);
  readonly mapOrdersLoading = signal(false);
  readonly mapOrdersError = signal<string | null>(null);
  readonly selectedOrderIds = signal<number[]>([]);
  readonly routePreview = signal<RoutePreview | null>(null);
  readonly selectedOrders = computed(() => {
    const ordersById = new Map(this.mapOrders().map((order) => [order.id, order]));
    return this.selectedOrderIds().flatMap((id) => {
      const order = ordersById.get(id);
      return order ? [order] : [];
    });
  });
  readonly pendingRouteCount = computed(
    () => this.mapOrders().filter(isRouteOrderSelectable).length,
  );
  readonly assignedRouteCount = computed(
    () => this.mapOrders().filter((order) => order.activeRoute !== null).length,
  );
  readonly assignRoute = signal<DeliveryRoute | null>(null);
  readonly routeToCancel = signal<DeliveryRoute | null>(null);
  readonly courierInvitation = signal<CourierInvitation | null>(null);
  readonly saving = signal(false);
  readonly mutationError = signal<string | null>(null);
  readonly routeOrigin = computed<RouteOrigin | null>(() => {
    const branch = this.context.activeCampaign()?.branch;
    if (!branch || !Number.isFinite(branch.latitude) || !Number.isFinite(branch.longitude)) {
      return null;
    }
    return {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      latitude: branch.latitude!,
      longitude: branch.longitude!,
    };
  });
  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Código', sortable: false },
    { key: 'name', label: 'Ruta', sortable: false },
    { key: 'branch', label: 'Sucursal', sortable: false },
    { key: 'courier', label: 'Motorizado', sortable: false },
    { key: 'orders', label: 'Pedidos', align: 'right', sortable: false },
    { key: 'distance', label: 'Distancia', align: 'right', sortable: false },
    { key: 'duration', label: 'Tiempo est.', align: 'right', sortable: false },
    { key: 'status', label: 'Estado', type: 'badge', sortable: false },
  ];
  readonly actions: TableAction[] = [
    {
      id: 'navigate',
      label: 'Abrir navegación',
      icon: 'navigation',
      variant: 'ghost',
      hidden: (row) => !(row['route'] as DeliveryRoute).navigationUrl,
    },
    {
      id: 'assignCourier',
      label: 'Asignar y compartir',
      icon: 'circle-user',
      variant: 'ghost',
      hidden: (row) =>
        !!(row['route'] as DeliveryRoute).courier ||
        ['dispatched', 'completed', 'cancelled'].includes(String(row['statusKey'])),
    },
    {
      id: 'resendCourierAccess',
      label: 'Reenviar acceso',
      icon: 'send',
      variant: 'ghost',
      hidden: (row) =>
        !(row['route'] as DeliveryRoute).courier ||
        ['dispatched', 'completed', 'cancelled'].includes(String(row['statusKey'])),
    },
    {
      id: 'cancel',
      label: 'Cancelar ruta',
      icon: 'x',
      variant: 'outline',
      hidden: (row) => ['dispatched', 'completed', 'cancelled'].includes(String(row['statusKey'])),
    },
  ];
  readonly pagination = (): TablePagination => ({
    page: this.routes().page,
    pageSize: this.routes().pageSize,
    total: this.routes().total,
    lastPage: this.routes().totalPages,
    pageSizeOptions: [10, 25, 50],
  });
  readonly rows = () =>
    this.routes().items.map((route) => ({
      id: route.id,
      code: route.code,
      name: route.name,
      branch: route.branch?.name ?? '-',
      courier: route.courier?.name ?? 'Sin asignar',
      orders: route.activeOrdersCount,
      distance: route.totalDistanceKm === null || route.totalDistanceKm === undefined ? '-' : `${route.totalDistanceKm} km`,
      duration: route.estimatedMinutes === null || route.estimatedMinutes === undefined ? '-' : `${route.estimatedMinutes} min`,
      status: formatStatus(route.status),
      statusKey: route.status,
      route,
    }));
  constructor() {
    effect(() => {
      const campaignId = this.context.activeCampaignId();
      untracked(() => {
        this.store.load();
        this.loadMapOrders(campaignId);
      });
    });
  }
  openGenerator(): void {
    if (this.selectedOrderIds().length === 0) return;
    this.mutationError.set(null);
    this.generatorOpen.set(true);
  }
  closeGenerator(): void {
    if (!this.saving()) this.generatorOpen.set(false);
  }
  generate(payload: GenerateRoutePayload): void {
    this.saving.set(true);
    this.mutationError.set(null);
    this.service
      .generate(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (route) => {
          this.generatorOpen.set(false);
          this.selectedOrderIds.set([]);
          this.loadMapOrders(this.context.activeCampaignId());
          this.store.load();
        },
        error: (error) => {
          this.mutationError.set(getApiErrorMessage(error, 'No se pudo generar la ruta.'));
          if (isConflict(error)) this.loadMapOrders(this.context.activeCampaignId());
        },
      });
  }
  openAssign(row: Record<string, unknown>): void {
    const route = row['route'] as DeliveryRoute;
    this.assignRoute.set(route);
    this.courierInvitation.set(null);
    this.mutationError.set(null);
  }
  closeAssign(): void {
    if (this.saving()) return;
    this.assignRoute.set(null);
    this.courierInvitation.set(null);
  }
  createCourierInvitation(value: CourierInvitationFormValue): void {
    const route = this.assignRoute();
    if (!route || !value.name || !value.whatsappNumber || this.saving()) return;
    this.saving.set(true);
    this.mutationError.set(null);
    this.service
      .createCourierInvitation(route.id, {
        name: value.name,
        whatsapp_number: value.whatsappNumber,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (invitation) => {
          this.courierInvitation.set(invitation);
          this.store.load();
          this.loadMapOrders(this.context.activeCampaignId());
        },
        error: (error) =>
          this.mutationError.set(getApiErrorMessage(error, 'No se pudo generar la invitacion.')),
      });
  }
  onAction(event: { action: TableAction; row: Record<string, unknown> }): void {
    if (event.action.id === 'navigate') {
      this.openNavigation(event.row);
      return;
    }
    if (event.action.id === 'assignCourier' || event.action.id === 'resendCourierAccess') {
      this.openAssign(event.row);
    }
    if (event.action.id === 'cancel') this.routeToCancel.set(event.row['route'] as DeliveryRoute);
  }

  closeCancel(): void {
    if (!this.saving()) this.routeToCancel.set(null);
  }

  cancelRoute(): void {
    const route = this.routeToCancel();
    if (!route || this.saving()) return;

    this.saving.set(true);
    this.mutationError.set(null);
    this.service
      .changeStatus(route.id, 'cancelled')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.routeToCancel.set(null);
          this.store.load();
          this.loadMapOrders(this.context.activeCampaignId());
        },
        error: (error) => this.mutationError.set(readError(error)),
      });
  }

  private openNavigation(row: Record<string, unknown>): void {
    const url = (row['route'] as DeliveryRoute).navigationUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }
  changePage(page: number): void {
    this.store.load(page);
  }
  changePageSize(pageSize: number): void {
    this.store.load(1, pageSize);
  }

  toggleOrder(orderId: number): void {
    const order = this.mapOrders().find((item) => item.id === orderId);
    if (!order || !isRouteOrderSelectable(order)) return;
    this.selectedOrderIds.update((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  }

  onPreviewChanged(preview: RoutePreview | null): void {
    this.routePreview.set(preview);
  }

  private loadMapOrders(campaignId: number | null): void {
    this.mapOrders.set([]);
    this.selectedOrderIds.set([]);
    this.routePreview.set(null);
    if (!campaignId) return;
    this.mapOrdersLoading.set(true);
    this.mapOrdersError.set(null);
    this.service
      .listAllMapOrders(campaignId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.mapOrdersLoading.set(false)),
      )
      .subscribe({
        next: (page) => this.mapOrders.set(page.items),
        error: (error) => this.mapOrdersError.set(readError(error)),
      });
  }
}
function isConflict(error: unknown): boolean {
  return (error as { status?: unknown })?.status === 409;
}

function formatStatus(status: string): string {
  return (
    {
      draft: 'Borrador',
      planned: 'Planificada',
      assigned: 'Asignada',
      dispatched: 'Despachada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    }[status] ?? status
  );
}
function readError(error: unknown): string {
  const candidate = error as { error?: { mensaje?: string } };
  return candidate?.error?.mensaje ?? 'No se pudo completar la operación.';
}
