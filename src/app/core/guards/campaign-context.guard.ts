import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { BranchContextStore } from '@features/branches/store/branch-context.store';

export const campaignContextGuard: CanActivateFn = (_route, state) => {
  const context = inject(CampaignContextStore);
  const branchContext = inject(BranchContextStore);
  const router = inject(Router);
  const redirectToSelector = () =>
    router.createUrlTree(['/campaign-selection'], { queryParams: { returnUrl: state.url } });

  branchContext.ensureInitialized();
  const resolve = () =>
    branchContext.hasActiveBranch() && context.hasActiveCampaign() ? true : redirectToSelector();
  if (context.isInitialized()) return resolve();

  return context.loadAvailable().pipe(
    map(resolve),
    catchError(() => of(redirectToSelector())),
  );
};
