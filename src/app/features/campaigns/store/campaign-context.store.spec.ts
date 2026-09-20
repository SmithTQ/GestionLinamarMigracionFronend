import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { STORAGE_KEYS } from '@core/constants/storage-keys';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignsService } from '@features/campaigns/services/campaigns.service';
import { CampaignContextStore } from './campaign-context.store';

describe('CampaignContextStore', () => {
  let store: CampaignContextStore;
  let campaignsService: jasmine.SpyObj<CampaignsService>;

  const campaigns: Campaign[] = [
    {
      id: 1,
      code: 'CAM-001',
      name: 'Campaña 1',
      status: 'open',
      startsOn: '2026-01-01',
    },
    {
      id: 2,
      code: 'CAM-002',
      name: 'Campaña 2',
      status: 'draft',
      startsOn: '2026-02-01',
    },
  ];

  beforeEach(() => {
    sessionStorage.clear();
    campaignsService = jasmine.createSpyObj<CampaignsService>('CampaignsService', [
      'listAvailable',
    ]);
    TestBed.configureTestingModule({
      providers: [CampaignContextStore, { provide: CampaignsService, useValue: campaignsService }],
    });
    store = TestBed.inject(CampaignContextStore);
  });

  it('selects the only available campaign automatically', () => {
    campaignsService.listAvailable.and.returnValue(of([campaigns[0]]));

    store.loadAvailable().subscribe();

    expect(store.activeCampaignId()).toBe(1);
    expect(store.activeCampaign()?.name).toBe('Campaña 1');
    expect(sessionStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBe('1');
  });

  it('restores a persisted campaign only when it is available', () => {
    sessionStorage.setItem(STORAGE_KEYS.activeCampaignId, '2');
    campaignsService.listAvailable.and.returnValue(of(campaigns));

    store.loadAvailable().subscribe();

    expect(store.activeCampaignId()).toBe(2);
  });

  it('clears an unavailable persisted campaign when multiple campaigns exist', () => {
    sessionStorage.setItem(STORAGE_KEYS.activeCampaignId, '99');
    campaignsService.listAvailable.and.returnValue(of(campaigns));

    store.loadAvailable().subscribe();

    expect(store.activeCampaignId()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBeNull();
  });

  it('does not select a campaign that is not available', () => {
    campaignsService.listAvailable.and.returnValue(of(campaigns));
    store.loadAvailable().subscribe();

    expect(store.selectCampaign(99)).toBeFalse();
    expect(store.activeCampaignId()).toBeNull();
  });

  it('clears the active campaign when loading fails', () => {
    sessionStorage.setItem(STORAGE_KEYS.activeCampaignId, '1');
    campaignsService.listAvailable.and.returnValue(throwError(() => new Error('network error')));

    store.loadAvailable().subscribe({ error: () => undefined });

    expect(store.activeCampaignId()).toBeNull();
    expect(store.availableCampaigns()).toEqual([]);
    expect(store.error()).toContain('campañas disponibles');
  });
});
