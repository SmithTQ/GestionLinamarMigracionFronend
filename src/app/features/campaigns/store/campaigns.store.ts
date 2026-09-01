import { Injectable, computed, inject, signal } from '@angular/core';
import { Campaign } from '../models/campaign.model';
import { CampaignsService } from '../services/campaigns.service';

@Injectable({ providedIn: 'root' })
export class CampaignsStore {
  private readonly campaignsService = inject(CampaignsService);
  private readonly campaignsSignal = signal<Campaign[]>(this.campaignsService.getCampaigns());

  readonly campaigns = this.campaignsSignal.asReadonly();
  readonly activeCount = computed(
    () => this.campaignsSignal().filter((campaign) => campaign.status === 'active').length,
  );

  add(campaign: Campaign): void {
    this.campaignsSignal.update((state) => [...state, campaign]);
  }
}
