import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthStore } from '@features/auth/store/auth.store';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { Product, ProductCategory } from '../../models/product.model';
import {
  ProductTaxonomyFormModalComponent,
  ProductTaxonomyKind,
  ProductTaxonomyValue,
} from '../../components/product-taxonomy-form-modal/product-taxonomy-form-modal.component';
import { ProductTaxonomyManagerModalComponent } from '../../components/product-taxonomy-manager-modal/product-taxonomy-manager-modal.component';
import {
  ProductFormModalComponent,
  ProductFormValue,
} from '../../components/product-form-modal/product-form-modal.component';
import { ProductPayload } from '../../services/product.dto';
import { ProductsStore } from '../../store/products.store';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    ButtonComponent,
    ModalComponent,
    TableComponent,
    ProductFormModalComponent,
    ProductTaxonomyFormModalComponent,
    ProductTaxonomyManagerModalComponent,
  ],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  private readonly store = inject(ProductsStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly modalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly imageModalOpen = signal(false);
  readonly selectedImageUrl = signal<string | null>(null);
  readonly selectedImageName = signal<string | null>(null);
  readonly editingProduct = signal<Product | null>(null);
  readonly productToDelete = signal<Product | null>(null);
  readonly taxonomyModalOpen = signal(false);
  readonly taxonomyManagerOpen = signal(false);
  readonly taxonomyKind = signal<ProductTaxonomyKind>('category');
  readonly editingTaxonomy = signal<ProductTaxonomyValue | null>(null);
  readonly isSavingTaxonomy = signal(false);
  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedSubcategoryId = signal<number | null>(null);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly pageSize = signal(10);
  readonly sort = signal<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined);
  readonly filters = signal<Record<string, string>>({});
  readonly canManage = computed(() => this.authStore.hasPermission('products.manage'));
  readonly columns: TableColumn[] = [
    {
      key: 'imageThumbnailUrl',
      label: 'Imagen',
      sortable: false,
      filterable: false,
      type: 'image',
    },
    { key: 'sku', label: 'SKU', sortable: true, filterable: true },
    { key: 'name', label: 'Producto', sortable: true, filterable: true },
    { key: 'category', label: 'Categoría', sortable: false, filterable: false },
    { key: 'unit', label: 'Unidad', sortable: false, filterable: false },
    { key: 'basePrice', label: 'Precio base', sortable: true, filterable: false, align: 'right' },
    { key: 'status', label: 'Estado', sortable: false, filterable: false, type: 'badge' },
  ];
  readonly products = this.store.items;
  readonly categories = this.store.categories;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly rows = computed(() =>
    this.products().map((product) => ({
      id: product.id,
      imageThumbnailUrl: product.imageThumbnailUrl ?? '',
      imageUrl: product.imageUrl ?? '',
      sku: product.sku,
      name: product.name,
      category: product.subcategory
        ? `${product.subcategory.category?.name ?? '-'} / ${product.subcategory.name}`
        : '-',
      unit: product.unit,
      basePrice: product.basePrice === undefined ? '-' : `S/ ${product.basePrice.toFixed(2)}`,
      status: product.isActive ? 'Activo' : 'Inactivo',
    })),
  );
  readonly pagination = computed<TablePagination>(() => {
    const page = this.store.page();
    return {
      page: page.page,
      pageSize: this.pageSize(),
      total: page.total,
      lastPage: page.totalPages,
      pageSizeOptions: [10, 25, 50],
    };
  });
  readonly actions = computed<TableAction[]>(() =>
    this.canManage()
      ? [
          { id: 'edit', label: 'Editar', icon: 'file-pen-line', variant: 'ghost' },
          { id: 'delete', label: 'Desactivar', icon: 'x', variant: 'outline' },
        ]
      : [],
  );
  constructor() {
    this.store.load({ page: 1, pageSize: this.pageSize() });
    this.store.loadCategories();
  }
  openCreate(): void {
    this.editingProduct.set(null);
    this.modalOpen.set(true);
  }

  openCreateTaxonomy(kind: ProductTaxonomyKind): void {
    this.taxonomyKind.set(kind);
    this.editingTaxonomy.set(null);
    this.taxonomyModalOpen.set(true);
  }

  openTaxonomyManager(): void {
    this.taxonomyManagerOpen.set(true);
  }

  closeTaxonomyManager(): void {
    this.taxonomyManagerOpen.set(false);
  }

  openCreateSubcategory(categoryId: number): void {
    this.taxonomyKind.set('subcategory');
    this.editingTaxonomy.set({
      category_id: categoryId,
      name: '',
      slug: '',
      description: '',
      sort_order: 0,
    });
    this.taxonomyModalOpen.set(true);
  }

  openManagerEditSubcategory(event: {
    category: ProductCategory;
    subcategory: ProductCategory['subcategories'][number];
  }): void {
    this.openEditSubcategory(event.category, event.subcategory);
  }

  openEditCategory(category: ProductCategory): void {
    this.taxonomyKind.set('category');
    this.editingTaxonomy.set({
      id: category.id,
      name: category.name,
      slug: category.slug ?? '',
      description: category.description ?? '',
      sort_order: category.sortOrder ?? 0,
    });
    this.taxonomyModalOpen.set(true);
  }

  openEditSubcategory(
    category: ProductCategory,
    subcategory: ProductCategory['subcategories'][number],
  ): void {
    this.taxonomyKind.set('subcategory');
    this.editingTaxonomy.set({
      id: subcategory.id,
      category_id: category.id,
      name: subcategory.name,
      slug: subcategory.slug ?? '',
      description: subcategory.description ?? '',
      sort_order: subcategory.sortOrder ?? 0,
    });
    this.taxonomyModalOpen.set(true);
  }

  closeTaxonomyModal(): void {
    if (this.isSavingTaxonomy()) return;
    this.taxonomyModalOpen.set(false);
    this.editingTaxonomy.set(null);
  }

  saveTaxonomy(value: ProductTaxonomyValue): void {
    this.isSavingTaxonomy.set(true);
    const current = this.editingTaxonomy();
    const request =
      this.taxonomyKind() === 'category'
        ? current?.id
          ? this.store.updateCategory(current.id, value)
          : this.store.createCategory(value)
        : current?.id
          ? this.store.updateSubcategory(current.id, value)
          : this.store.createSubcategory({
              category_id: value.category_id ?? 0,
              name: value.name,
              slug: value.slug,
              description: value.description,
              sort_order: value.sort_order,
            });
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingTaxonomy.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeTaxonomyModal();
          this.store.loadCategories();
          this.store.load(this.query(this.store.page().page));
        },
        error: () => undefined,
      });
  }

  removeCategory(category: ProductCategory): void {
    this.store
      .removeCategory(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedCategoryId.set(null);
          this.selectedSubcategoryId.set(null);
          this.store.loadCategories();
          this.store.load(this.query(1));
        },
        error: () => undefined,
      });
  }

  removeSubcategory(subcategory: ProductCategory['subcategories'][number]): void {
    this.store
      .removeSubcategory(subcategory.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.store.loadCategories();
          this.store.load(this.query(1));
        },
        error: () => undefined,
      });
  }

  changeCategory(categoryId: string): void {
    const value = categoryId ? Number(categoryId) : null;
    this.selectedCategoryId.set(value);
    this.selectedSubcategoryId.set(null);
    this.store.load(this.query(1));
  }

  changeSubcategory(subcategoryId: string): void {
    this.selectedSubcategoryId.set(subcategoryId ? Number(subcategoryId) : null);
    this.store.load(this.query(1));
  }

  openImage(event: { row: Record<string, unknown>; url: string }): void {
    this.selectedImageUrl.set(String(event.row['imageUrl'] || event.url));
    this.selectedImageName.set(String(event.row['name'] ?? 'Producto'));
    this.imageModalOpen.set(true);
  }

  closeImage(): void {
    this.imageModalOpen.set(false);
    this.selectedImageUrl.set(null);
    this.selectedImageName.set(null);
  }
  closeModal(force = false): void {
    if (!force && this.isSaving()) return;
    this.modalOpen.set(false);
    this.editingProduct.set(null);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }
    this.deleteModalOpen.set(false);
  }
  onAction(event: { action: TableAction; row: Record<string, unknown> }): void {
    const product = this.products().find((item) => item.id === Number(event.row['id']));
    if (!product) return;
    if (event.action.id === 'edit') {
      this.editingProduct.set(product);
      this.modalOpen.set(true);
    } else {
      this.productToDelete.set(product);
      this.deleteModalOpen.set(true);
    }
  }
  save(value: ProductFormValue): void {
    const payload: ProductPayload = {
      subcategory_id: value.subcategory_id,
      name: value.name,
      description: value.description || undefined,
      unit: value.unit || undefined,
      base_price: value.base_price,
      image: value.image,
      sort_order: value.sort_order,
    };
    const product = this.editingProduct();
    this.isSaving.set(true);
    const request = product ? this.store.update(product.id, payload) : this.store.create(payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeModal(true);
          this.store.load(this.query(this.store.page().page));
        },
        error: () => undefined,
      });
  }
  confirmDelete(): void {
    const product = this.productToDelete();
    if (!product) return;
    this.isDeleting.set(true);
    this.store
      .remove(product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDeleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.deleteModalOpen.set(false);
          this.productToDelete.set(null);
          this.store.load(this.query(this.store.page().page));
        },
        error: () => undefined,
      });
  }
  changePage(page: number): void {
    this.store.load(this.query(page));
  }
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.store.load(this.query(1));
  }
  changeSort(sort: { key: string; direction: 'asc' | 'desc' }): void {
    this.sort.set(sort);
    this.store.load(this.query(1));
  }
  changeFilter(filter: { key: string; value: string }): void {
    this.filters.update((current) => ({ ...current, [filter.key]: filter.value }));
    this.store.load(this.query(1, filter));
  }
  private query(
    page: number,
    changedFilter?: { key: string; value: string },
  ): {
    page: number;
    pageSize: number;
    search?: string;
    categoryId?: number;
    subcategoryId?: number;
    sort?: { key: string; direction: 'asc' | 'desc' };
  } {
    const filters = {
      ...this.filters(),
      ...(changedFilter ? { [changedFilter.key]: changedFilter.value } : {}),
    };
    return {
      page,
      pageSize: this.pageSize(),
      search: filters['sku']?.trim() || filters['name']?.trim(),
      categoryId: this.selectedCategoryId() ?? undefined,
      subcategoryId: this.selectedSubcategoryId() ?? undefined,
      sort: this.sort(),
    };
  }
}
