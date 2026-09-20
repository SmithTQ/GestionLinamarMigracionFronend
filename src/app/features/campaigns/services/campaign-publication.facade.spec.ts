import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';
import { CampaignForm, CampaignFormsService } from './campaign-forms.service';
import { CampaignPublicationFacade } from './campaign-publication.facade';

describe('CampaignPublicationFacade', () => {
  let facade: CampaignPublicationFacade;
  let campaignsStore: jasmine.SpyObj<CampaignsStore>;
  let formsService: jasmine.SpyObj<CampaignFormsService>;
  const openedCampaign = {
    id: 12,
    code: 'CAMP-12',
    name: 'Campana',
    status: 'open',
    startsOn: '2026-01-01',
  } as Campaign;

  beforeEach(() => {
    campaignsStore = jasmine.createSpyObj('CampaignsStore', ['update']);
    formsService = jasmine.createSpyObj('CampaignFormsService', ['publish']);
    campaignsStore.update.and.returnValue(of(openedCampaign));
    formsService.publish.and.returnValue(of({} as unknown as CampaignForm));
    TestBed.configureTestingModule({
      providers: [
        CampaignPublicationFacade,
        { provide: CampaignsStore, useValue: campaignsStore },
        { provide: CampaignFormsService, useValue: formsService },
      ],
    });
    facade = TestBed.inject(CampaignPublicationFacade);
  });

  it('opens the campaign before publishing its form', () => {
    let result: Campaign | undefined;
    facade.openAndPublish(12, 7).subscribe((campaign) => (result = campaign));

    expect(campaignsStore.update).toHaveBeenCalledWith(12, { status: 'open' });
    expect(formsService.publish).toHaveBeenCalledWith(7);
    expect(result).toBe(openedCampaign);
  });
});
