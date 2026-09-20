import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CustomerInvitation } from '@features/campaigns/services/customer-invitations.service';

export interface CustomerInvitationFormValue {
  fullName: string;
  whatsappNumber: string;
  email: string;
  expiresAt: string;
}

@Component({
  selector: 'app-customer-invitation-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, ModalComponent, LoadingComponent],
  templateUrl: './customer-invitation-modal.component.html',
  styleUrl: './customer-invitation-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerInvitationModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() isLoadingData = false;
  @Input() error: string | null = null;
  @Input() invitation: CustomerInvitation | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CustomerInvitationFormValue>();

  readonly fullName = signal('');
  readonly whatsappNumber = signal('');
  readonly email = signal('');
  readonly expiresAt = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.fullName.set('');
      this.whatsappNumber.set('');
      this.email.set('');
      this.expiresAt.set('');
    }
  }

  submit(): void {
    this.submitted.emit({
      fullName: this.fullName().trim(),
      whatsappNumber: this.whatsappNumber().trim(),
      email: this.email().trim(),
      expiresAt: this.expiresAt(),
    });
  }
}
