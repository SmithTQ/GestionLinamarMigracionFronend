import { NgClass } from '@angular/common';
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

interface ProductDraft {
  id: string;
  name: string;
  image: string;
  price: string;
  fileName?: string;
}

interface DynamicFieldDraft {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

@Component({
  selector: 'app-campaign-form-builder-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, ModalComponent, NgClass],
  templateUrl: './campaign-form-builder-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignFormBuilderModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() campaignId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly products = signal<ProductDraft[]>([
    { id: 'prod-1', name: 'Caja mediana', image: '', price: '25.00' },
    { id: 'prod-2', name: 'Sobre express', image: '', price: '12.00' },
  ]);
  readonly selectedProductId = signal<string | null>(null);
  readonly dynamicFields = signal<DynamicFieldDraft[]>([]);
  readonly deliveryScheduleOptions = signal<string[]>(['09:00 - 13:00', '13:00 - 18:00']);
  readonly productError = signal<string | null>(null);
  readonly fieldLabelError = signal<string | null>(null);
  readonly scheduleOptionsError = signal<string | null>(null);

  readonly fixedFields = [
    'Detalle',
    'Remitente',
    'Telef. Remitente',
    'Destinatario',
    'Telef. Destinatario',
    'Distrito',
    'Direccion',
    'Horario de entrega',
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.reset();
    }
  }

  close(): void {
    this.closed.emit();
  }

  reset(): void {
    this.products.set([
      { id: 'prod-1', name: 'Caja mediana', image: '', price: '25.00' },
      { id: 'prod-2', name: 'Sobre express', image: '', price: '12.00' },
    ]);
    this.selectedProductId.set(null);
    this.dynamicFields.set([]);
    this.deliveryScheduleOptions.set(['09:00 - 13:00', '13:00 - 18:00']);
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
  }

  save(): void {
    if (this.dynamicFields().some((field) => !field.label.trim())) {
      this.fieldLabelError.set('Completa el nombre de todos los campos.');
      return;
    }
    if (this.products().some((product) => !product.name.trim())) {
      this.productError.set('Completa el nombre de detalle de todos los productos.');
      return;
    }
    if (this.products().some((product) => !product.price.trim())) {
      this.productError.set('Completa el precio de todos los productos.');
      return;
    }
    if (this.deliveryScheduleOptions().some((option) => !option.trim())) {
      this.scheduleOptionsError.set('Completa todas las opciones de horario.');
      return;
    }
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
    this.saved.emit();
  }

  addProduct(): void {
    this.products.update((items) => [
      ...items,
      { id: this.createId('prod'), name: '', image: '', price: '' },
    ]);
  }

  removeProduct(index: number): void {
    this.products.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  updateProduct(index: number, key: keyof ProductDraft, value: string): void {
    this.products.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  onProductFileChange(index: number, files: FileList | null): void {
    const file = files?.item(0);
    if (!file) {
      this.updateProduct(index, 'image', '');
      this.updateProduct(index, 'fileName', '');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.updateProduct(index, 'image', String(reader.result ?? ''));
      this.updateProduct(index, 'fileName', file.name);
    };
    reader.readAsDataURL(file);
  }

  selectProduct(id: string): void {
    this.selectedProductId.set(id);
  }

  addScheduleOption(): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) => [...options, '']);
  }

  updateScheduleOption(index: number, value: string): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) =>
      options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    );
  }

  removeScheduleOption(index: number): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) =>
      options.filter((_, optionIndex) => optionIndex !== index),
    );
  }

  addField(): void {
    this.dynamicFields.update((fields) => [...fields, this.createEmptyField()]);
  }

  removeField(index: number): void {
    this.dynamicFields.update((fields) => fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  updateField(index: number, key: 'label' | 'type' | 'required', value: string | boolean): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, fieldIndex) => {
        if (fieldIndex !== index) {
          return field;
        }
        if (key === 'type' && value === 'select') {
          return { ...field, type: value, options: field.options?.length ? field.options : [''] };
        }
        if (key === 'type' && value !== 'select') {
          return { ...field, type: String(value), options: undefined };
        }
        return { ...field, [key]: value };
      }),
    );
  }

  addOption(fieldIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) =>
        index === fieldIndex ? { ...field, options: [...(field.options ?? ['']), ''] } : field,
      ),
    );
  }

  removeOption(fieldIndex: number, optionIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }
        const options = (field.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex);
        return { ...field, options: options.length ? options : [''] };
      }),
    );
  }

  updateOption(fieldIndex: number, optionIndex: number, value: string): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }
        return {
          ...field,
          options: (field.options ?? []).map((option, itemIndex) =>
            itemIndex === optionIndex ? value : option,
          ),
        };
      }),
    );
  }

  formatOptions(options?: string[]): string {
    const values = (options ?? []).map((option) => option.trim()).filter(Boolean);
    return values.length ? values.join(', ') : '-';
  }

  private createEmptyField(): DynamicFieldDraft {
    return { id: this.createId('field'), label: '', type: 'text', required: false };
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
