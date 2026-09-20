import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { BranchesService } from '@features/branches/services/branches.service';
import { Branch } from '@features/branches/models/branch.model';
import { UserFormModalComponent } from '../../components/user-form-modal/user-form-modal.component';
import { ManagedUser, Role, UserPage, UserPayload } from '../../models/user.model';
import { UsersService } from '../../services/users.service';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { AuthStore } from '@features/auth/store/auth.store';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [PageContainerComponent, ButtonComponent, TableComponent, UserFormModalComponent],
  templateUrl: './users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  private readonly service = inject(UsersService);
  private readonly branchesService = inject(BranchesService);
  private readonly authStore = inject(AuthStore);
  private readonly branchContext = inject(BranchContextStore);
  private readonly destroy = inject(DestroyRef);
  readonly page = signal<UserPage>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly modal = signal(false);
  readonly editing = signal<ManagedUser | null>(null);
  readonly roles = signal<Role[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly isOperationalAdmin = computed(
    () => this.authStore.user()?.operational_context?.mode === 'branch_admin',
  );
  readonly activeBranch = this.branchContext.activeBranch;
  readonly dispatcherRole = computed(
    () => this.roles().find((role) => role.slug === 'dispatcher') ?? null,
  );
  readonly assignableRoles = computed(() =>
    this.isOperationalAdmin()
      ? this.roles().filter((role) => role.slug === 'dispatcher')
      : this.roles(),
  );
  readonly fixedRoleId = computed(() =>
    this.isOperationalAdmin() ? (this.dispatcherRole()?.id ?? null) : null,
  );
  readonly lockedBranchId = computed(() =>
    this.isOperationalAdmin() ? (this.activeBranch()?.id ?? null) : null,
  );
  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Usuario' },
    { key: 'email', label: 'Correo' },
    { key: 'roles', label: 'Roles' },
    { key: 'status', label: 'Estado', type: 'badge' },
  ];
  readonly actions: TableAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'deactivate', label: 'Desactivar', icon: 'x', variant: 'outline' },
  ];
  readonly rows = () =>
    this.page().items.map((u) => ({
      id: u.id,
      name: `${u.name} (${u.username})`,
      email: u.email,
      roles: u.roles.map((r) => r.name).join(', ') || '-',
      status: u.isActive ? 'Activo' : 'Inactivo',
      user: u,
    }));
  readonly pagination = (): TablePagination => ({
    page: this.page().page,
    pageSize: this.page().pageSize,
    total: this.page().total,
    lastPage: this.page().totalPages,
    pageSizeOptions: [10, 25, 50],
  });
  constructor() {
    this.service
      .roles()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
          this.load(1);
        },
        error: () => this.error.set('No se pudieron cargar los roles disponibles.'),
      });

    if (!this.isOperationalAdmin()) {
      this.branchesService
        .list(1, 100)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (branches) => this.branches.set(branches.items),
          error: () => this.error.set('No se pudieron cargar las sucursales disponibles.'),
        });
    }
  }
  load(page = this.page().page, size = this.page().pageSize): void {
    const branchId = this.lockedBranchId();
    const dispatcherRoleId = this.fixedRoleId();
    if (this.isOperationalAdmin() && (!branchId || !dispatcherRoleId)) {
      this.page.set({ items: [], page: 1, pageSize: size, total: 0, totalPages: 1 });
      this.error.set('No se pudo determinar la sucursal o el rol de Despachador.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service
      .list(page, size, {
        branchId: branchId ?? undefined,
        roleId: dispatcherRoleId ?? undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (x) => this.page.set(x),
        error: () => this.error.set('No se pudieron cargar los usuarios.'),
      });
  }
  open(): void {
    this.editing.set(null);
    this.error.set(null);
    this.modal.set(true);
  }
  save(p: UserPayload): void {
    const u = this.editing();
    const branchId = this.lockedBranchId() ?? undefined;
    this.saving.set(true);
    this.error.set(null);
    (u ? this.service.update(u.id, p, branchId) : this.service.create(p))
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.modal.set(false);
          this.load();
        },
        error: (error: unknown) =>
          this.error.set(getApiErrorMessage(error, 'No se pudo guardar el usuario.')),
      });
  }
  action(e: { action: TableAction; row: Record<string, unknown> }): void {
    const u = e.row['user'] as ManagedUser;
    if (e.action.id === 'edit') {
      this.editing.set(u);
      this.error.set(null);
      this.modal.set(true);
    } else
      this.service
        .deactivate(u.id, this.lockedBranchId() ?? undefined)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({ next: () => this.load() });
  }
}
