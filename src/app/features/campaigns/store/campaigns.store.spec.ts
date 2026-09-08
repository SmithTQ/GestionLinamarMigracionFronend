import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CampaignPage } from '../models/campaign.model';
import { CampaignsService } from '../services/campaigns.service';
import { CampaignsStore } from './campaigns.store';

describe('CampaignsStore', () => {
  let store: CampaignsStore;
  let listSpy: jasmine.Spy;

  beforeEach(() => {
    listSpy = jasmine.createSpy('list');
    TestBed.configureTestingModule({
      providers: [CampaignsStore, { provide: CampaignsService, useValue: { list: listSpy } }],
    });
    store = TestBed.inject(CampaignsStore);
  });

  it('keeps the latest request when responses arrive out of order', () => {
    const firstRequest = new Subject<CampaignPage>();
    const secondRequest = new Subject<CampaignPage>();
    listSpy.and.returnValues(firstRequest.asObservable(), secondRequest.asObservable());

    store.load({ page: 1 });
    store.load({ page: 2 });

    firstRequest.next(page(1, 'old'));
    secondRequest.next(page(2, 'new'));
    secondRequest.complete();

    expect(store.pagination().page).toBe(2);
    expect(store.campaigns()[0].name).toBe('new');
    expect(store.isLoading()).toBeFalse();
  });
});

function page(currentPage: number, name: string): CampaignPage {
  return {
    items: [
      {
        id: currentPage,
        code: `CAMP-${currentPage}`,
        name,
        status: 'draft',
        startsOn: '2026-01-01',
      },
    ],
    page: currentPage,
    from: 1,
    to: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    links: [],
  };
}
