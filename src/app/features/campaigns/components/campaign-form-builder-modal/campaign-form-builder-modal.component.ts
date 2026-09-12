import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, map, switchMap } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  CampaignProductAssignment,
  CatalogProduct,
  CampaignCatalogService,
} from '@features/campaigns/services/campaign-catalog.service';
import {
  CampaignForm,
  CampaignFormFieldPayload,
  CampaignFormsService,
  FormFieldConfig,
  FormTemplate,
} from '@features/campaigns/services/campaign-forms.service';
import { Campaign, CampaignBranch } from '@features/campaigns/models/campaign.model';

interface ProductDraft {
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

interface DynamicFieldDraft {
  id: string;
  fieldId?: number;
  key?: string;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
  options?: string[];
}

@Component({
  selector: 'app-campaign-form-builder-modal',
  standalone: true,
  imports: [ButtonComponent, InputComponent, ModalComponent, NgClass],
  templateUrl: './campaign-form-builder-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignFormBuilderModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() campaignId: number | null = null;
  @Input() campaign: Campaign | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly catalogService = inject(CampaignCatalogService);
  private readonly formsService = inject(CampaignFormsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly products = signal<ProductDraft[]>([]);
  readonly availableProducts = signal<CatalogProduct[]>([]);
  readonly selectedProductId = signal<string | null>(null);
  readonly dynamicFields = signal<DynamicFieldDraft[]>([]);
  readonly deliveryScheduleOptions = signal<string[]>(['09:00 - 13:00', '13:00 - 18:00']);
  readonly productError = signal<string | null>(null);
  readonly fieldLabelError = signal<string | null>(null);
  readonly scheduleOptionsError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly title = signal('Formulario de pedidos');
  readonly description = signal('Completa tus datos para registrar tu pedido.');
  readonly branches = signal<CampaignBranch[]>([]);
  readonly templates = signal<FormTemplate[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedTemplateId = signal<number | null>(null);
  readonly currentForm = signal<CampaignForm | null>(null);
  readonly formStatus = signal<CampaignForm['status']>('draft');
  readonly activeStep = signal(0);
  readonly stepLabels = ['Datos básicos', 'Productos', 'Campos', 'Revisión'];

  readonly fixedFields = [
    'Detalle',
    'Remitente',
    'Telef. Remitente',
    'Destinatario',
    'Telef. Destinatario',
    'Distrito',
    'Direccion',
    'Horario de entrega',
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.loadProducts();
    }
  }

  close(): void {
    if (this.isLoading() || this.isSaving()) {
      return;
    }
    this.closed.emit();
  }

  publishForm(): void {
    const form = this.currentForm();
    if (!form || this.isSaving()) return;
    this.isSaving.set(true);
    this.formsService
      .publish(form.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.currentForm.set(updated);
          this.formStatus.set(updated.status);
        },
        error: () => this.loadError.set('No se pudo publicar el formulario.'),
      });
  }

  closeForm(): void {
    const form = this.currentForm();
    if (!form || this.isSaving()) return;
    this.isSaving.set(true);
    this.formsService
      .close(form.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.formStatus.set('closed'),
        error: () => this.loadError.set('No se pudo cerrar el formulario.'),
      });
  }

  reset(): void {
    this.products.set([]);
    this.selectedProductId.set(null);
    this.dynamicFields.set([]);
    this.deliveryScheduleOptions.set(['09:00 - 13:00', '13:00 - 18:00']);
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
    this.loadError.set(null);
    this.title.set('Formulario de pedidos');
    this.description.set('Completa tus datos para registrar tu pedido.');
    this.branches.set(this.campaign?.branches ?? []);
    this.selectedBranchId.set(this.campaign?.branches?.[0]?.id ?? null);
    this.selectedTemplateId.set(null);
    this.currentForm.set(null);
    this.formStatus.set('draft');
    this.activeStep.set(0);
  }

  nextStep(): void {
    if (
      this.activeStep() === 0 &&
      (!this.title().trim() || !this.selectedBranchId() || !this.selectedTemplateId())
    ) {
      this.loadError.set('Completa los datos básicos antes de continuar.');
      return;
    }
    this.loadError.set(null);
    this.activeStep.update((step) => Math.min(step + 1, this.stepLabels.length - 1));
  }

  previousStep(): void {
    this.loadError.set(null);
    this.activeStep.update((step) => Math.max(step - 1, 0));
  }

  save(): void {
    if (this.isSaving()) {
      return;
    }
    if (this.dynamicFields().some((field) => !field.label.trim())) {
      this.fieldLabelError.set('Completa el nombre de todos los campos.');
      return;
    }
    if (this.products().some((product) => !product.name.trim())) {
      this.productError.set('Completa el nombre de detalle de todos los productos.');
      return;
    }
    if (this.products().some((product) => !product.price.trim())) {
      this.productError.set('Completa el precio de todos los productos.');
      return;
    }
    if (this.deliveryScheduleOptions().some((option) => !option.trim())) {
      this.scheduleOptionsError.set('Completa todas las opciones de horario.');
      return;
    }
    if (!this.campaignId) {
      this.loadError.set('No se encontró la campaña asociada.');
      return;
    }
    const assignments: CampaignProductAssignment[] = this.products().map((product, index) => ({
      product_id: product.productId,
      price: product.price.trim() ? Number(product.price) : null,
      is_available: product.isAvailable,
      sort_order: index,
      max_quantity: product.maxQuantity.trim() ? Number(product.maxQuantity) : null,
    }));
    if (assignments.some((product) => product.price !== null && !Number.isFinite(product.price))) {
      this.productError.set('Los precios deben ser valores numéricos.');
      return;
    }
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
    this.saveForm(assignments);
  }

  private saveForm(assignments: CampaignProductAssignment[]): void {
    const templateId = this.selectedTemplateId();
    const branchId = this.selectedBranchId();
    if (!templateId || !branchId || !this.title().trim() || !this.campaignId) {
      this.loadError.set('Completa la sucursal, plantilla y título del formulario.');
      return;
    }
    const fields: CampaignFormFieldPayload[] = this.dynamicFields()
      .filter((field) => field.fieldId)
      .map((field, index) => ({
        field_id: field.fieldId!,
        is_enabled: field.enabled,
        is_required: field.required,
        label: field.label.trim() || null,
        config: field.options?.length ? { options: field.options.filter(Boolean) } : undefined,
        sort_order: index,
      }));
    this.isSaving.set(true);
    const request = this.currentForm()
      ? this.formsService.update(this.currentForm()!.id, {
          title: this.title().trim(),
          description: this.description().trim(),
          fields,
        })
      : this.formsService.create({
          campaign_id: this.campaignId,
          branch_id: branchId,
          template_id: templateId,
          title: this.title().trim(),
          description: this.description().trim(),
          fields,
        });
    request
      .pipe(
        switchMap((form) =>
          this.catalogService
            .assignCampaignProducts(this.campaignId!, assignments)
            .pipe(map(() => form)),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (form) => {
          this.currentForm.set(form);
          this.formStatus.set(form.status);
          this.saved.emit();
        },
        error: () => this.loadError.set('No se pudo guardar el formulario y sus productos.'),
      });
  }

  addProduct(): void {
    const selected = new Set(this.products().map((product) => product.productId));
    const product = this.availableProducts().find((item) => !selected.has(item.id));
    if (!product) {
      this.productError.set('No hay más productos disponibles para agregar.');
      return;
    }
    this.products.update((items) => [...items, this.toDraft(product, items.length)]);
    this.productError.set(null);
  }

  removeProduct(index: number): void {
    this.products.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  updateProduct(index: number, key: 'price' | 'maxQuantity', value: string): void {
    this.products.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  setProductAvailability(index: number, isAvailable: boolean): void {
    this.products.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, isAvailable } : item)),
    );
  }

  selectProduct(id: string): void {
    this.selectedProductId.set(id);
  }

  addScheduleOption(): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) => [...options, '']);
  }

  updateScheduleOption(index: number, value: string): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) =>
      options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    );
  }

  removeScheduleOption(index: number): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) =>
      options.filter((_, optionIndex) => optionIndex !== index),
    );
  }

  addField(): void {
    this.dynamicFields.update((fields) => [...fields, this.createEmptyField()]);
  }

  removeField(index: number): void {
    this.dynamicFields.update((fields) => fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  updateField(
    index: number,
    key: 'label' | 'type' | 'required' | 'enabled',
    value: string | boolean,
  ): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, fieldIndex) => {
        if (fieldIndex !== index) {
          return field;
        }
        if (key === 'type' && value === 'select') {
          return { ...field, type: value, options: field.options?.length ? field.options : [''] };
        }
        if (key === 'type' && value !== 'select') {
          return { ...field, type: String(value), options: undefined };
        }
        return { ...field, [key]: value };
      }),
    );
  }

  addOption(fieldIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) =>
        index === fieldIndex ? { ...field, options: [...(field.options ?? ['']), ''] } : field,
      ),
    );
  }

  removeOption(fieldIndex: number, optionIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }
        const options = (field.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex);
        return { ...field, options: options.length ? options : [''] };
      }),
    );
  }

  updateOption(fieldIndex: number, optionIndex: number, value: string): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }
        return {
          ...field,
          options: (field.options ?? []).map((option, itemIndex) =>
            itemIndex === optionIndex ? value : option,
          ),
        };
      }),
    );
  }

  formatOptions(options?: string[]): string {
    const values = (options ?? []).map((option) => option.trim()).filter(Boolean);
    return values.length ? values.join(', ') : '-';
  }

  private createEmptyField(): DynamicFieldDraft {
    return {
      id: this.createId('field'),
      label: '',
      type: 'text',
      required: false,
      enabled: true,
      sortOrder: 0,
    };
  }

  private loadProducts(): void {
    this.reset();
    if (!this.campaignId) {
      return;
    }
    this.isLoading.set(true);
    forkJoin({
      available: this.catalogService.listProducts(),
      assignedAvailable: this.catalogService.listCampaignProducts(this.campaignId, true),
      assignedUnavailable: this.catalogService.listCampaignProducts(this.campaignId, false),
      templates: this.formsService.templates(),
      forms: this.formsService.list(this.campaignId),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ available, assignedAvailable, assignedUnavailable, templates, forms }) => {
          this.availableProducts.set(available);
          const assigned = [...assignedAvailable, ...assignedUnavailable].filter(
            (product, index, items) => items.findIndex((item) => item.id === product.id) === index,
          );
          this.products.set(assigned.map((product, index) => this.toDraft(product, index)));
          this.templates.set(templates);
          const form = forms[0];
          if (form) {
            this.currentForm.set(form);
            this.title.set(form.title);
            this.description.set(form.description ?? '');
            this.selectedBranchId.set(form.branchId);
            this.selectedTemplateId.set(form.templateId);
            this.formStatus.set(form.status);
            this.dynamicFields.set(form.fields.map((field) => this.toFieldDraft(field)));
          } else {
            const template = templates[0];
            this.selectedTemplateId.set(template?.id ?? null);
            this.dynamicFields.set(
              (template?.fields ?? []).map((field) => this.toFieldDraft(field)),
            );
          }
        },
        error: () => this.loadError.set('No se pudieron cargar los productos de la campaña.'),
      });
  }

  private toDraft(product: CatalogProduct, index: number): ProductDraft {
    return {
      id: this.createId('product'),
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

  private toFieldDraft(field: FormFieldConfig): DynamicFieldDraft {
    return {
      id: this.createId('field'),
      fieldId: field.id,
      key: field.key,
      label: field.formConfig?.label ?? field.label,
      type: field.type,
      required: field.formConfig?.isRequired ?? false,
      enabled: field.formConfig?.isEnabled ?? true,
      sortOrder: field.formConfig?.sortOrder ?? field.sortOrder,
      options: Array.isArray(field.formConfig?.config?.['options'])
        ? (field.formConfig?.config?.['options'] as string[])
        : undefined,
    };
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
