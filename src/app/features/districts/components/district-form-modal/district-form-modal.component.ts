import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { District } from '../../models/district.model';

export interface DistrictFormValue {
  code: string;
  name: string;
  province: string;
  department: string;
}

@Component({
  selector: 'app-district-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './district-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() district: District | null = null;
  @Input() isSaving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<DistrictFormValue>();

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    province: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnChanges(): void {
    const district = this.district;
    this.form.reset({
      code: district?.code ?? '',
      name: district?.name ?? '',
      province: district?.province ?? '',
      department: district?.department ?? '',
    });
    this.form.markAsUntouched();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) {
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
