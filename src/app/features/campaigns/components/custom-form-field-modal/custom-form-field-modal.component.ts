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
import { FormFieldType } from '@features/campaigns/services/campaign-forms.service';

export interface CustomFormFieldValue {
  key: string;
  label: string;
  type: FormFieldType;
}

@Component({
  selector: 'app-custom-form-field-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './custom-form-field-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomFormFieldModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() error: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CustomFormFieldValue>();

  readonly key = signal('');
  readonly label = signal('');
  readonly type = signal<FormFieldType>('text');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.key.set('');
      this.label.set('');
      this.type.set('text');
    }
  }

  submit(): void {
    this.submitted.emit({
      key: this.key(),
      label: this.label(),
      type: this.type(),
    });
  }
}
