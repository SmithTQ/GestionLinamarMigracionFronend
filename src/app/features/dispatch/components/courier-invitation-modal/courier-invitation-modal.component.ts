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
import { CourierInvitation } from '../../models/delivery-route.model';

export interface CourierInvitationFormValue {
  name: string;
  whatsappNumber: string;
}

@Component({
  selector: 'app-courier-invitation-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './courier-invitation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourierInvitationModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() routeName = '';
  @Input() courierName = '';
  @Input() courierWhatsApp = '';
  @Input() isReissuing = false;
  @Input() saving = false;
  @Input() error: string | null = null;
  @Input() invitation: CourierInvitation | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly submitted = new EventEmitter<CourierInvitationFormValue>();

  readonly name = signal('');
  readonly whatsappNumber = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.name.set(this.courierName);
      this.whatsappNumber.set(this.courierWhatsApp);
    }
  }

  submit(): void {
    this.submitted.emit({
      name: this.name().trim(),
      whatsappNumber: this.whatsappNumber().trim(),
    });
  }
}
