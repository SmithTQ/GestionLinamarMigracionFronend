import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CampaignsService } from './campaigns.service';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CampaignsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampaignsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('builds the paginated campaign query with server-side sort and filters', () => {
    service
      .list({
        page: 2,
        pageSize: 25,
        sort: { key: 'name', direction: 'asc' },
        filters: { name: 'Navidad', status: 'Abierta', startDate: '2026-10-01' },
      })
      .subscribe();

    const request = httpTesting.expectOne(
      (pendingRequest) => pendingRequest.url === `${environment.apiUrl}/campaigns`,
    );
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('25');
    expect(request.request.params.get('sort_by')).toBe('name');
    expect(request.request.params.get('sort_dir')).toBe('asc');
    expect(request.request.params.get('search')).toBe('Navidad');
    expect(request.request.params.get('status')).toBe('open');
    expect(request.request.params.get('starts_on_from')).toBe('2026-10-01');
    expect(request.request.params.get('starts_on_to')).toBe('2026-10-01');
    request.flush({ datos: [], paginacion: emptyPagination(), codigo: 200, mensaje: 'OK' });
  });
});

function emptyPagination() {
  return {
    current_page: 2,
    from: null,
    last_page: 2,
    links: [],
    per_page: 25,
    to: null,
    total: 0,
  };
}
