import { CatalogProduct } from '@features/campaigns/services/campaign-catalog.service';
import { DynamicFieldDraft, ProductDraft } from './campaign-form-builder.utils';
import {
  appendSelectedProducts,
  appendCreatedProduct,
  reorderFields,
  selectedProductIds,
  updateProductAvailability,
  updateProductDraft,
} from './campaign-form-builder.state';

describe('campaign form builder state utilities', () => {
  const catalog: CatalogProduct[] = [
    { id: 1, sku: 'SKU-1', name: 'Producto 1', base_price: 10, image_url: '' },
    { id: 2, sku: 'SKU-2', name: 'Producto 2', base_price: 20, image_url: '' },
  ];
  const assigned = [
    {
      id: 'product-1',
      productId: 1,
      sku: 'SKU-1',
      name: 'Producto 1',
      image: '',
      price: '10',
      maxQuantity: '',
      sortOrder: 0,
      isAvailable: true,
    },
  ] as ProductDraft[];

  it('returns only products that are not already assigned', () => {
    expect(selectedProductIds(assigned, catalog)).toEqual([2]);
  });

  it('appends selected products without creating duplicates', () => {
    const result = appendSelectedProducts(assigned, catalog, [1, 2]);
    expect(result.map((product) => product.productId)).toEqual([1, 2]);
  });

  it('updates product values immutably', () => {
    expect(updateProductDraft(assigned, 0, 'price', '12')[0].price).toBe('12');
    expect(updateProductAvailability(assigned, 0, false)[0].isAvailable).toBeFalse();
    expect(assigned[0].price).toBe('10');
  });

  it('adds a created product to the catalog and assigned products', () => {
    const result = appendCreatedProduct(assigned, catalog, {
      id: 3,
      sku: 'SKU-3',
      name: 'Producto 3',
      slug: 'producto-3',
      basePrice: 30,
      imageUrl: '',
      imageThumbnailUrl: '',
      unit: 'unidad',
      isActive: true,
      sortOrder: 0,
    });

    expect(result.availableProducts.at(-1)?.id).toBe(3);
    expect(result.products.at(-1)?.productId).toBe(3);
    expect(assigned).toHaveSize(1);
  });

  it('reorders only fields from the same lock group', () => {
    const fields = [
      { id: 'a', locked: false },
      { id: 'b', locked: false },
      { id: 'c', locked: true },
    ] as DynamicFieldDraft[];
    expect(reorderFields(fields, 'b', 'a').map((field) => field.id)).toEqual(['b', 'a', 'c']);
    expect(reorderFields(fields, 'b', 'c').map((field) => field.id)).toEqual(['a', 'b', 'c']);
  });
});
