import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { District, PagedResult } from '../models/district.model';
import { DistrictsService } from '../services/districts.service';
import { DistrictsStore } from './districts.store';

describe('DistrictsStore', () => {
  it('keeps the latest district response when requests finish out of order', () => {
    const firstRequest = new Subject<PagedResult<District>>();
    const secondRequest = new Subject<PagedResult<District>>();
    const listDistricts = jasmine
      .createSpy('listDistricts')
      .and.returnValues(firstRequest.asObservable(), secondRequest.asObservable());
    TestBed.configureTestingModule({
      providers: [DistrictsStore, { provide: DistrictsService, useValue: { listDistricts } }],
    });
    const store = TestBed.inject(DistrictsStore);

    store.loadDistricts({ page: 1 });
    store.loadDistricts({ page: 2 });
    firstRequest.next(districtPage(1, 'old'));
    secondRequest.next(districtPage(2, 'new'));
    secondRequest.complete();

    expect(store.districtPage().page).toBe(2);
    expect(store.districts()[0].name).toBe('new');
    expect(store.isLoading()).toBeFalse();
  });
});

function districtPage(page: number, name: string): PagedResult<District> {
  return {
    items: [
      {
        id: page,
        code: `150101${page}`,
        name,
        province: 'Lima',
        department: 'Lima',
        isActive: true,
      },
    ],
    page,
    pageSize: 10,
    total: 1,
    totalPages: 1,
  };
}
