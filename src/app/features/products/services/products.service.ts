import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
import { Product, ProductCategory, ProductPage } from '../models/product.model';
import {
  ProductCategoriesResponse,
  ProductCategoryDto,
  ProductCategoryPayload,
  ProductDto,
  ProductListResponse,
  ProductPayload,
  ProductSubcategoriesResponse,
  ProductSubcategoryDto,
  ProductSubcategoryPayload,
} from './product.dto';

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  subcategoryId?: number;
  sort?: { key: string; direction: 'asc' | 'desc' };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly branchContext = inject(BranchContextStore);
  private readonly baseUrl = environment.apiUrl;

  list(query: ProductQuery = {}): Observable<ProductPage> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.pageSize ?? 10);
    const branchId = this.branchContext.activeBranchId();
    if (branchId) params = params.set('branch_id', branchId);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.categoryId) params = params.set('category_id', query.categoryId);
    if (query.subcategoryId) params = params.set('subcategory_id', query.subcategoryId);
    if (query.sort) {
      params = params
        .set('sort_by', mapSortKey(query.sort.key))
        .set('sort_dir', query.sort.direction);
    }
    return this.http.get<ProductListResponse>(`${this.baseUrl}/products`, { params }).pipe(
      map((response) => ({
        items: listData(response.datos).map(mapProduct),
        page: response.paginacion.current_page,
        pageSize: query.pageSize ?? 10,
        total: response.paginacion.total,
        totalPages: response.paginacion.last_page,
      })),
    );
  }

  categories(): Observable<ProductCategory[]> {
    return this.http
      .get<ProductCategoriesResponse>(`${this.baseUrl}/product-categories`)
      .pipe(map((response) => response.datos.map(mapCategory)));
  }

  createCategory(payload: ProductCategoryPayload): Observable<ProductCategory> {
    return this.http
      .post<{ datos: ProductCategoryDto }>(`${this.baseUrl}/product-categories`, payload)
      .pipe(map((response) => mapCategory(response.datos)));
  }

  updateCategory(
    id: number,
    payload: Partial<ProductCategoryPayload>,
  ): Observable<ProductCategory> {
    return this.http
      .patch<{ datos: ProductCategoryDto }>(`${this.baseUrl}/product-categories/${id}`, payload)
      .pipe(map((response) => mapCategory(response.datos)));
  }

  removeCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product-categories/${id}`);
  }

  subcategories(categoryId?: number): Observable<ProductSubcategoryDto[]> {
    let params = new HttpParams().set('per_page', 100);
    if (categoryId) params = params.set('category_id', categoryId);
    return this.http
      .get<ProductSubcategoriesResponse>(`${this.baseUrl}/product-subcategories`, { params })
      .pipe(map((response) => listData(response.datos)));
  }

  createSubcategory(payload: ProductSubcategoryPayload): Observable<ProductSubcategoryDto> {
    return this.http
      .post<{ datos: ProductSubcategoryDto }>(`${this.baseUrl}/product-subcategories`, payload)
      .pipe(map((response) => response.datos));
  }

  updateSubcategory(
    id: number,
    payload: Partial<ProductSubcategoryPayload>,
  ): Observable<ProductSubcategoryDto> {
    return this.http
      .patch<{
        datos: ProductSubcategoryDto;
      }>(`${this.baseUrl}/product-subcategories/${id}`, payload)
      .pipe(map((response) => response.datos));
  }

  removeSubcategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product-subcategories/${id}`);
  }

  create(payload: ProductPayload): Observable<Product> {
    const branchId = this.branchContext.activeBranchId();
    return this.http
      .post<{
        datos: ProductDto;
      }>(
        `${this.baseUrl}/products`,
        toFormData({ ...payload, branch_id: payload.branch_id ?? branchId ?? undefined }),
      )
      .pipe(map((response) => mapProduct(response.datos)));
  }

  update(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http
      .post<{ datos: ProductDto }>(`${this.baseUrl}/products/${id}`, toFormData(payload, true))
      .pipe(map((response) => mapProduct(response.datos)));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }
}

function toFormData(
  payload: ProductPayload | Partial<ProductPayload>,
  methodOverride = false,
): FormData {
  const formData = new FormData();

  if (methodOverride) {
    formData.append('_method', 'PATCH');
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (value instanceof File) {
      formData.append(key, value, value.name);
      return;
    }
    formData.append(key, String(value));
  });

  return formData;
}

function mapProduct(dto: ProductDto): Product {
  const imageUrl = dto.image_url ?? undefined;
  return {
    id: dto.id,
    subcategoryId: dto.subcategory_id ?? undefined,
    sku: dto.sku,
    name: dto.name,
    slug: dto.slug,
    description: dto.description ?? undefined,
    unit: dto.unit ?? 'unidad',
    basePrice:
      dto.base_price === null || dto.base_price === undefined ? undefined : Number(dto.base_price),
    imageUrl,
    imageThumbnailUrl: dto.image_thumbnail_url ?? deriveThumbnailUrl(imageUrl),
    isActive: dto.is_active ?? true,
    sortOrder: dto.sort_order ?? 0,
    subcategory: dto.subcategory
      ? {
          id: dto.subcategory.id,
          categoryId: dto.subcategory.category_id,
          name: dto.subcategory.name,
          slug: dto.subcategory.slug,
          description: dto.subcategory.description ?? undefined,
          isActive: dto.subcategory.is_active ?? true,
          sortOrder: dto.subcategory.sort_order ?? 0,
          category: dto.subcategory.category ? mapCategory(dto.subcategory.category) : undefined,
        }
      : undefined,
  };
}

function deriveThumbnailUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) {
    return undefined;
  }
  const originalMarker = '/original/';
  const markerIndex = imageUrl.indexOf(originalMarker);
  if (markerIndex < 0) {
    return undefined;
  }
  const fileName = imageUrl.slice(markerIndex + originalMarker.length);
  const thumbnailName = fileName.replace(/\.[^./]+$/, '.webp');
  return `${imageUrl.slice(0, markerIndex)}/thumbs/${thumbnailName}`;
}

function mapCategory(dto: ProductCategoryDto): ProductCategory {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description ?? undefined,
    isActive: dto.is_active ?? true,
    sortOrder: dto.sort_order ?? 0,
    subcategories: (dto.subcategories ?? []).map((item) => ({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      slug: item.slug,
      description: item.description ?? undefined,
      isActive: item.is_active ?? true,
      sortOrder: item.sort_order ?? 0,
    })),
  };
}

function mapSortKey(key: string): string {
  return (
    { sku: 'sku', name: 'name', basePrice: 'base_price', sortOrder: 'sort_order' }[key] ??
    'sort_order'
  );
}
function listData<T>(value: T[] | { data: T[] }): T[] {
  return Array.isArray(value) ? value : value.data;
}
