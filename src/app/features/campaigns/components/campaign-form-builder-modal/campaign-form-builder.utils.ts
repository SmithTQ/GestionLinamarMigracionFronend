import { Product } from '@features/products/models/product.model';
import {
  CampaignProductAssignment,
  CatalogProduct,
} from '@features/campaigns/services/campaign-catalog.service';
import {
  CampaignFormFieldPayload,
  CampaignForm,
  FormFieldConfig,
  FormFieldGroup,
  FormFieldType,
  FormTemplate,
  FormTemplateFieldPayload,
} from '@features/campaigns/services/campaign-forms.service';

export interface ProductDraft {
  id: string;
  productId: number;
  sku: string;
  name: string;
  image: string;
  price: string;
  maxQuantity: string;
  sortOrder: number;
  isAvailable: boolean;
}

export interface DynamicFieldDraft {
  id: string;
  fieldId?: number;
  key?: string;
  label: string;
  description?: string | null;
  type: FormFieldConfig['type'];
  fieldGroup: FormFieldGroup;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
  options?: string[];
  config?: Record<string, unknown>;
  locked: boolean;
}

export interface CustomFieldDraftValue {
  key: string;
  label: string;
  type: FormFieldType;
}

export const OPTIONAL_FIXED_FIELD_KEYS = new Set(['address', 'delivery_date', 'delivery_time']);

export const SYSTEM_REQUIRED_FIELD_KEYS = new Set([
  'product',
  'sender_name',
  'sender_phone',
  'recipient_name',
  'recipient_phone',
  'district',
  'location',
  'delivery_reference',
]);

export function createDraftId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function toProductDraft(product: CatalogProduct, index: number): ProductDraft {
  return {
    id: createDraftId('product'),
    productId: product.id,
    sku: product.sku,
    name: product.name,
    image: product.image_thumbnail_url ?? product.image_url ?? '',
    price: String(product.campaign_pivot?.price ?? product.base_price ?? ''),
    maxQuantity: String(product.campaign_pivot?.max_quantity ?? ''),
    sortOrder: product.campaign_pivot?.sort_order ?? index,
    isAvailable: product.campaign_pivot?.is_available ?? true,
  };
}

export function toCatalogProduct(product: Product): CatalogProduct {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    base_price: product.basePrice,
    image_url: product.imageUrl,
    image_thumbnail_url: product.imageThumbnailUrl,
  };
}

export function toFieldDraft(field: FormFieldConfig): DynamicFieldDraft {
  const fieldGroup =
    field.fieldGroup ??
    (OPTIONAL_FIXED_FIELD_KEYS.has(field.key)
      ? 'optional_base'
      : field.isSystem
        ? 'required_base'
        : 'custom');
  const config = field.formConfig?.config ?? undefined;
  return {
    id: createDraftId('field'),
    fieldId: field.id,
    key: field.key,
    label: field.formConfig?.label ?? field.label,
    description: field.description,
    type: field.type,
    fieldGroup,
    required: fieldGroup === 'required_base' || (field.formConfig?.isRequired ?? false),
    enabled: field.formConfig?.isEnabled ?? true,
    sortOrder: field.formConfig?.sortOrder ?? field.sortOrder,
    options: Array.isArray(config?.['options']) ? (config['options'] as string[]) : undefined,
    config,
    locked: fieldGroup === 'required_base',
  };
}

export function isRequiredField(field: DynamicFieldDraft): boolean {
  return field.fieldGroup === 'required_base';
}

export function fieldConfig(field: DynamicFieldDraft): Record<string, unknown> | undefined {
  const config = { ...(field.config ?? {}) };
  if (field.options) {
    config['options'] = field.options.filter(Boolean);
  }
  return Object.keys(config).length ? config : undefined;
}

export function validateFieldOptions(fields: DynamicFieldDraft[]): string | null {
  for (const field of fields) {
    const usesOptions = field.type === 'select' || field.key === 'delivery_time';
    if (!usesOptions) continue;

    const options = (field.options ?? []).map((option) => option.trim());
    if (!options.length || options.some((option) => !option)) {
      return `Completa todas las opciones del campo "${field.label}".`;
    }

    const normalizedOptions = options.map((option) => option.toLocaleLowerCase());
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      return `El campo "${field.label}" no puede tener opciones duplicadas.`;
    }
  }
  return null;
}

export function validateMandatoryFields(fields: DynamicFieldDraft[]): string | null {
  return !fields.length || fields.some((field) => !field.enabled)
    ? 'La plantilla no tiene completos todos los campos obligatorios.'
    : null;
}

export function validateProductDrafts(products: ProductDraft[]): string | null {
  if (!products.length) return 'Agrega al menos un producto antes de continuar.';
  if (products.some((product) => !product.name.trim() || !product.price.trim())) {
    return 'Completa el nombre y precio de todos los productos.';
  }
  if (products.some((product) => !Number.isFinite(Number(product.price)))) {
    return 'Los precios deben ser valores numéricos.';
  }
  return null;
}

export function validateFieldLabels(fields: DynamicFieldDraft[]): string | null {
  return fields.some((field) => !field.label.trim())
    ? 'Completa el nombre de todos los campos.'
    : null;
}

export function validateFieldGroup(
  fields: DynamicFieldDraft[],
  group: 'optional_base' | 'custom',
): string | null {
  const groupFields = fields.filter((field) => field.fieldGroup === group);
  if (groupFields.some((field) => !field.label.trim())) {
    return 'Completa el nombre de todos los campos antes de continuar.';
  }
  return validateFieldOptions(groupFields);
}

export function buildCustomFieldPayload(
  value: CustomFieldDraftValue,
  template: FormTemplate | undefined,
): { payload: FormTemplateFieldPayload | undefined; error?: string } {
  const key = value.key.trim().toLowerCase();
  const label = value.label.trim();
  if (!key || !label) {
    return { payload: undefined, error: 'Completa la clave y el nombre del campo.' };
  }
  if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(key)) {
    return {
      payload: undefined,
      error: 'La clave debe usar minúsculas, números y guion bajo.',
    };
  }
  return {
    payload: {
      key,
      label,
      type: value.type,
      sort_order: template?.fields.length ?? 0,
    },
  };
}

export function appendFieldToTemplate(
  templates: readonly FormTemplate[],
  templateId: number,
  field: FormFieldConfig,
): FormTemplate[] {
  return templates.map((template) =>
    template.id === templateId ? { ...template, fields: [...template.fields, field] } : template,
  );
}

export function toProductAssignments(products: ProductDraft[]): CampaignProductAssignment[] {
  return products.map((product, index) => ({
    product_id: product.productId,
    price: product.price.trim() ? Number(product.price) : null,
    is_available: product.isAvailable,
    sort_order: index,
    max_quantity: product.maxQuantity.trim() ? Number(product.maxQuantity) : null,
  }));
}

export function toFormFieldPayloads(fields: DynamicFieldDraft[]): CampaignFormFieldPayload[] {
  return fields
    .filter((field) => field.fieldId)
    .map((field, index) => ({
      field_id: field.fieldId!,
      is_enabled: field.fieldGroup === 'required_base' ? true : field.enabled,
      is_required: isRequiredField(field) || field.required,
      label: field.label.trim() || null,
      config: fieldConfig(field),
      sort_order: index,
    }));
}

export function selectForm(forms: CampaignForm[]): CampaignForm | undefined {
  return (
    forms.find((form) => form.status === 'draft') ??
    forms.find((form) => form.status === 'published') ??
    forms[0]
  );
}

export function mergeTemplateFields(
  templateFields: FormFieldConfig[],
  formFields: FormFieldConfig[],
): FormFieldConfig[] {
  const templateById = new Map(templateFields.map((field) => [field.id, field]));
  const savedIds = new Set(formFields.map((field) => field.id));
  const savedFields = [...formFields]
    .sort((left, right) => fieldOrder(left) - fieldOrder(right))
    .map((field) => ({
      ...(templateById.get(field.id) ?? field),
      ...field,
      formConfig: field.formConfig,
    }));
  const missingRequiredFields = templateFields
    .filter(
      (field) =>
        (field.fieldGroup ?? (field.isSystem ? 'required_base' : 'custom')) === 'required_base' &&
        !savedIds.has(field.id),
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return [...savedFields, ...missingRequiredFields];
}

function fieldOrder(field: FormFieldConfig): number {
  return field.formConfig?.sortOrder ?? field.sortOrder;
}
