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
import { IconComponent } from '@shared/components/icon/icon.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { Branch } from '@features/branches/models/branch.model';
import { ManagedUser, Role, UserPayload } from '../../models/user.model';

type ScopeType = 'branches' | 'none';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const MANAGEABLE_ROLE_SLUGS = new Set(['super_admin', 'campaign_manager', 'dispatcher']);

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, IconComponent, ReactiveFormsModule],
  templateUrl: './user-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: ManagedUser | null = null;
  @Input() roles: Role[] = [];
  @Input() branches: Branch[] = [];
  @Input() fixedRoleId: number | null = null;
  @Input() lockedBranchId: number | null = null;
  @Input() lockedBranchName = '';
  @Input() saving = false;
  @Input() error: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly submitted = new EventEmitter<UserPayload>();

  private readonly fb = inject(FormBuilder);
  private readonly rolesVersion = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    passwordConfirmation: [''],
    isActive: [true],
    roleIds: [[] as number[], Validators.required],
    campaignIds: [[] as number[]],
    branchIds: [[] as number[]],
  });

  readonly manageableRoles = computed(() => {
    this.rolesVersion();
    return this.roles.filter(
      (role) =>
        MANAGEABLE_ROLE_SLUGS.has(role.slug) &&
        (this.fixedRoleId === null || role.id === this.fixedRoleId),
    );
  });
  private readonly selectedRoleId = signal<number | null>(null);
  readonly selectedRole = computed(() => {
    this.rolesVersion();
    return this.roles.find((role) => role.id === this.selectedRoleId()) ?? null;
  });
  readonly isRoleSelectionLocked = computed(() => this.fixedRoleId !== null);
  readonly hasLockedBranch = computed(() => this.lockedBranchId !== null);
  readonly scopeType = computed<ScopeType>(() => {
    switch (this.selectedRole()?.slug) {
      case 'campaign_manager':
        return 'branches';
      case 'dispatcher':
        return 'branches';
      default:
        return 'none';
    }
  });
  readonly scopeTitle = computed(() => {
    switch (this.scopeType()) {
      case 'branches':
        return this.selectedRole()?.slug === 'dispatcher'
          ? 'Sucursales habilitadas'
          : 'Sucursales a administrar';
      default:
        return 'Sin ambito operativo adicional';
    }
  });
  readonly scopeDescription = computed(() => {
    switch (this.scopeType()) {
      case 'branches':
        return this.selectedRole()?.slug === 'dispatcher'
          ? 'El despachador podra asignarse despues a las campanas de estas sucursales desde la pantalla de Campanas.'
          : 'El administrador operativo podra gestionar todas las campanas, productos y coberturas de estas sucursales.';
      default:
        return 'El superadministrador conserva acceso global. Las rutas de motorizados se gestionan por separado.';
    }
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roles']) {
      this.rolesVersion.update((version) => version + 1);
    }
    if (!changes['isOpen']?.currentValue) return;

    const user = this.user;
    const existingRoleId =
      user?.roles
        .filter((role) => MANAGEABLE_ROLE_SLUGS.has(role.slug))
        .slice(0, 1)
        .map((role) => role.id)[0] ?? null;
    const selectedRoleId = this.fixedRoleId ?? existingRoleId;
    const branchIds =
      this.lockedBranchId === null ? (user?.branchIds ?? []) : [this.lockedBranchId];

    this.form.reset({
      name: user?.name ?? '',
      username: user?.username ?? '',
      email: user?.email ?? '',
      password: '',
      passwordConfirmation: '',
      isActive: user?.isActive ?? true,
      roleIds: selectedRoleId === null ? [] : [selectedRoleId],
      campaignIds: [],
      branchIds,
    });
    this.selectedRoleId.set(selectedRoleId);
    this.updatePasswordValidators();
    this.normalizeScope();
  }

  selectRole(roleId: number): void {
    if (this.fixedRoleId !== null) return;
    this.form.controls.roleIds.setValue([roleId]);
    this.form.controls.roleIds.setErrors(null);
    this.selectedRoleId.set(roleId);
    this.normalizeScope();
  }

  toggleBranch(branchId: number): void {
    if (this.lockedBranchId !== null) return;
    this.form.controls.branchIds.setValue(toggleId(this.form.controls.branchIds.value, branchId));
    this.form.controls.branchIds.setErrors(null);
  }

  submit(): void {
    this.normalizeScope();
    this.updatePasswordValidators();
    if (!this.validateScope() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.password !== value.passwordConfirmation) {
      this.form.controls.passwordConfirmation.setErrors({ passwordMismatch: true });
      this.form.controls.passwordConfirmation.markAsTouched();
      return;
    }

    this.submitted.emit({
      name: value.name.trim(),
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password || undefined,
      password_confirmation: value.password ? value.passwordConfirmation : undefined,
      is_active: value.isActive,
      role_ids: value.roleIds,
      branch_ids:
        this.scopeType() === 'branches'
          ? this.lockedBranchId === null
            ? value.branchIds
            : [this.lockedBranchId]
          : [],
    });
  }

  hasError(control: 'name' | 'username' | 'email' | 'password' | 'passwordConfirmation'): boolean {
    const field = this.form.controls[control];
    return field.touched && field.invalid;
  }

  private updatePasswordValidators(): void {
    const password = this.form.controls.password;
    const confirmation = this.form.controls.passwordConfirmation;
    const requiresPassword = !this.user;

    password.setValidators(
      requiresPassword
        ? [Validators.required, Validators.pattern(PASSWORD_PATTERN)]
        : [Validators.pattern(PASSWORD_PATTERN)],
    );
    confirmation.setValidators(requiresPassword ? [Validators.required] : []);
    password.updateValueAndValidity({ emitEvent: false });
    confirmation.updateValueAndValidity({ emitEvent: false });
  }

  private validateScope(): boolean {
    const scope = this.scopeType();
    if (scope === 'branches' && this.form.controls.branchIds.value.length === 0) {
      this.form.controls.branchIds.setErrors({ requiredScope: true });
      return false;
    }
    return true;
  }

  private normalizeScope(): void {
    switch (this.scopeType()) {
      case 'branches':
        this.form.controls.campaignIds.setValue([]);
        if (this.lockedBranchId !== null) {
          this.form.controls.branchIds.setValue([this.lockedBranchId]);
        }
        break;
      default:
        this.form.controls.campaignIds.setValue([]);
        this.form.controls.branchIds.setValue([]);
    }
  }
}

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
