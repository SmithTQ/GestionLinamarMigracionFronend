import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ProductCategory } from '../../models/product.model';

export type ProductTaxonomyKind = 'category' | 'subcategory';

export interface ProductTaxonomyValue {
  id?: number;
  category_id?: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

@Component({
  selector: 'app-product-taxonomy-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, ModalComponent],
  templateUrl: './product-taxonomy-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTaxonomyFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() kind: ProductTaxonomyKind = 'category';
  @Input() item: ProductTaxonomyValue | null = null;
  @Input() categories: ProductCategory[] = [];
  @Input() isSaving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<ProductTaxonomyValue>();

  readonly form = new FormGroup({
    category_id: new FormControl<number | null>(null),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    sort_order: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  ngOnChanges(): void {
    if (this.kind === 'subcategory') {
      this.form.controls.category_id.setValidators([Validators.required]);
    } else {
      this.form.controls.category_id.clearValidators();
    }
    this.form.controls.category_id.updateValueAndValidity({ emitEvent: false });
    this.form.reset({
      category_id: this.item?.category_id ?? null,
      name: this.item?.name ?? '',
      slug: this.item?.slug ?? '',
      description: this.item?.description ?? '',
      sort_order: this.item?.sort_order ?? 0,
    });
    this.form.markAsUntouched();
  }

  get title(): string {
    const subject = this.kind === 'category' ? 'categoría' : 'subcategoría';
    return `${this.item ? 'Editar' : 'Crear'} ${subject}`;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;
    this.submitted.emit(this.form.getRawValue() as ProductTaxonomyValue);
  }
}
