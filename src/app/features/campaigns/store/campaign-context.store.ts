import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, tap, throwError } from 'rxjs';
import { STORAGE_KEYS } from '@core/constants/storage-keys';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignsService } from '@features/campaigns/services/campaigns.service';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
import { SessionDataStateService } from '@core/services/session-data-state.service';

@Injectable({ providedIn: 'root' })
export class CampaignContextStore {
  private readonly campaignsService = inject(CampaignsService);
  private readonly branchContext = inject(BranchContextStore);
  private readonly sessionDataState = inject(SessionDataStateService);
  private readonly availableCampaignsSignal = signal<Campaign[]>([]);
  private readonly activeCampaignIdSignal = signal<number | null>(this.readStoredId());
  private readonly isLoadingSignal = signal(false);
  private readonly isInitializedSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private loadRequest: Observable<Campaign[]> | null = null;
  private loadVersion = 0;
  private loadedForBranchId: number | null | undefined;

  readonly availableCampaigns = this.availableCampaignsSignal.asReadonly();
  readonly activeCampaignId = this.activeCampaignIdSignal.asReadonly();
  readonly activeCampaign = computed(() => {
    const activeId = this.activeCampaignIdSignal();
    return this.availableCampaignsSignal().find((campaign) => campaign.id === activeId) ?? null;
  });
  readonly hasActiveCampaign = computed(() => this.activeCampaign() !== null);
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isInitialized = this.isInitializedSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadAvailable(): Observable<Campaign[]> {
    this.branchContext.ensureInitialized();
    const branchId = this.branchContext.activeBranchId();
    if (this.branchContext.requiresBranchSelection() && branchId === null) {
      return of([]);
    }

    if (this.isInitializedSignal() && this.loadedForBranchId === branchId) {
      return of(this.availableCampaignsSignal());
    }
    if (this.loadRequest) return this.loadRequest;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    const requestVersion = this.loadVersion;

    this.loadRequest = this.campaignsService.listAvailable(branchId ?? undefined).pipe(
      tap((campaigns) => {
        if (requestVersion !== this.loadVersion) return;

        this.availableCampaignsSignal.set(campaigns);
        this.restoreOrSelectCampaign(campaigns);
        this.loadedForBranchId = branchId;
        this.isInitializedSignal.set(true);
      }),
      catchError((error: unknown) => {
        if (requestVersion !== this.loadVersion) return throwError(() => error);

        this.availableCampaignsSignal.set([]);
        this.clearActiveCampaign();
        this.errorSignal.set('No se pudieron cargar las campañas disponibles.');
        this.isInitializedSignal.set(true);
        return throwError(() => error);
      }),
      finalize(() => {
        if (requestVersion !== this.loadVersion) return;

        this.isLoadingSignal.set(false);
        this.loadRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.loadRequest;
  }

  selectCampaign(campaignId: number): boolean {
    const campaign = this.availableCampaignsSignal().find(({ id }) => id === campaignId);
    if (!campaign) return false;

    if (this.activeCampaignIdSignal() !== campaign.id) {
      this.sessionDataState.reset();
    }
    this.activeCampaignIdSignal.set(campaign.id);
    sessionStorage.setItem(STORAGE_KEYS.activeCampaignId, String(campaign.id));
    return true;
  }

  clearActiveCampaign(): void {
    this.activeCampaignIdSignal.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.activeCampaignId);
  }

  reset(): void {
    this.loadVersion += 1;
    this.availableCampaignsSignal.set([]);
    this.clearActiveCampaign();
    this.isLoadingSignal.set(false);
    this.isInitializedSignal.set(false);
    this.loadedForBranchId = undefined;
    this.errorSignal.set(null);
    this.loadRequest = null;
  }

  private restoreOrSelectCampaign(campaigns: Campaign[]): void {
    const storedId = this.activeCampaignIdSignal();
    if (storedId !== null && campaigns.some(({ id }) => id === storedId)) return;

    if (campaigns.length === 1) {
      this.selectCampaign(campaigns[0].id);
      return;
    }

    this.clearActiveCampaign();
  }

  private readStoredId(): number | null {
    const storedId = sessionStorage.getItem(STORAGE_KEYS.activeCampaignId);
    if (!storedId) return null;

    const campaignId = Number(storedId);
    return Number.isInteger(campaignId) && campaignId > 0 ? campaignId : null;
  }
}
