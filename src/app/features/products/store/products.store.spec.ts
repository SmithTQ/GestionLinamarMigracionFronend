import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ProductPage } from '../models/product.model';
import { ProductsService } from '../services/products.service';
import { ProductsStore } from './products.store';

describe('ProductsStore', () => {
  it('keeps the latest list response when requests finish out of order', () => {
    const firstRequest = new Subject<ProductPage>();
    const secondRequest = new Subject<ProductPage>();
    const list = jasmine
      .createSpy('list')
      .and.returnValues(firstRequest.asObservable(), secondRequest.asObservable());
    TestBed.configureTestingModule({
      providers: [ProductsStore, { provide: ProductsService, useValue: { list } }],
    });
    const store = TestBed.inject(ProductsStore);

    store.load({ page: 1 });
    store.load({ page: 2 });
    firstRequest.next(productPage(1, 'old'));
    secondRequest.next(productPage(2, 'new'));
    secondRequest.complete();

    expect(store.page().page).toBe(2);
    expect(store.items()[0].name).toBe('new');
    expect(store.isLoading()).toBeFalse();
  });
});

function productPage(page: number, name: string): ProductPage {
  return {
    items: [
      {
        id: page,
        sku: `SKU-${page}`,
        name,
        slug: name,
        unit: 'unidad',
        isActive: true,
        sortOrder: 0,
      },
    ],
    page,
    pageSize: 10,
    total: 1,
    totalPages: 1,
  };
}
