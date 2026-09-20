import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PublicCampaignFormService } from './public-campaign-form.service';

describe('PublicCampaignFormService', () => {
  let service: PublicCampaignFormService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PublicCampaignFormService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a public form by key', () => {
    const response = { title: 'Pedidos', fields: [], products: [], districts: [] };
    service.get('form-key').subscribe((form) => expect(form).toEqual(response));

    const request = http.expectOne(`${environment.apiUrl}/public/forms/form-key`);
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'ok', datos: response });
  });

  it('submits a public form payload', () => {
    const payload = { product_sku: 'SKU-1', submission_key: 'web-1' };
    service.submit('form-key', payload).subscribe((result) => expect(result.order_id).toBe(10));

    const request = http.expectOne(`${environment.apiUrl}/public/forms/form-key/submissions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ codigo: 201, mensaje: 'ok', datos: { submission_key: 'web-1', order_id: 10 } });
  });

  it('loads invitation data with optional prefilled values', () => {
    const response = {
      title: 'Pedidos',
      fields: [],
      products: [],
      districts: [],
      prefill: { recipient_name: 'Ana', recipient_phone: '999999999' },
    };
    service
      .getInvitation('invitation-token')
      .subscribe((form) => expect(form.prefill?.['recipient_name']).toBe('Ana'));

    const request = http.expectOne(`${environment.apiUrl}/public/invitations/invitation-token`);
    expect(request.request.method).toBe('GET');
    request.flush({ codigo: 200, mensaje: 'ok', datos: response });
  });
});
