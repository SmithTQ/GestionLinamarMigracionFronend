import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LocationPickerComponent,
  LocationValue,
} from '@shared/components/location-picker/location-picker.component';
import {
  PublicFormDistrict,
  PublicFormField,
  PublicFormProduct,
} from '@features/public-form/services/public-campaign-form.service';

export interface PublicFormFieldValueChange {
  key: string;
  value: string;
}

@Component({
  selector: 'app-public-form-field',
  standalone: true,
  imports: [LocationPickerComponent],
  templateUrl: './public-form-field.component.html',
  styleUrl: './public-form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicFormFieldComponent {
  @Input({ required: true }) field!: PublicFormField;
  @Input() products: PublicFormProduct[] = [];
  @Input() districts: PublicFormDistrict[] = [];
  @Input() value = '';
  @Input() latitude = '';
  @Input() longitude = '';
  @Input() filePreview = '';
  @Output() readonly valueChange = new EventEmitter<PublicFormFieldValueChange>();
  @Output() readonly fileChange = new EventEmitter<File | null>();
  @Output() readonly locationChange = new EventEmitter<LocationValue>();

  fieldOptions(): string[] {
    const options = this.field.config?.['options'];
    return Array.isArray(options)
      ? options.filter((option): option is string => typeof option === 'string')
      : [];
  }

  fieldFileAccept(): string {
    const accept = this.field.config?.['accept'];
    if (Array.isArray(accept)) {
      const configured = accept
        .filter((item): item is string => typeof item === 'string')
        .join(',');
      return configured || 'image/jpeg,image/png,image/webp';
    }
    return typeof accept === 'string' ? accept : 'image/jpeg,image/png,image/webp';
  }

  fieldInputId(): string {
    return `public-form-field-${this.field.key}`;
  }

  fieldLabelId(): string {
    return `${this.fieldInputId()}-label`;
  }

  isProductField(): boolean {
    return this.field.key === 'product' || this.field.type === 'product';
  }

  isDistrictField(): boolean {
    return this.field.key === 'district' || this.field.type === 'district';
  }

  selectValue(value: string): void {
    const key = this.isProductField()
      ? 'product_sku'
      : this.isDistrictField()
        ? 'district_code'
        : this.field.key;
    this.valueChange.emit({ key, value });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileChange.emit(input.files?.[0] ?? null);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.fileChange.emit(event.dataTransfer?.files?.[0] ?? null);
  }
}
