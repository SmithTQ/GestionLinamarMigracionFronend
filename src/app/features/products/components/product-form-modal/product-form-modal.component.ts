import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductCategory } from '../../models/product.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

export interface ProductFormValue {
  subcategory_id: number | null;
  name: string;
  description: string;
  unit: string;
  base_price: number | null;
  image: File | null;
  sort_order: number;
}

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, ModalComponent],
  templateUrl: './product-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() product: Product | null = null;
  @Input() categories: ProductCategory[] = [];
  @Input() isSaving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<ProductFormValue>();
  readonly selectedImageName = signal<string | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly form = new FormGroup({
    subcategory_id: new FormControl<number | null>(null),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    unit: new FormControl('unidad', { nonNullable: true }),
    base_price: new FormControl<number | null>(null),
    image: new FormControl<File | null>(null),
    sort_order: new FormControl(0, { nonNullable: true }),
  });
  ngOnChanges(): void {
    const item = this.product;
    this.form.reset({
      subcategory_id: item?.subcategoryId ?? null,
      name: item?.name ?? '',
      description: item?.description ?? '',
      unit: item?.unit ?? 'unidad',
      base_price: item?.basePrice ?? null,
      image: null,
      sort_order: item?.sortOrder ?? 0,
    });
    this.selectedImageName.set(null);
    this.imagePreviewUrl.set(item?.imageUrl ?? null);
    this.imageError.set(null);
    this.form.markAsUntouched();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setImage(input.files?.[0] ?? null);
    input.value = '';
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.setImage(event.dataTransfer?.files[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setImage(image: File | null): void {
    this.imageError.set(null);
    if (!image) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      this.imageError.set('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      this.imageError.set('La imagen no puede superar los 5 MB.');
      return;
    }
    this.form.controls.image.setValue(image);
    this.form.controls.image.markAsTouched();
    this.selectedImageName.set(image.name);
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(String(reader.result ?? ''));
    reader.readAsDataURL(image);
  }
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;
    this.submitted.emit(this.form.getRawValue());
  }
}
