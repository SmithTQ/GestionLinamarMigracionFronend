import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { CampaignFormsService } from './campaign-forms.service';
import { CustomerInvitation, CustomerInvitationsService } from './customer-invitations.service';
import { SessionDataStateService } from '@core/services/session-data-state.service';

export interface CustomerInvitationDraft {
  fullName: string;
  whatsappNumber: string;
  email: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerInvitationFacade {
  private readonly formsService = inject(CampaignFormsService);
  private readonly invitationsService = inject(CustomerInvitationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionDataState = inject(SessionDataStateService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly invitation = signal<CustomerInvitation | null>(null);
  readonly formId = signal<number | null>(null);

  constructor() {
    this.sessionDataState.register(() => this.reset());
  }

  open(campaignId: number): void {
    this.reset();
    this.isLoading.set(true);
    this.formsService
      .list(campaignId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (forms) => {
          const form = forms.find((item) => item.status === 'published');
          if (!form) {
            this.error.set('La campana no tiene un formulario publicado.');
            return;
          }
          this.formId.set(form.id);
        },
        error: (error: unknown) =>
          this.error.set(
            getApiErrorMessage(error, 'No se pudo consultar el formulario publicado.'),
          ),
      });
  }

  close(): void {
    if (this.isLoading() || this.isSaving()) return;
    this.reset();
  }

  create(value: CustomerInvitationDraft): void {
    const formId = this.formId();
    if (!formId || this.isSaving()) return;
    if (!value.fullName || !value.whatsappNumber) {
      this.error.set('Completa el nombre y el numero de WhatsApp.');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.invitationsService
      .create({
        form_id: formId,
        full_name: value.fullName,
        whatsapp_number: value.whatsappNumber,
        email: value.email || undefined,
        expires_at: value.expiresAt || undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (invitation) => this.invitation.set(invitation),
        error: (error: unknown) =>
          this.error.set(getApiErrorMessage(error, 'No se pudo generar la invitacion.')),
      });
  }

  reset(): void {
    this.isLoading.set(false);
    this.isSaving.set(false);
    this.error.set(null);
    this.invitation.set(null);
    this.formId.set(null);
  }
}
