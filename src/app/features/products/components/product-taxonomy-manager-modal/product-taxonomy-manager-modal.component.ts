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
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ProductCategory, ProductSubcategory } from '../../models/product.model';

@Component({
  selector: 'app-product-taxonomy-manager-modal',
  standalone: true,
  imports: [ButtonComponent, ModalComponent],
  templateUrl: './product-taxonomy-manager-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTaxonomyManagerModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() categories: ProductCategory[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() createCategory = new EventEmitter<void>();
  @Output() editCategory = new EventEmitter<ProductCategory>();
  @Output() removeCategory = new EventEmitter<ProductCategory>();
  @Output() createSubcategory = new EventEmitter<number>();
  @Output() editSubcategory = new EventEmitter<{
    category: ProductCategory;
    subcategory: ProductSubcategory;
  }>();
  @Output() removeSubcategory = new EventEmitter<ProductSubcategory>();

  readonly selectedCategoryId = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true || changes['categories']) {
      const selectedExists = this.categories.some(
        (category) => category.id === this.selectedCategoryId(),
      );
      if (!selectedExists) {
        this.selectedCategoryId.set(this.categories[0]?.id ?? null);
      }
    }
  }

  selectCategory(category: ProductCategory): void {
    this.selectedCategoryId.set(category.id);
  }

  selectedCategory(): ProductCategory | undefined {
    return this.categories.find((category) => category.id === this.selectedCategoryId());
  }

  trackSubcategory(_index: number, subcategory: ProductSubcategory): number {
    return subcategory.id;
  }
}
