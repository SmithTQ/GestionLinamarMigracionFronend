import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';
import { CampaignManagementFacade } from './campaign-management.facade';

describe('CampaignManagementFacade', () => {
  let facade: CampaignManagementFacade;
  let campaignsStore: jasmine.SpyObj<CampaignsStore>;
  const campaign = {
    id: 12,
    code: 'CAMP-12',
    name: 'Campana',
    status: 'draft',
    startsOn: '2026-01-01',
  } as Campaign;

  beforeEach(() => {
    campaignsStore = jasmine.createSpyObj('CampaignsStore', ['create', 'update', 'get', 'remove']);
    TestBed.configureTestingModule({
      providers: [CampaignManagementFacade, { provide: CampaignsStore, useValue: campaignsStore }],
    });
    facade = TestBed.inject(CampaignManagementFacade);
  });

  it('creates a campaign and resets the saving state', () => {
    campaignsStore.create.and.returnValue(of(campaign));

    facade
      .save(null, { code: 'CAMP-12', name: 'Campana', status: 'draft', starts_on: '2026-01-01' })
      .subscribe();

    expect(campaignsStore.create).toHaveBeenCalled();
    expect(facade.isSaving()).toBeFalse();
  });

  it('loads campaign detail and reports errors', () => {
    campaignsStore.get.and.returnValue(throwError(() => new Error('failure')));

    facade.loadDetail(12).subscribe({ error: () => undefined });

    expect(facade.error()).toBe('No se pudo cargar el detalle de la campaña.');
    expect(facade.isLoadingDetail()).toBeFalse();
  });

  it('closes a campaign through the store', () => {
    campaignsStore.remove.and.returnValue(of(undefined));

    facade.close(12).subscribe();

    expect(campaignsStore.remove).toHaveBeenCalledWith(12);
  });
});
