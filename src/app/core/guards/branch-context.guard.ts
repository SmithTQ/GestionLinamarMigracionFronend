import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BranchContextStore } from '@features/branches/store/branch-context.store';

/** Ensures branch-scoped management screens cannot load without a branch context. */
export const branchContextGuard: CanActivateFn = (_route, state) => {
  const context = inject(BranchContextStore);
  const router = inject(Router);

  context.ensureInitialized();
  if (context.hasActiveBranch()) {
    return true;
  }

  return router.createUrlTree(['/campaign-selection'], { queryParams: { returnUrl: state.url } });
};
