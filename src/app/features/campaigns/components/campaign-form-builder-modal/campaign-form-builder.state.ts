import { CatalogProduct } from '@features/campaigns/services/campaign-catalog.service';
import { Product } from '@features/products/models/product.model';
import {
  DynamicFieldDraft,
  ProductDraft,
  toCatalogProduct,
  toProductDraft,
} from './campaign-form-builder.utils';

export function selectedProductIds(
  products: readonly ProductDraft[],
  availableProducts: readonly CatalogProduct[],
): number[] {
  const assignedIds = new Set(products.map((product) => product.productId));
  return availableProducts
    .filter((product) => !assignedIds.has(product.id))
    .map((product) => product.id);
}

export function appendSelectedProducts(
  products: readonly ProductDraft[],
  availableProducts: readonly CatalogProduct[],
  selectedIds: readonly number[],
): ProductDraft[] {
  const selected = new Set(selectedIds);
  const currentIds = new Set(products.map((product) => product.productId));
  const additions = availableProducts
    .filter((product) => selected.has(product.id) && !currentIds.has(product.id))
    .map((product, index) => toProductDraft(product, products.length + index));
  return [...products, ...additions];
}

export function updateProductDraft(
  products: readonly ProductDraft[],
  index: number,
  key: 'price' | 'maxQuantity',
  value: string,
): ProductDraft[] {
  return products.map((product, itemIndex) =>
    itemIndex === index ? { ...product, [key]: value } : product,
  );
}

export function updateProductAvailability(
  products: readonly ProductDraft[],
  index: number,
  isAvailable: boolean,
): ProductDraft[] {
  return products.map((product, itemIndex) =>
    itemIndex === index ? { ...product, isAvailable } : product,
  );
}

export function appendCreatedProduct(
  products: readonly ProductDraft[],
  availableProducts: readonly CatalogProduct[],
  product: Product,
): { products: ProductDraft[]; availableProducts: CatalogProduct[] } {
  const catalogProduct = toCatalogProduct(product);
  return {
    availableProducts: [...availableProducts, catalogProduct],
    products: [...products, toProductDraft(catalogProduct, products.length)],
  };
}

export function reorderFields(
  fields: readonly DynamicFieldDraft[],
  sourceId: string,
  targetId: string,
): DynamicFieldDraft[] {
  const sourceIndex = fields.findIndex((field) => field.id === sourceId);
  const targetIndex = fields.findIndex((field) => field.id === targetId);
  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    fields[sourceIndex].locked !== fields[targetIndex].locked
  ) {
    return [...fields];
  }
  const reordered = [...fields];
  const [source] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, source);
  return reordered;
}
