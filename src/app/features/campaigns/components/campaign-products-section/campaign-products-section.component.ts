import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CatalogProduct } from '@features/campaigns/services/campaign-catalog.service';

export interface CampaignProductView {
  id: string;
  sku: string;
  name: string;
  image: string;
  price: string;
  maxQuantity: string;
  isAvailable: boolean;
}

export interface ProductUpdateEvent {
  index: number;
  key: 'price' | 'maxQuantity';
  value: string;
}

export interface ProductAvailabilityEvent {
  index: number;
  isAvailable: boolean;
}

export interface AvailableProductSelectionEvent {
  productId: number;
  checked: boolean;
}

@Component({
  selector: 'app-campaign-products-section',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './campaign-products-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignProductsSectionComponent {
  @Input() products: readonly CampaignProductView[] = [];
  @Input() selectableProducts: readonly CatalogProduct[] = [];
  @Input() selectedProductIds: readonly number[] = [];
  @Input() productPickerOpen = false;
  @Input() readOnly = false;
  @Input() productError: string | null = null;
  @Input() productCreateError: string | null = null;

  @Output() productPickerRequested = new EventEmitter<void>();
  @Output() productCreationRequested = new EventEmitter<void>();
  @Output() productPickerClosed = new EventEmitter<void>();
  @Output() allProductsSelected = new EventEmitter<void>();
  @Output() productSelectionChanged = new EventEmitter<AvailableProductSelectionEvent>();
  @Output() selectedProductsAdded = new EventEmitter<void>();
  @Output() productUpdated = new EventEmitter<ProductUpdateEvent>();
  @Output() productAvailabilityChanged = new EventEmitter<ProductAvailabilityEvent>();
  @Output() productRemoved = new EventEmitter<number>();
}
