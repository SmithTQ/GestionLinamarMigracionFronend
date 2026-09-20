import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import {
  CustomerInvitationFormValue,
  CustomerInvitationModalComponent,
} from '@features/campaigns/components/customer-invitation-modal/customer-invitation-modal.component';
import { CustomerInvitationFacade } from '@features/campaigns/services/customer-invitation.facade';

@Component({
  selector: 'app-global-customer-invitation',
  standalone: true,
  imports: [CustomerInvitationModalComponent],
  templateUrl: './global-customer-invitation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalCustomerInvitationComponent implements OnChanges {
  @Input({ required: true }) campaignId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly facade = inject(CustomerInvitationFacade);

  readonly isOpen = signal(false);
  readonly isSaving = this.facade.isSaving;
  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly invitation = this.facade.invitation;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaignId']?.currentValue === null) return;
    this.isOpen.set(true);
    this.facade.open(this.campaignId as number);
  }

  close(): void {
    this.facade.close();
    this.isOpen.set(false);
    this.closed.emit();
  }

  create(value: CustomerInvitationFormValue): void {
    this.facade.create(value);
  }
}
