import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { AuthStore } from '@features/auth/store/auth.store';
import { BranchFormModalComponent } from '../../components/branch-form-modal/branch-form-modal.component';
import { Branch, BranchPage, BranchPayload } from '../../models/branch.model';
import { BranchesService } from '../../services/branches.service';
@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [PageContainerComponent, ButtonComponent, TableComponent, BranchFormModalComponent],
  templateUrl: './branches-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchesPageComponent {
  private readonly service = inject(BranchesService);
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly page = signal<BranchPage>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Branch | null>(null);
  readonly mutationError = signal<string | null>(null);
  readonly canManage = this.auth.hasPermission('branches.manage');
  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Sucursal' },
    { key: 'address', label: 'Dirección' },
    { key: 'coordinates', label: 'Ubicación' },
    { key: 'status', label: 'Estado', type: 'badge' },
  ];
  readonly actions: TableAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil', hidden: () => !this.canManage },
    {
      id: 'deactivate',
      label: 'Desactivar',
      icon: 'x',
      variant: 'outline',
      hidden: () => !this.canManage,
    },
  ];
  readonly rows = () =>
    this.page().items.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      address: branch.address ?? '-',
      coordinates:
        branch.latitude !== null && branch.longitude !== null ? 'Configurada' : 'Pendiente',
      status: branch.isActive ? 'Activa' : 'Inactiva',
      branch,
    }));
  readonly pagination = (): TablePagination => ({
    page: this.page().page,
    pageSize: this.page().pageSize,
    total: this.page().total,
    lastPage: this.page().totalPages,
    pageSizeOptions: [10, 25, 50],
  });
  constructor() {
    this.load();
  }
  load(page = this.page().page, pageSize = this.page().pageSize): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list(page, pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => this.page.set(result),
        error: (error) => this.error.set(message(error, 'No se pudieron cargar las sucursales.')),
      });
  }
  openCreate(): void {
    this.editing.set(null);
    this.mutationError.set(null);
    this.modalOpen.set(true);
  }
  closeModal(): void {
    if (!this.saving()) this.modalOpen.set(false);
  }
  save(payload: BranchPayload): void {
    const branch = this.editing();
    this.saving.set(true);
    this.mutationError.set(null);
    const request = branch ? this.service.update(branch.id, payload) : this.service.create(payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.modalOpen.set(false);
          this.load();
        },
        error: (error) => this.mutationError.set(message(error, 'No se pudo guardar la sucursal.')),
      });
  }
  action(event: { action: TableAction; row: Record<string, unknown> }): void {
    const branch = event.row['branch'] as Branch;
    if (event.action.id === 'edit') {
      this.editing.set(branch);
      this.mutationError.set(null);
      this.modalOpen.set(true);
      return;
    }
    if (event.action.id === 'deactivate')
      this.service
        .deactivate(branch.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.load(),
          error: (error) => this.error.set(message(error, 'No se pudo desactivar la sucursal.')),
        });
  }
}
function message(error: unknown, fallback: string): string {
  return (error as { error?: { mensaje?: string } }).error?.mensaje ?? fallback;
}
