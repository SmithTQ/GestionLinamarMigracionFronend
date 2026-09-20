import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CampaignForm, CampaignFormsService } from './campaign-forms.service';
import { CustomerInvitationFacade } from './customer-invitation.facade';
import { CustomerInvitationsService } from './customer-invitations.service';

describe('CustomerInvitationFacade', () => {
  let facade: CustomerInvitationFacade;
  let formsService: jasmine.SpyObj<CampaignFormsService>;
  let invitationsService: jasmine.SpyObj<CustomerInvitationsService>;

  beforeEach(() => {
    formsService = jasmine.createSpyObj('CampaignFormsService', ['list']);
    invitationsService = jasmine.createSpyObj('CustomerInvitationsService', ['create']);
    TestBed.configureTestingModule({
      providers: [
        CustomerInvitationFacade,
        { provide: CampaignFormsService, useValue: formsService },
        { provide: CustomerInvitationsService, useValue: invitationsService },
      ],
    });
    facade = TestBed.inject(CustomerInvitationFacade);
  });

  it('selects the published form when opening an invitation', () => {
    formsService.list.and.returnValue(
      of([
        { id: 2, status: 'draft' },
        { id: 3, status: 'published' },
      ] as unknown as CampaignForm[]),
    );

    facade.open(12);

    expect(formsService.list).toHaveBeenCalledWith(12);
    expect(facade.formId()).toBe(3);
    expect(facade.isLoading()).toBeFalse();
    expect(facade.error()).toBeNull();
  });

  it('validates required invitation data before sending', () => {
    formsService.list.and.returnValue(
      of([{ id: 3, status: 'published' }] as unknown as CampaignForm[]),
    );
    facade.open(12);

    facade.create({ fullName: '', whatsappNumber: '', email: '', expiresAt: '' });

    expect(invitationsService.create).not.toHaveBeenCalled();
    expect(facade.error()).toContain('nombre');
  });

  it('creates an invitation using the selected form', () => {
    formsService.list.and.returnValue(
      of([{ id: 3, status: 'published' }] as unknown as CampaignForm[]),
    );
    invitationsService.create.and.returnValue(
      of({ invitation_token: 'token', form_url: '/form', whatsapp_url: '/wa', status: 'pending' }),
    );
    facade.open(12);

    facade.create({
      fullName: 'Ana Perez',
      whatsappNumber: '51999999999',
      email: '',
      expiresAt: '',
    });

    expect(invitationsService.create).toHaveBeenCalledWith({
      form_id: 3,
      full_name: 'Ana Perez',
      whatsapp_number: '51999999999',
      email: undefined,
      expires_at: undefined,
    });
    expect(facade.invitation()?.invitation_token).toBe('token');
  });

  it('shows the backend message when the invitation cannot be created', () => {
    formsService.list.and.returnValue(
      of([{ id: 3, status: 'published' }] as unknown as CampaignForm[]),
    );
    invitationsService.create.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'El cliente ya utilizo este formulario.' },
          }),
      ),
    );
    facade.open(12);

    facade.create({
      fullName: 'Ana Perez',
      whatsappNumber: '51999999999',
      email: '',
      expiresAt: '',
    });

    expect(facade.error()).toBe('El cliente ya utilizo este formulario.');
  });
});
