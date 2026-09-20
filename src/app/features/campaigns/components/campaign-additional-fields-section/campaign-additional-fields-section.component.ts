import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import {
  FormFieldConfig,
  FormFieldGroup,
  FormFieldType,
} from '@features/campaigns/services/campaign-forms.service';

export interface AdditionalFieldView {
  id: string;
  key?: string;
  label: string;
  description?: string | null;
  type: FormFieldType;
  fieldGroup?: FormFieldGroup;
  required: boolean;
  options?: string[];
  locked: boolean;
}

export interface AdditionalFieldUpdateEvent {
  fieldId: string;
  key: 'label' | 'type' | 'required' | 'enabled';
  value: string | boolean;
}

export interface AdditionalFieldOptionEvent {
  fieldId: string;
  optionIndex: number;
  value?: string;
}

@Component({
  selector: 'app-campaign-additional-fields-section',
  standalone: true,
  imports: [ButtonComponent, InputComponent],
  templateUrl: './campaign-additional-fields-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignAdditionalFieldsSectionComponent {
  @Input() fields: readonly AdditionalFieldView[] = [];
  @Input() availableFields: readonly FormFieldConfig[] = [];
  @Input() visibleGroup: FormFieldGroup = 'optional_base';
  @Input() selectedTemplate = false;
  @Input() readOnly = false;
  @Input() draggedFieldId: string | null = null;
  @Input() fieldLabelError: string | null = null;

  @Output() customFieldRequested = new EventEmitter<void>();
  @Output() fieldAdded = new EventEmitter<FormFieldConfig>();
  @Output() fieldUpdated = new EventEmitter<AdditionalFieldUpdateEvent>();
  @Output() optionAdded = new EventEmitter<string>();
  @Output() optionUpdated = new EventEmitter<AdditionalFieldOptionEvent>();
  @Output() optionRemoved = new EventEmitter<AdditionalFieldOptionEvent>();
  @Output() fieldRemoved = new EventEmitter<string>();
  @Output() fieldDragStarted = new EventEmitter<{ fieldId: string; event: DragEvent }>();
  @Output() fieldDragOver = new EventEmitter<DragEvent>();
  @Output() fieldDropped = new EventEmitter<{ fieldId: string; event: DragEvent }>();
  @Output() fieldDragEnded = new EventEmitter<void>();

  visibleFields(): readonly AdditionalFieldView[] {
    return this.fields.filter((field) => field.fieldGroup === this.visibleGroup);
  }

  visibleAvailableFields(): readonly FormFieldConfig[] {
    return this.availableFields.filter((field) => field.fieldGroup === this.visibleGroup);
  }

  isOptionalBase(field: AdditionalFieldView): boolean {
    return field.fieldGroup === 'optional_base';
  }

  isCustom(field: AdditionalFieldView): boolean {
    return field.fieldGroup === 'custom' || !field.fieldGroup;
  }

  optionalAvailableFields(): readonly FormFieldConfig[] {
    return this.availableFields.filter((field) => field.fieldGroup === 'optional_base');
  }

  customAvailableFields(): readonly FormFieldConfig[] {
    return this.availableFields.filter(
      (field) => field.fieldGroup === 'custom' || !field.fieldGroup,
    );
  }

  isFirstInGroup(field: AdditionalFieldView, index: number): boolean {
    return !this.visibleFields()
      .slice(0, index)
      .some((item) => item.fieldGroup === field.fieldGroup);
  }

  isFirstAvailableInGroup(field: FormFieldConfig, index: number): boolean {
    return !this.availableFields
      .slice(0, index)
      .some((item) => (item.fieldGroup ?? 'custom') === (field.fieldGroup ?? 'custom'));
  }
}
