export interface Product {
  id: number;
  subcategoryId?: number;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  unit: string;
  basePrice?: number;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  isActive: boolean;
  sortOrder: number;
  subcategory?: ProductSubcategory;
}

export interface ProductSubcategory {
  id: number;
  categoryId: number;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  category?: ProductCategory;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  subcategories: ProductSubcategory[];
}

export interface ProductPage {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
