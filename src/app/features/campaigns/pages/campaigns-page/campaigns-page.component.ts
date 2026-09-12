import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignPayload } from '@features/campaigns/services/campaign.dto';
import { CampaignListQuery } from '@features/campaigns/services/campaigns.service';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';
import { AuthStore } from '@features/auth/store/auth.store';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  CampaignCreateModalComponent,
  CampaignFormValue,
} from '@features/campaigns/components/campaign-create-modal/campaign-create-modal.component';
import { CampaignFormBuilderModalComponent } from '@features/campaigns/components/campaign-form-builder-modal/campaign-form-builder-modal.component';
import { DistrictList } from '@features/districts/models/district.model';
import { DistrictsService } from '@features/districts/services/districts.service';

@Component({
  selector: 'app-campaigns-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    TableComponent,
    ButtonComponent,
    ModalComponent,
    CampaignCreateModalComponent,
    CampaignFormBuilderModalComponent,
  ],
  templateUrl: './campaigns-page.component.html',
  styleUrls: ['./campaigns-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  private readonly campaignsStore = inject(CampaignsStore);
  private readonly authStore = inject(AuthStore);
  private readonly districtsService = inject(DistrictsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isCreateModalOpen = signal(false);
  readonly isConfirmationOpen = signal(false);
  readonly isFormBuilderOpen = signal(false);
  readonly isCloseConfirmationOpen = signal(false);
  readonly lastCreatedCampaignId = signal<number | null>(null);
  readonly formCampaign = signal<Campaign | null>(null);
  readonly editingCampaign = signal<Campaign | null>(null);
  readonly campaignToClose = signal<Campaign | null>(null);
  readonly nameError = signal<string | undefined>(undefined);
  readonly campaignDetailError = signal<string | undefined>(undefined);
  readonly isLoadingCampaignDetail = signal(false);
  readonly isCreating = signal(false);
  readonly isMutating = signal(false);
  readonly pageSize = signal(10);
  readonly sort = signal<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined);
  readonly filterValues = signal<Record<string, string>>({});
  readonly districtLists = signal<DistrictList[]>([]);
  readonly catalogError = signal<string | null>(null);
  readonly canManage = computed(() => this.authStore.hasPermission('campaigns.manage'));

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'Cod.', sortable: true, filterable: true },
    { key: 'name', label: 'Campana', sortable: true, filterable: true },
    { key: 'budget', label: 'Presup.', sortable: false, filterable: false, align: 'right' },
    { key: 'startDate', label: 'Inicio', sortable: true, filterable: true },
    { key: 'endDate', label: 'Fin', sortable: true, filterable: true },
    { key: 'ordersCount', label: 'Pedidos', sortable: false, filterable: false, align: 'right' },
    {
      key: 'deliveredCount',
      label: 'Entregados',
      sortable: false,
      filterable: false,
      align: 'right',
    },
    {
      key: 'totalObtained',
      label: 'Total (S/)',
      sortable: false,
      filterable: false,
      align: 'right',
    },
    { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'badge' },
  ];

  readonly campaigns = this.campaignsStore.campaigns;
  readonly isLoading = this.campaignsStore.isLoading;
  readonly loadError = this.campaignsStore.error;
  readonly rows = computed(() =>
    this.campaigns().map((campaign) => ({
      id: campaign.code,
      campaignId: campaign.id,
      name: campaign.name,
      budget: campaign.budget === undefined ? '-' : `S/ ${campaign.budget.toFixed(2)}`,
      startDate: campaign.startsOn,
      endDate: campaign.endsOn ?? '-',
      ordersCount: (campaign.ordersCount ?? 0).toLocaleString('es-PE'),
      deliveredCount: (campaign.deliveredCount ?? 0).toLocaleString('es-PE'),
      totalObtained:
        campaign.totalObtained === undefined ? '-' : `S/ ${campaign.totalObtained.toFixed(2)}`,
      status: this.formatStatus(campaign.status),
    })),
  );

  readonly pagination = computed<TablePagination>(() => {
    const page = this.campaignsStore.pagination();
    return {
      page: page.page,
      pageSize: this.pageSize(),
      total: page.total,
      lastPage: page.totalPages,
      pageSizeOptions: [10, 25, 50],
    };
  });

  readonly actions = computed<TableAction[]>(() => {
    const viewAction: TableAction = {
      id: 'view',
      label: 'Ver',
      variant: 'ghost',
      icon: 'eye',
      disabled: true,
    };
    if (!this.canManage()) {
      return [viewAction];
    }
    return [
      viewAction,
      {
        id: 'edit',
        label: 'Editar',
        variant: 'ghost',
        icon: 'file-pen-line',
        disabled: this.isMutating(),
      },
      { id: 'close', label: 'Cerrar', variant: 'outline', icon: 'x', disabled: this.isMutating() },
      {
        id: 'form',
        label: 'Formulario',
        variant: 'ghost',
        icon: 'file-text',
        disabled: this.isMutating(),
      },
    ];
  });

  constructor() {
    this.loadCampaigns(1);
    this.loadCampaignCatalogs();
  }

  openCreateModal(): void {
    this.nameError.set(undefined);
    this.campaignDetailError.set(undefined);
    this.editingCampaign.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(force = false): void {
    if (!force && (this.isCreating() || this.isLoadingCampaignDetail())) {
      return;
    }
    this.isCreateModalOpen.set(false);
    this.nameError.set(undefined);
    this.campaignDetailError.set(undefined);
  }

  saveCampaign(form: CampaignFormValue): void {
    if (!form.name) {
      this.nameError.set('Ingresa un nombre de campana.');
      return;
    }

    const editingCampaign = this.editingCampaign();
    const payload: CampaignPayload = {
      code: editingCampaign?.code ?? `CAMP-${Date.now()}`,
      name: form.name,
      status: form.status,
      starts_on: form.startsOn,
      ends_on: form.endsOn,
      branch_ids: form.branchIds.length ? form.branchIds : undefined,
      district_list_ids: form.districtListId ? [form.districtListId] : undefined,
    };

    this.isCreating.set(true);
    this.isMutating.set(true);
    const request = editingCampaign
      ? this.campaignsStore.update(editingCampaign.id, payload)
      : this.campaignsStore.create(payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isCreating.set(false);
          this.isMutating.set(false);
        }),
      )
      .subscribe({
        next: (campaign) => {
          const current = this.campaignsStore.pagination();
          this.loadCampaigns(current.page);
          this.closeCreateModal(true);
          this.editingCampaign.set(null);
          if (editingCampaign) {
            return;
          }
          this.lastCreatedCampaignId.set(campaign.id);
          this.formCampaign.set(campaign);
          this.isConfirmationOpen.set(true);
        },
        error: () => undefined,
      });
  }

  closeConfirmation(): void {
    this.isConfirmationOpen.set(false);
  }

  openFormBuilder(campaign?: Campaign): void {
    this.closeConfirmation();
    if (campaign) {
      this.formCampaign.set(campaign);
    }
    this.isFormBuilderOpen.set(true);
  }

  closeFormBuilder(): void {
    this.isFormBuilderOpen.set(false);
  }

  onAction(event: { action: TableAction; row: Record<string, unknown> }): void {
    const campaignId = Number(event.row['campaignId']);
    const campaign = this.campaigns().find((item) => item.id === campaignId);
    if (!campaign) {
      return;
    }
    if (event.action.id === 'edit') {
      this.openEditModal(campaign);
    }
    if (event.action.id === 'close') {
      this.campaignToClose.set(campaign);
      this.isCloseConfirmationOpen.set(true);
    }
    if (event.action.id === 'form') {
      this.openFormBuilder(campaign);
    }
  }

  openEditModal(campaign: Campaign): void {
    this.nameError.set(undefined);
    this.campaignDetailError.set(undefined);
    this.editingCampaign.set(campaign);
    this.isCreateModalOpen.set(true);
    this.isLoadingCampaignDetail.set(true);
    this.isMutating.set(true);
    this.campaignsStore
      .get(campaign.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingCampaignDetail.set(false);
          this.isMutating.set(false);
        }),
      )
      .subscribe({
        next: (detail) => {
          this.editingCampaign.set(detail);
        },
        error: () => this.campaignDetailError.set('No se pudo cargar el detalle de la campana.'),
      });
  }

  closeCloseConfirmation(): void {
    if (this.isMutating()) {
      return;
    }
    this.isCloseConfirmationOpen.set(false);
    this.campaignToClose.set(null);
  }

  closeCampaign(): void {
    const campaign = this.campaignToClose();
    if (!campaign) {
      return;
    }
    this.isMutating.set(true);
    this.campaignsStore
      .remove(campaign.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe({
        next: () => {
          const current = this.campaignsStore.pagination();
          this.loadCampaigns(current.page);
          this.closeCloseConfirmation();
        },
        error: () => undefined,
      });
  }

  changePage(page: number): void {
    this.loadCampaigns(page);
  }

  changePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.loadCampaigns(1);
  }

  changeSort(sort: { key: string; direction: 'asc' | 'desc' }): void {
    this.sort.set(sort);
    this.loadCampaigns(1);
  }

  changeFilter(filter: { key: string; value: string }): void {
    this.filterValues.update((filters) => {
      const nextFilters = { ...filters, [filter.key]: filter.value };
      if (filter.key === 'id' && filter.value.trim()) {
        nextFilters['name'] = '';
      }
      if (filter.key === 'name' && filter.value.trim()) {
        nextFilters['id'] = '';
      }
      return nextFilters;
    });
    this.loadCampaigns(1);
  }

  private loadCampaigns(page: number): void {
    const query: CampaignListQuery = {
      page,
      pageSize: this.pageSize(),
      sort: this.sort(),
      filters: this.filterValues(),
    };
    this.campaignsStore.load(query);
  }

  private loadCampaignCatalogs(): void {
    this.districtsService
      .listDistrictLists({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (districtLists) => {
          this.districtLists.set(districtLists.items);
        },
        error: () => this.catalogError.set('No se pudieron cargar las listas de cobertura.'),
      });
  }

  private formatStatus(status: Campaign['status']): string {
    switch (status) {
      case 'open':
        return 'Abierta';
      case 'closed':
        return 'Cerrada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Borrador';
    }
  }
}
