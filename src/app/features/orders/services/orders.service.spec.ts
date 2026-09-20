import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrdersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('builds the server-side list query', () => {
    service
      .list({
        page: 2,
        pageSize: 25,
        sort: { key: 'deliveryDate', direction: 'desc' },
        filters: { district: 'Miraflores', status: 'Pendiente', deliveryDate: '2026-09-13' },
      })
      .subscribe();

    const request = httpTesting.expectOne(
      (pendingRequest) => pendingRequest.url === `${environment.apiUrl}/orders`,
    );
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('25');
    expect(request.request.params.get('sort_by')).toBe('delivery_date');
    expect(request.request.params.get('sort_dir')).toBe('desc');
    expect(request.request.params.get('district')).toBe('Miraflores');
    expect(request.request.params.get('status')).toBe('pending');
    expect(request.request.params.get('delivery_date')).toBe('2026-09-13');
    request.flush({
      codigo: 200,
      mensaje: 'OK',
      datos: [],
      paginacion: { current_page: 2, last_page: 2, total: 0, per_page: 25 },
    });
  });

  it('maps an order detail response', () => {
    let resultId: number | undefined;
    service.get(7).subscribe((order) => (resultId = order.id));

    const request = httpTesting.expectOne(`${environment.apiUrl}/orders/7`);
    request.flush({ codigo: 200, mensaje: 'OK', datos: orderDto() });

    expect(resultId).toBe(7);
  });

  it('uses the order mutation endpoints', () => {
    service.update(7, { address: 'Nueva dirección' }).subscribe();
    const updateRequest = httpTesting.expectOne(`${environment.apiUrl}/orders/7`);
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush({ codigo: 200, mensaje: 'OK', datos: orderDto() });

    service.changeStatus(7, 'validated').subscribe();
    const statusRequest = httpTesting.expectOne(`${environment.apiUrl}/orders/7/status`);
    expect(statusRequest.request.body).toEqual({ status: 'validated' });
    statusRequest.flush({ codigo: 200, mensaje: 'OK', datos: orderDto() });

    service.archive(7).subscribe();
    const archiveRequest = httpTesting.expectOne(`${environment.apiUrl}/orders/7`);
    expect(archiveRequest.request.method).toBe('DELETE');
    archiveRequest.flush({ codigo: 200, mensaje: 'OK', datos: null });
  });
});

function orderDto() {
  return {
    id: 7,
    campaign_id: 1,
    branch_id: 2,
    sender_name: 'Remitente',
    sender_phone: '999999999',
    recipient_name: 'Destinatario',
    recipient_phone: '988888888',
    district: 'Miraflores',
    address: 'Av. Principal 123',
    status: 'pending',
    created_at: '2026-09-13T10:00:00Z',
  };
}
