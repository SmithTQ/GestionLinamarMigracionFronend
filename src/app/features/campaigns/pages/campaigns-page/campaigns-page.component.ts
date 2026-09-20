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
import { CustomerInvitationModalComponent } from '@features/campaigns/components/customer-invitation-modal/customer-invitation-modal.component';
import { DistrictList } from '@features/districts/models/district.model';
import { DistrictsService } from '@features/districts/services/districts.service';
import { CampaignPublicationFacade } from '@features/campaigns/services/campaign-publication.facade';
import { CampaignManagementFacade } from '@features/campaigns/services/campaign-management.facade';
import { CustomerInvitationFacade } from '@features/campaigns/services/customer-invitation.facade';
import { CampaignUsersModalComponent } from '@features/campaigns/components/campaign-users-modal/campaign-users-modal.component';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
import { ApiErrorStore } from '@core/services/api-error.store';

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
    CustomerInvitationModalComponent,
    CampaignUsersModalComponent,
  ],
  templateUrl: './campaigns-page.component.html',
  styleUrls: ['./campaigns-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  private readonly campaignsStore = inject(CampaignsStore);
  private readonly authStore = inject(AuthStore);
  private readonly branchContext = inject(BranchContextStore);
  private readonly apiErrorStore = inject(ApiErrorStore);
  private readonly districtsService = inject(DistrictsService);
  private readonly campaignManagementFacade = inject(CampaignManagementFacade);
  private readonly publicationFacade = inject(CampaignPublicationFacade);
  private readonly invitationFacade = inject(CustomerInvitationFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly isCreateModalOpen = signal(false);
  readonly isConfirmationOpen = signal(false);
  readonly isFormBuilderOpen = signal(false);
  readonly isCloseConfirmationOpen = signal(false);
  readonly isInvitationOpen = signal(false);
  readonly isCampaignUsersOpen = signal(false);
  readonly lastCreatedCampaignId = signal<number | null>(null);
  readonly formCampaign = signal<Campaign | null>(null);
  readonly editingCampaign = signal<Campaign | null>(null);
  readonly campaignToClose = signal<Campaign | null>(null);
  readonly campaignForUsers = signal<Campaign | null>(null);
  readonly nameError = signal<string | undefined>(undefined);
  readonly campaignDetailError = signal<string | undefined>(undefined);
  readonly isLoadingCampaignDetail = this.campaignManagementFacade.isLoadingDetail;
  readonly isCreating = this.campaignManagementFacade.isSaving;
  readonly isMutating = signal(false);
  readonly isCreatingInvitation = this.invitationFacade.isSaving;
  readonly isLoadingInvitation = this.invitationFacade.isLoading;
  readonly invitationError = this.invitationFacade.error;
  readonly invitation = this.invitationFacade.invitation;
  readonly pageSize = signal(10);
  readonly sort = signal<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined);
  readonly filterValues = signal<Record<string, string>>({});
  readonly districtLists = signal<DistrictList[]>([]);
  readonly catalogError = signal<string | null>(null);
  readonly formStatuses = signal<Record<number, NonNullable<Campaign['formStatus']>>>({});
  readonly canManage = computed(() => this.authStore.hasPermission('campaigns.manage'));
  readonly canViewCampaignUsers = computed(() =>
    this.authStore.hasPermission('campaigns.users.view'),
  );
  readonly canManageCampaignUsers = computed(() =>
    this.authStore.hasPermission('campaigns.users.manage'),
  );
  readonly activeBranch = this.branchContext.activeBranch;

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
    { key: 'formStatus', label: 'Formulario', sortable: false, filterable: false, type: 'badge' },
  ];

  readonly campaigns = this.campaignsStore.campaigns;
  readonly isLoading = this.campaignsStore.isLoading;
  readonly loadError = this.campaignsStore.error;
  readonly rows = computed(() =>
    this.campaigns().map((campaign) => ({
      id: campaign.code,
      campaignId: campaign.id,
      name: campaign.name,
      budget: formatCurrency(campaign.budget),
      startDate: campaign.startsOn,
      endDate: campaign.endsOn ?? '-',
      ordersCount: (campaign.ordersCount ?? 0).toLocaleString('es-PE'),
      deliveredCount: (campaign.deliveredCount ?? 0).toLocaleString('es-PE'),
      totalObtained: formatCurrency(campaign.totalObtained),
      status: this.formatStatus(campaign.status),
      formStatus: this.formatFormStatus(
        this.formStatuses()[campaign.id] ?? campaign.formStatus,
        campaign.hasPublishedForm,
      ),
      formPublished:
        campaign.hasPublishedForm === true || this.formStatuses()[campaign.id] === 'published',
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
      return this.canViewCampaignUsers()
        ? [viewAction, { id: 'users', label: 'Usuarios', variant: 'ghost', icon: 'circle-user' }]
        : [viewAction];
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
      {
        id: 'form',
        label: 'Formulario',
        variant: 'ghost',
        icon: 'file-text',
        disabled: this.isMutating(),
      },
      ...(this.canViewCampaignUsers()
        ? [{ id: 'users', label: 'Usuarios', variant: 'ghost' as const, icon: 'circle-user' }]
        : []),
      {
        id: 'invite',
        label: 'Invitar',
        variant: 'ghost',
        icon: 'send',
        disabled: this.isMutating(),
        hidden: (row) => row['formPublished'] !== true,
      },
      { id: 'close', label: 'Cerrar', variant: 'outline', icon: 'x', disabled: this.isMutating() },
    ];
  });

  constructor() {
    this.loadCampaigns(1);
    this.loadDistrictLists();
  }

  openCreateModal(): void {
    if (!this.activeBranch()) {
      this.apiErrorStore.show('Selecciona una sucursal activa antes de crear una campana.', 'warning');
      return;
    }
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
    const branchId = this.branchContext.activeBranchId();
    if (!branchId) {
      this.apiErrorStore.show('No se encontro una sucursal activa para registrar la campana.', 'warning');
      return;
    }
    const payload: CampaignPayload = {
      code: editingCampaign?.code ?? `CAMP-${Date.now()}`,
      name: form.name,
      status: form.status,
      starts_on: form.startsOn,
      ends_on: form.endsOn,
      branch_id: branchId,
      district_list_ids: form.districtListId ? [form.districtListId] : undefined,
    };

    this.isMutating.set(true);
    this.campaignManagementFacade
      .save(editingCampaign?.id ?? null, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false)),
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

  onFormSaved(): void {
    const campaignId = this.formCampaign()?.id;
    if (!campaignId) return;

    this.formStatuses.update((statuses) => ({ ...statuses, [campaignId]: 'draft' }));
    this.closeFormBuilder();
    this.loadCampaigns(this.campaignsStore.pagination().page);
  }

  onFormPublished(): void {
    const campaignId = this.formCampaign()?.id;
    if (!campaignId) return;
    this.formStatuses.update((statuses) => ({ ...statuses, [campaignId]: 'published' }));
  }

  openCampaignAndPublish(formId: number): void {
    const campaign = this.formCampaign();
    if (!campaign || this.isMutating()) return;
    this.isMutating.set(true);
    this.publicationFacade
      .openAndPublish(campaign.id, formId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe({
        next: (openedCampaign) => {
          this.formCampaign.set(openedCampaign);
          this.formStatuses.update((statuses) => ({ ...statuses, [campaign.id]: 'published' }));
          this.closeFormBuilder();
          this.loadCampaigns(this.campaignsStore.pagination().page);
        },
        error: () => {
          this.catalogError.set('No se pudo abrir la campaña y publicar el formulario.');
        },
      });
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
    if (event.action.id === 'invite') {
      this.openInvitation(campaign);
    }
    if (event.action.id === 'users') {
      this.openCampaignUsers(campaign);
    }
  }

  openCampaignUsers(campaign: Campaign): void {
    this.campaignForUsers.set(campaign);
    this.isCampaignUsersOpen.set(true);
  }

  closeCampaignUsers(): void {
    this.isCampaignUsersOpen.set(false);
    this.campaignForUsers.set(null);
  }

  openInvitation(campaign: Campaign): void {
    this.isInvitationOpen.set(true);
    this.invitationFacade.open(campaign.id);
  }

  closeInvitation(): void {
    if (this.isCreatingInvitation() || this.isLoadingInvitation()) return;
    this.isInvitationOpen.set(false);
    this.invitationFacade.close();
  }

  createInvitation(value: {
    fullName: string;
    whatsappNumber: string;
    email: string;
    expiresAt: string;
  }): void {
    this.invitationFacade.create(value);
  }

  openEditModal(campaign: Campaign): void {
    this.nameError.set(undefined);
    this.campaignDetailError.set(undefined);
    this.editingCampaign.set(campaign);
    this.isCreateModalOpen.set(true);
    this.isMutating.set(true);
    this.campaignManagementFacade
      .loadDetail(campaign.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.editingCampaign.set(detail);
        },
        error: () =>
          this.campaignDetailError.set(
            this.campaignManagementFacade.error() ?? 'No se pudo cargar el detalle de la campaña.',
          ),
      });
  }

  closeCloseConfirmation(force = false): void {
    if (this.isMutating() && !force) {
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
    this.campaignManagementFacade
      .close(campaign.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe({
        next: () => {
          const current = this.campaignsStore.pagination();
          this.loadCampaigns(current.page);
          this.closeCloseConfirmation(true);
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
      branchId: this.branchContext.activeBranchId() ?? undefined,
    };
    this.campaignsStore.load(query);
  }

  private loadDistrictLists(): void {
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

  private formatFormStatus(status: Campaign['formStatus'], hasPublishedForm = false): string {
    if (hasPublishedForm || status === 'published') return 'Publicado';
    if (status === 'draft') return 'Borrador';
    if (status === 'closed') return 'Cerrado';
    return 'Sin formulario';
  }
}

function formatCurrency(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `S/ ${value.toFixed(2)}` : '-';
}
