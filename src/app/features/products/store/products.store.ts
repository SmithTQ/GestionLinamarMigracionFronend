import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize } from 'rxjs';
import { Product, ProductCategory, ProductPage } from '../models/product.model';
import {
  ProductCategoryPayload,
  ProductPayload,
  ProductSubcategoryPayload,
} from '../services/product.dto';
import { ProductQuery, ProductsService } from '../services/products.service';

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly service = inject(ProductsService);
  private readonly itemsState = signal<Product[]>([]);
  private readonly pageState = signal<ProductPage>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  private readonly categoriesState = signal<ProductCategory[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private loadRequestId = 0;
  readonly items = this.itemsState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly hasItems = computed(() => this.items().length > 0);

  load(query: ProductQuery): void {
    const requestId = ++this.loadRequestId;
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service
      .list(query)
      .pipe(
        finalize(() => {
          if (requestId === this.loadRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (page) => {
          if (requestId !== this.loadRequestId) {
            return;
          }
          this.pageState.set(page);
          this.itemsState.set(page.items);
        },
        error: () => {
          if (requestId === this.loadRequestId) {
            this.errorState.set('No se pudieron cargar los productos.');
          }
        },
      });
  }

  loadCategories(): void {
    this.service
      .categories()
      .pipe(
        catchError(() => {
          this.errorState.set('No se pudieron cargar las categorías.');
          return EMPTY;
        }),
      )
      .subscribe({ next: (categories) => this.categoriesState.set(categories) });
  }

  createCategory(payload: ProductCategoryPayload): Observable<ProductCategory> {
    return this.service.createCategory(payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo crear la categoría.');
        throw error;
      }),
    );
  }

  updateCategory(
    id: number,
    payload: Partial<ProductCategoryPayload>,
  ): Observable<ProductCategory> {
    return this.service.updateCategory(id, payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo actualizar la categoría.');
        throw error;
      }),
    );
  }

  removeCategory(id: number): Observable<void> {
    return this.service.removeCategory(id).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo desactivar la categoría.');
        throw error;
      }),
    );
  }

  createSubcategory(payload: ProductSubcategoryPayload): Observable<unknown> {
    return this.service.createSubcategory(payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo crear la subcategoría.');
        throw error;
      }),
    );
  }

  updateSubcategory(id: number, payload: Partial<ProductSubcategoryPayload>): Observable<unknown> {
    return this.service.updateSubcategory(id, payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo actualizar la subcategoría.');
        throw error;
      }),
    );
  }

  removeSubcategory(id: number): Observable<void> {
    return this.service.removeSubcategory(id).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo desactivar la subcategoría.');
        throw error;
      }),
    );
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.service.create(payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo crear el producto.');
        throw error;
      }),
    );
  }
  update(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.service.update(id, payload).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo actualizar el producto.');
        throw error;
      }),
    );
  }
  remove(id: number): Observable<void> {
    return this.service.remove(id).pipe(
      catchError((error) => {
        this.errorState.set('No se pudo desactivar el producto.');
        throw error;
      }),
    );
  }
}
