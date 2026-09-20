import { Injectable, computed, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '@core/constants/storage-keys';
import { AuthStore } from '@features/auth/store/auth.store';
import { SessionDataStateService } from '@core/services/session-data-state.service';

/**
 * Holds the branch selected for the current authenticated session.
 * The server remains the authority for scope validation; this store only
 * coordinates the frontend context and prevents cross-branch stale state.
 */
@Injectable({ providedIn: 'root' })
export class BranchContextStore {
  private readonly authStore = inject(AuthStore);
  private readonly sessionDataState = inject(SessionDataStateService);
  private readonly activeBranchIdSignal = signal<number | null>(this.readStoredId());

  readonly branches = computed(() => this.authStore.user()?.branches ?? []);
  readonly mode = computed(() => this.authStore.user()?.operational_context?.mode ?? null);
  readonly requiresBranchSelection = computed(() => this.mode() === 'branch_admin');
  readonly activeBranchId = this.activeBranchIdSignal.asReadonly();
  readonly activeBranch = computed(
    () => this.branches().find((branch) => branch.id === this.activeBranchIdSignal()) ?? null,
  );
  readonly hasActiveBranch = computed(
    () => !this.requiresBranchSelection() || this.activeBranch() !== null,
  );

  ensureInitialized(): void {
    const branches = this.branches();
    const storedId = this.activeBranchIdSignal();

    if (!this.requiresBranchSelection()) {
      this.clearActiveBranch();
      return;
    }

    if (storedId !== null && branches.some((branch) => branch.id === storedId)) {
      return;
    }

    const defaultBranchId = this.authStore.user()?.operational_context?.default_branch_id;
    if (defaultBranchId && branches.some((branch) => branch.id === defaultBranchId)) {
      this.selectBranch(defaultBranchId);
      return;
    }

    if (branches.length === 1) {
      this.selectBranch(branches[0].id);
      return;
    }

    this.clearActiveBranch();
  }

  selectBranch(branchId: number): boolean {
    const branch = this.branches().find(({ id }) => id === branchId);
    if (!branch) return false;

    if (this.activeBranchIdSignal() !== branch.id) {
      this.sessionDataState.reset();
    }
    this.activeBranchIdSignal.set(branch.id);
    sessionStorage.setItem(STORAGE_KEYS.activeBranchId, String(branch.id));
    return true;
  }

  clearActiveBranch(): void {
    this.activeBranchIdSignal.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.activeBranchId);
  }

  reset(): void {
    this.clearActiveBranch();
  }

  private readStoredId(): number | null {
    const storedId = sessionStorage.getItem(STORAGE_KEYS.activeBranchId);
    const branchId = Number(storedId);
    return Number.isInteger(branchId) && branchId > 0 ? branchId : null;
  }
}
