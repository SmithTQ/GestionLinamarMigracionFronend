import { ApiResponse } from '@core/models/api-response.model';

export interface ProductDto {
  id: number;
  subcategory_id?: number | null;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  unit?: string | null;
  base_price?: number | string | null;
  image_url?: string | null;
  image_thumbnail_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  subcategory?: ProductSubcategoryDto;
}

export interface ProductSubcategoryDto {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  category?: ProductCategoryDto;
}

export interface ProductCategoryDto {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  subcategories?: ProductSubcategoryDto[];
}

export interface ProductCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}

export interface ProductSubcategoryPayload {
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}

export interface ProductPayload {
  branch_id?: number;
  subcategory_id?: number | null;
  sku?: string;
  name: string;
  slug?: string;
  description?: string;
  unit?: string;
  base_price?: number | null;
  image?: File | null;
  sort_order?: number;
}

export interface ProductListResponse extends ApiResponse<ProductDto[] | { data: ProductDto[] }> {
  paginacion: { current_page: number; last_page: number; total: number };
}

export type ProductCategoriesResponse = ApiResponse<ProductCategoryDto[]>;
export type ProductSubcategoriesResponse = ApiResponse<
  ProductSubcategoryDto[] | { data: ProductSubcategoryDto[] }
> & { paginacion: { current_page: number; last_page: number; total: number } };
