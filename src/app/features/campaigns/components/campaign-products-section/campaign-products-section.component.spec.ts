import { CampaignProductsSectionComponent } from './campaign-products-section.component';

describe('CampaignProductsSectionComponent', () => {
  it('exposes typed product actions through outputs', () => {
    const component = new CampaignProductsSectionComponent();
    let selection: unknown;
    let update: unknown;
    component.productSelectionChanged.subscribe((event) => (selection = event));
    component.productUpdated.subscribe((event) => (update = event));

    component.productSelectionChanged.emit({ productId: 12, checked: true });
    component.productUpdated.emit({ index: 1, key: 'price', value: '25.50' });

    expect(selection).toEqual({ productId: 12, checked: true });
    expect(update).toEqual({ index: 1, key: 'price', value: '25.50' });
  });
});
