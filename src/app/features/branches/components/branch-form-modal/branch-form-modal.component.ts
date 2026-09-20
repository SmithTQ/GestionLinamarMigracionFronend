import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@shared/components/button/button.component';
import {
  LocationPickerComponent,
  LocationValue,
} from '@shared/components/location-picker/location-picker.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { Branch, BranchPayload } from '../../models/branch.model';
@Component({
  selector: 'app-branch-form-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, ReactiveFormsModule, LocationPickerComponent],
  templateUrl: './branch-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() branch: Branch | null = null;
  @Input() saving = false;
  @Input() error: string | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly submitted = new EventEmitter<BranchPayload>();
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    code: [
      '',
      [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)],
    ],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', Validators.maxLength(255)],
    latitude: [''],
    longitude: [''],
    isActive: [true],
  });
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      const branch = this.branch;
      this.form.reset({
        code: branch?.code ?? '',
        name: branch?.name ?? '',
        address: branch?.address ?? '',
        latitude: branch?.latitude?.toString() ?? '',
        longitude: branch?.longitude?.toString() ?? '',
        isActive: branch?.isActive ?? true,
      });
    }
  }
  setLocation(value: LocationValue): void {
    this.form.controls.latitude.setValue(value.latitude);
    this.form.controls.longitude.setValue(value.longitude);
  }
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const latitude = value.latitude ? Number(value.latitude) : undefined;
    const longitude = value.longitude ? Number(value.longitude) : undefined;
    this.submitted.emit({
      code: value.code.trim(),
      name: value.name.trim(),
      address: value.address.trim() || undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      is_active: value.isActive,
    });
  }
}
