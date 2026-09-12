import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, forkJoin } from 'rxjs';
import { AuthStore } from '@features/auth/store/auth.store';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { District, DistrictList, LocationOption } from '../../models/district.model';
import { DistrictListPayload, DistrictPayload } from '../../services/district.dto';
import { DistrictListQuery, DistrictsService } from '../../services/districts.service';
import { DistrictsStore } from '../../store/districts.store';
import {
  DistrictFormModalComponent,
  DistrictFormValue,
} from '../../components/district-form-modal/district-form-modal.component';
import {
  DistrictListFormModalComponent,
  DistrictListFormValue,
} from '../../components/district-list-form-modal/district-list-form-modal.component';

type ViewMode = 'districts' | 'lists';

@Component({
  selector: 'app-districts-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    ButtonComponent,
    ModalComponent,
    TableComponent,
    DistrictFormModalComponent,
    DistrictListFormModalComponent,
  ],
  templateUrl: './districts-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictsPageComponent {
  private readonly store = inject(DistrictsStore);
  private readonly service = inject(DistrictsService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<ViewMode>('districts');
  readonly districtModalOpen = signal(false);
  readonly listModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly editingDistrict = signal<District | null>(null);
  readonly editingList = signal<DistrictList | null>(null);
  readonly itemToDelete = signal<{ type: ViewMode; id: number; name: string } | null>(null);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly pageSize = signal(10);
  readonly sort = signal<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined);
  readonly filters = signal<Record<string, string>>({});
  readonly districtOptions = signal<District[]>([]);
  readonly departments = signal<LocationOption[]>([]);
  readonly provinces = signal<LocationOption[]>([]);
  readonly defaultDepartmentCode = signal('');
  readonly optionsLoading = signal(false);
  private readonly districtOptionsCache = new Map<string, District[]>();
  private readonly provinceOptionsCache = new Map<string, LocationOption[]>();
  private districtOptionsRequestId = 0;
  readonly canManage = computed(() => this.authStore.hasPermission('district_lists.manage'));

  readonly districtColumns: TableColumn[] = [
    { key: 'code', label: 'Codigo UBIGEO', sortable: true, filterable: true },
    { key: 'name', label: 'Distrito', sortable: true, filterable: true },
    { key: 'province', label: 'Provincia', sortable: true, filterable: false },
    { key: 'department', label: 'Departamento', sortable: true, filterable: true },
    { key: 'status', label: 'Estado', sortable: true, filterable: false, type: 'badge' },
  ];

  readonly listColumns: TableColumn[] = [
    { key: 'code', label: 'Codigo', sortable: true, filterable: true },
    { key: 'name', label: 'Lista', sortable: true, filterable: true },
    { key: 'description', label: 'Descripcion', sortable: false, filterable: false },
    {
      key: 'districtCount',
      label: 'Distritos',
      sortable: false,
      filterable: false,
      align: 'right',
    },
    { key: 'status', label: 'Estado', sortable: true, filterable: false, type: 'badge' },
  ];

  readonly districts = this.store.districts;
  readonly districtLists = this.store.districtLists;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  readonly districtRows = computed(() =>
    this.districts().map((district) => ({
      id: district.id,
      code: district.code,
      name: district.name,
      province: district.province,
      department: district.department,
      status: district.isActive ? 'Activo' : 'Inactivo',
    })),
  );

  readonly listRows = computed(() =>
    this.districtLists().map((list) => ({
      id: list.id,
      code: list.code,
      name: list.name,
      description: list.description ?? '-',
      districtCount: list.districtCount ?? list.districts.length,
      status: list.isActive ? 'Activa' : 'Inactiva',
    })),
  );

  readonly pagination = computed<TablePagination>(() => {
    const page =
      this.mode() === 'districts' ? this.store.districtPage() : this.store.districtListPage();
    return {
      page: page.page,
      pageSize: this.pageSize(),
      total: page.total,
      lastPage: page.totalPages,
      pageSizeOptions: [10, 25, 50],
    };
  });

  readonly actions = computed<TableAction[]>(() => {
    if (!this.canManage()) {
      return [];
    }
    return [
      {
        id: 'edit',
        label: 'Editar',
        icon: 'file-pen-line',
        variant: 'ghost',
        disabled: this.mode() === 'districts',
      },
      { id: 'delete', label: 'Desactivar', icon: 'x', variant: 'outline' },
    ];
  });

  constructor() {
    this.loadDistricts(1);
  }

  changeMode(mode: ViewMode): void {
    this.mode.set(mode);
    this.pageSize.set(10);
    this.sort.set(undefined);
    this.filters.set({});
    if (mode === 'districts') {
      this.loadDistricts(1);
    } else {
      this.loadDistrictLists(1);
    }
  }

  openCreate(): void {
    if (this.mode() === 'districts') {
      return;
    }
    this.editingList.set(null);
    this.listModalOpen.set(true);
    this.loadLocationOptions();
  }

  closeModals(): void {
    this.districtModalOpen.set(false);
    this.listModalOpen.set(false);
    this.editingDistrict.set(null);
    this.editingList.set(null);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }
    this.deleteModalOpen.set(false);
  }

  onAction(event: { action: TableAction; row: Record<string, unknown> }): void {
    const id = Number(event.row['id']);
    if (!id) {
      return;
    }
    if (event.action.id === 'edit') {
      if (this.mode() === 'districts') {
        return;
      }
      this.openDistrictListForEdit(id);
    }
    if (event.action.id === 'delete') {
      this.itemToDelete.set({
        type: this.mode(),
        id,
        name: String(event.row['name'] ?? event.row['code']),
      });
      this.deleteModalOpen.set(true);
    }
  }

  saveDistrict(value: DistrictFormValue): void {
    const payload: DistrictPayload = value;
    const request = this.editingDistrict()
      ? this.store.updateDistrict(this.editingDistrict()!.id, payload)
      : this.store.createDistrict(payload);
    this.save(request, () => {
      this.closeModals();
      this.loadDistricts(this.store.districtPage().page);
      this.districtOptionsCache.clear();
      this.provinceOptionsCache.clear();
    });
  }

  saveDistrictList(value: DistrictListFormValue): void {
    const payload: DistrictListPayload = {
      code: value.code,
      name: value.name,
      description: value.description || undefined,
      district_ids: value.districtIds,
    };
    const request = this.editingList()
      ? this.store.updateDistrictList(this.editingList()!.id, payload)
      : this.store.createDistrictList(payload);
    this.save(request, () => {
      this.closeModals();
      this.loadDistrictLists(this.store.districtListPage().page);
    });
  }

  confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item) {
      return;
    }
    this.isDeleting.set(true);
    const request =
      item.type === 'districts'
        ? this.store.deleteDistrict(item.id)
        : this.store.deleteDistrictList(item.id);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDeleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.deleteModalOpen.set(false);
          this.itemToDelete.set(null);
          if (item.type === 'districts') {
            this.loadDistricts(this.store.districtPage().page);
            this.districtOptionsCache.clear();
            this.provinceOptionsCache.clear();
          } else {
            this.loadDistrictLists(this.store.districtListPage().page);
          }
        },
        error: () => undefined,
      });
  }

  changePage(page: number): void {
    if (this.mode() === 'districts') {
      this.loadDistricts(page);
    } else {
      this.loadDistrictLists(page);
    }
  }

  changePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.changePage(1);
  }

  changeSort(sort: { key: string; direction: 'asc' | 'desc' }): void {
    this.sort.set(sort);
    this.changePage(1);
  }

  changeFilter(filter: { key: string; value: string }): void {
    this.filters.update((current) => ({ ...current, [filter.key]: filter.value }));
    this.changePage(1);
  }

  private loadDistricts(page: number): void {
    this.store.loadDistricts(this.buildQuery(page));
  }

  private openDistrictListForEdit(id: number): void {
    this.isLoadingDetail.set(true);
    this.loadLocationOptions();
    this.service
      .getDistrictList(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingDetail.set(false)),
      )
      .subscribe({
        next: (list) => {
          this.editingList.set(list);
          this.districtOptions.update((districts) =>
            this.mergeDistricts(districts, list.districts),
          );
          this.listModalOpen.set(true);
        },
        error: () => undefined,
      });
  }

  private loadDistrictLists(page: number): void {
    this.store.loadDistrictLists(this.buildQuery(page));
  }

  private buildQuery(page: number): DistrictListQuery {
    const values = this.filters();
    return {
      page,
      pageSize: this.pageSize(),
      sort: this.sort(),
      search: values['name'] || values['code'],
      department: values['department'],
    };
  }

  onDistrictDepartmentChanged(departmentCode: string): void {
    this.defaultDepartmentCode.set(departmentCode);
    this.loadLocationOptionsForDepartment(departmentCode);
  }

  onDistrictProvinceChanged(provinceCode: string): void {
    this.loadLocationOptionsForDepartment(this.defaultDepartmentCode(), provinceCode);
  }

  private loadLocationOptions(): void {
    if (this.optionsLoading()) {
      return;
    }
    this.optionsLoading.set(true);
    this.service
      .listDepartments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (departments) => {
          this.departments.set(departments);
          const lima = departments.find((department) => department.name === 'Lima');
          if (lima) {
            this.defaultDepartmentCode.set(lima.code);
            this.loadLocationOptionsForDepartment(lima.code);
          } else {
            this.optionsLoading.set(false);
          }
        },
        error: () => this.optionsLoading.set(false),
      });
  }

  private loadLocationOptionsForDepartment(departmentCode: string, provinceCode = ''): void {
    const requestId = ++this.districtOptionsRequestId;
    const cacheKey = `${departmentCode}:${provinceCode}`;
    const cached = this.districtOptionsCache.get(cacheKey);
    if (cached) {
      const cachedProvinces = this.provinceOptionsCache.get(departmentCode);
      if (cachedProvinces) {
        this.provinces.set(cachedProvinces);
      }
      this.districtOptions.set(this.mergeDistricts(cached, this.editingList()?.districts ?? []));
      this.optionsLoading.set(false);
      return;
    }

    this.districtOptions.set([]);
    this.optionsLoading.set(true);
    forkJoin({
      provinces: this.service.listProvinces(departmentCode),
      districts: this.service.listAllActiveDistricts(departmentCode, provinceCode),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (requestId === this.districtOptionsRequestId) {
            this.optionsLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ provinces, districts }) => {
          if (requestId !== this.districtOptionsRequestId) {
            return;
          }
          this.provinceOptionsCache.set(departmentCode, provinces);
          this.provinces.set(provinces);
          this.districtOptionsCache.set(cacheKey, districts);
          this.districtOptions.set(
            this.mergeDistricts(districts, this.editingList()?.districts ?? []),
          );
        },
        error: () => undefined,
      });
  }

  private mergeDistricts(districts: District[], selectedDistricts: District[]): District[] {
    const merged = new Map(districts.map((district) => [district.id, district]));
    selectedDistricts.forEach((district) => merged.set(district.id, district));
    return [...merged.values()];
  }

  private save<T>(request: Observable<T>, onSuccess: () => void): void {
    this.isSaving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({ next: onSuccess, error: () => undefined });
  }
}
