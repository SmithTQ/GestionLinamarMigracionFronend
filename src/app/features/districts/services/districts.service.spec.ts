import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DistrictsService } from './districts.service';

describe('DistrictsService', () => {
  let service: DistrictsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DistrictsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DistrictsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends backend-compatible sort parameters for districts', () => {
    service
      .listDistricts({
        page: 2,
        pageSize: 25,
        sort: { key: 'province', direction: 'desc' },
      })
      .subscribe();

    const request = httpTesting.expectOne(
      (pendingRequest) => pendingRequest.url === `${environment.apiUrl}/districts`,
    );
    expect(request.request.params.get('sort_by')).toBe('province');
    expect(request.request.params.get('sort_dir')).toBe('desc');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('25');
    request.flush({
      codigo: 200,
      mensaje: 'OK',
      datos: [],
      paginacion: { current_page: 2, per_page: 25, total: 0, last_page: 1 },
    });
  });
});
