import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface FormPreviewProduct {
  id: string;
  name: string;
  price: string;
}

export interface FormPreviewField {
  id: string;
  key?: string;
  label: string;
  locked: boolean;
}

@Component({
  selector: 'app-campaign-form-preview',
  standalone: true,
  templateUrl: './campaign-form-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignFormPreviewComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() products: readonly FormPreviewProduct[] = [];
  @Input() mandatoryFields: readonly FormPreviewField[] = [];
  @Input() additionalFields: readonly FormPreviewField[] = [];

  get includedFields(): readonly FormPreviewField[] {
    return [...this.mandatoryFields, ...this.additionalFields];
  }
}
