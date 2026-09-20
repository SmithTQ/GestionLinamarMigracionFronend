import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CustomerInvitationsService } from './customer-invitations.service';

describe('CustomerInvitationsService', () => {
  let service: CustomerInvitationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CustomerInvitationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an invitation with the selected form', () => {
    const payload = { form_id: 7, full_name: 'Ana Ruiz', whatsapp_number: '51999999999' };
    service
      .create(payload)
      .subscribe((invitation) => expect(invitation.form_url).toContain('/formulario/'));

    const request = http.expectOne(`${environment.apiUrl}/customer-invitations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      codigo: 201,
      mensaje: 'ok',
      datos: { form_url: '/formulario/invitacion/token' },
    });
  });
});
