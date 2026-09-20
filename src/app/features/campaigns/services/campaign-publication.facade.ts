import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';
import { CampaignFormsService } from './campaign-forms.service';

@Injectable({ providedIn: 'root' })
export class CampaignPublicationFacade {
  private readonly campaignsStore = inject(CampaignsStore);
  private readonly formsService = inject(CampaignFormsService);

  openAndPublish(campaignId: number, formId: number): Observable<Campaign> {
    return this.campaignsStore
      .update(campaignId, { status: 'open' })
      .pipe(
        switchMap((openedCampaign) =>
          this.formsService.publish(formId).pipe(map(() => openedCampaign)),
        ),
      );
  }
}
