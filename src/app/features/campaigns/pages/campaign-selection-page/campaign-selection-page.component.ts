import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CampaignContextStore } from '@features/campaigns/store/campaign-context.store';
import { BranchContextStore } from '@features/branches/store/branch-context.store';

@Component({
  selector: 'app-campaign-selection-page',
  standalone: true,
  imports: [LoadingComponent],
  templateUrl: './campaign-selection-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignSelectionPageComponent {
  private readonly context = inject(CampaignContextStore);
  private readonly branchContext = inject(BranchContextStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly campaigns = this.context.availableCampaigns;
  readonly isLoading = this.context.isLoading;
  readonly error = this.context.error;
  readonly branches = this.branchContext.branches;
  readonly activeBranchId = this.branchContext.activeBranchId;
  readonly requiresBranchSelection = this.branchContext.requiresBranchSelection;

  constructor() {
    this.branchContext.ensureInitialized();
    this.loadCampaigns();
  }

  selectBranch(branchId: number): void {
    if (!this.branchContext.selectBranch(branchId)) return;

    this.context.reset();
    this.loadCampaigns();
  }

  selectCampaign(campaignId: number): void {
    if (!this.context.selectCampaign(campaignId)) return;

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(returnUrl || '/dashboard');
  }

  private loadCampaigns(): void {
    if (this.requiresBranchSelection() && this.activeBranchId() === null) return;

    this.context
      .loadAvailable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
