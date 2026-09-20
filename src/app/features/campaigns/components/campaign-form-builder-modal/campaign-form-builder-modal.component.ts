import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  CustomFormFieldModalComponent,
  CustomFormFieldValue,
} from '@features/campaigns/components/custom-form-field-modal/custom-form-field-modal.component';
import {
  CampaignFormPreviewComponent,
  FormPreviewField,
  FormPreviewProduct,
} from '@features/campaigns/components/campaign-form-preview/campaign-form-preview.component';
import { CampaignProductsSectionComponent } from '@features/campaigns/components/campaign-products-section/campaign-products-section.component';
import { CampaignAdditionalFieldsSectionComponent } from '@features/campaigns/components/campaign-additional-fields-section/campaign-additional-fields-section.component';
import { PublishCampaignConfirmationModalComponent } from '@features/campaigns/components/publish-campaign-confirmation-modal/publish-campaign-confirmation-modal.component';
import {
  ProductFormModalComponent,
  ProductFormValue,
} from '@features/products/components/product-form-modal/product-form-modal.component';
import { ProductCategory } from '@features/products/models/product.model';
import {
  CampaignProductAssignment,
  CatalogProduct,
} from '@features/campaigns/services/campaign-catalog.service';
import {
  CampaignForm,
  CampaignConfigurationPayload,
  FormFieldConfig,
  FormFieldType,
  FormTemplate,
} from '@features/campaigns/services/campaign-forms.service';
import { Campaign } from '@features/campaigns/models/campaign.model';
import { CampaignFormBuilderFacade } from './campaign-form-builder.facade';
import { BranchContextStore } from '@features/branches/store/branch-context.store';
import {
  DynamicFieldDraft,
  ProductDraft,
  appendFieldToTemplate,
  buildCustomFieldPayload,
  mergeTemplateFields,
  selectForm,
  toFieldDraft,
  toProductDraft,
  toFormFieldPayloads,
  toProductAssignments,
  validateFieldGroup,
  validateFieldLabels,
  validateMandatoryFields,
  validateProductDrafts,
} from './campaign-form-builder.utils';
import {
  appendSelectedProducts,
  appendCreatedProduct,
  reorderFields,
  selectedProductIds,
  updateProductAvailability,
  updateProductDraft,
} from './campaign-form-builder.state';

@Component({
  selector: 'app-campaign-form-builder-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    LoadingComponent,
    ModalComponent,
    ProductFormModalComponent,
    CustomFormFieldModalComponent,
    CampaignFormPreviewComponent,
    CampaignProductsSectionComponent,
    CampaignAdditionalFieldsSectionComponent,
    PublishCampaignConfirmationModalComponent,
  ],
  templateUrl: './campaign-form-builder-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignFormBuilderModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() campaignId: number | null = null;
  @Input() campaign: Campaign | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() published = new EventEmitter<void>();
  @Output() campaignOpenRequested = new EventEmitter<number>();

  private readonly facade = inject(CampaignFormBuilderFacade);
  private readonly branchContext = inject(BranchContextStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly products = signal<ProductDraft[]>([]);
  readonly availableProducts = signal<CatalogProduct[]>([]);
  readonly selectedAvailableProductIds = signal<number[]>([]);
  readonly productPickerOpen = signal(false);
  readonly productCategories = signal<ProductCategory[]>([]);
  readonly productModalOpen = signal(false);
  readonly isCreatingProduct = signal(false);
  readonly productCreateError = signal<string | null>(null);
  readonly customFieldOpen = signal(false);
  readonly customFieldSaving = signal(false);
  readonly customFieldError = signal<string | null>(null);
  readonly publishConfirmationOpen = signal(false);
  readonly draggedFieldId = signal<string | null>(null);
  readonly dynamicFields = signal<DynamicFieldDraft[]>([]);
  readonly productError = signal<string | null>(null);
  readonly fieldLabelError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly formsLoadFailed = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly title = signal('Formulario de pedidos');
  readonly description = signal('Completa tus datos para registrar tu pedido.');
  readonly templates = signal<FormTemplate[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedTemplateId = signal<number | null>(null);
  readonly currentForm = signal<CampaignForm | null>(null);
  readonly formStatus = signal<CampaignForm['status']>('draft');
  readonly isReadOnly = computed(() => this.formStatus() !== 'draft');
  readonly activeStep = signal(0);
  readonly stepLabels = [
    'Información general',
    'Campos obligatorios',
    'Productos',
    'Base opcional',
    'Personalizados',
    'Revisión',
  ];
  readonly mandatoryFields = computed(() =>
    this.dynamicFields().filter((field) => field.fieldGroup === 'required_base'),
  );
  readonly additionalFields = computed(() =>
    this.dynamicFields().filter((field) => field.fieldGroup !== 'required_base'),
  );
  readonly previewProducts = computed<readonly FormPreviewProduct[]>(() => this.products());
  readonly previewMandatoryFields = computed<readonly FormPreviewField[]>(() =>
    this.mandatoryFields(),
  );
  readonly previewAdditionalFields = computed<readonly FormPreviewField[]>(() =>
    this.additionalFields(),
  );
  readonly availableAdditionalFields = computed(() => {
    const activeFieldIds = new Set(
      this.dynamicFields()
        .map((field) => field.fieldId)
        .filter((fieldId): fieldId is number => fieldId !== undefined),
    );
    const template = this.templates().find((item) => item.id === this.selectedTemplateId());
    return (template?.fields ?? []).filter(
      (field) =>
        field.isActive && field.fieldGroup !== 'required_base' && !activeFieldIds.has(field.id),
    );
  });
  private loadSubscription?: Subscription;
  readonly selectableProducts = computed(() => {
    const selected = new Set(this.products().map((product) => product.productId));
    return this.availableProducts().filter((product) => !selected.has(product.id));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.loadProductsFromFacade();
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
    if (this.campaign?.status !== 'open') {
      this.publishConfirmationOpen.set(true);
      return;
    }
    this.isSaving.set(true);
    this.facade
      .publish(form.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.currentForm.set(updated);
          this.formStatus.set(updated.status);
          this.published.emit();
        },
        error: () => this.loadError.set('No se pudo publicar el formulario.'),
      });
  }

  closePublishConfirmation(): void {
    if (!this.isSaving()) {
      this.publishConfirmationOpen.set(false);
    }
  }

  requestOpenCampaignAndPublish(): void {
    const form = this.currentForm();
    if (this.isSaving() || !form || !this.campaignId) return;
    this.publishConfirmationOpen.set(false);
    this.campaignOpenRequested.emit(form.id);
  }

  reset(): void {
    this.products.set([]);
    this.selectedAvailableProductIds.set([]);
    this.productPickerOpen.set(false);
    this.productModalOpen.set(false);
    this.customFieldOpen.set(false);
    this.customFieldSaving.set(false);
    this.customFieldError.set(null);
    this.productCreateError.set(null);
    this.dynamicFields.set([]);
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.loadError.set(null);
    this.formsLoadFailed.set(false);
    this.title.set('Formulario de pedidos');
    this.description.set('Completa tus datos para registrar tu pedido.');
    this.selectedBranchId.set(
      this.branchContext.activeBranchId() ?? this.campaign?.branch?.id ?? null,
    );
    this.selectedTemplateId.set(null);
    this.currentForm.set(null);
    this.formStatus.set('draft');
    this.activeStep.set(0);
  }

  nextStep(): void {
    if (this.activeStep() === 0 && !this.title().trim()) {
      this.loadError.set('Completa el título del formulario antes de continuar.');
      return;
    }
    if (this.activeStep() === 1) {
      const error = validateMandatoryFields(this.mandatoryFields());
      if (error) {
        this.loadError.set(error);
        return;
      }
    }
    if (this.activeStep() === 2) {
      const error = validateProductDrafts(this.products());
      if (error) {
        this.productError.set(error);
        return;
      }
      this.productError.set(null);
    }
    if (this.activeStep() === 3 || this.activeStep() === 4) {
      const group = this.activeStep() === 3 ? 'optional_base' : 'custom';
      const error = validateFieldGroup(this.dynamicFields(), group);
      if (error) {
        this.fieldLabelError.set(error);
        return;
      }
      this.fieldLabelError.set(null);
    }
    this.loadError.set(null);
    this.activeStep.update((step) => Math.min(step + 1, this.stepLabels.length - 1));
  }

  previousStep(): void {
    this.loadError.set(null);
    this.activeStep.update((step) => Math.max(step - 1, 0));
  }

  save(): void {
    if (this.isSaving() || this.isReadOnly()) {
      return;
    }
    const labelError = validateFieldLabels(this.dynamicFields());
    if (labelError) {
      this.fieldLabelError.set(labelError);
      this.activeStep.set(
        this.dynamicFields().some((field) => field.fieldGroup === 'custom') ? 4 : 3,
      );
      return;
    }
    const optionError =
      validateFieldGroup(this.dynamicFields(), 'optional_base') ??
      validateFieldGroup(this.dynamicFields(), 'custom');
    if (optionError) {
      this.fieldLabelError.set(optionError);
      const optionField = this.dynamicFields().find(
        (field) => field.type === 'select' || field.key === 'delivery_time',
      );
      this.activeStep.set(optionField?.fieldGroup === 'custom' ? 4 : 3);
      return;
    }
    const productError = validateProductDrafts(this.products());
    if (productError) {
      this.productError.set(productError);
      this.activeStep.set(2);
      return;
    }
    if (!this.campaignId) {
      this.activeStep.set(0);
      this.loadError.set('No se encontró la campaña asociada.');
      return;
    }
    const assignments: CampaignProductAssignment[] = toProductAssignments(this.products());
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.saveForm(assignments);
  }

  private saveForm(assignments: CampaignProductAssignment[]): void {
    const templateId = this.selectedTemplateId();
    const branchId = this.selectedBranchId();
    if (!templateId || !this.title().trim() || !this.campaignId) {
      this.activeStep.set(0);
      this.loadError.set('No se encontró una plantilla activa para guardar el formulario.');
      return;
    }
    const fields = toFormFieldPayloads(this.dynamicFields());
    this.isSaving.set(true);
    const payload: CampaignConfigurationPayload = {
      form: {
        ...(branchId ? { branch_id: branchId } : {}),
        template_id: templateId,
        title: this.title().trim(),
        description: this.description().trim(),
        fields,
      },
      products: assignments,
    };
    this.facade
      .configure(this.campaignId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: ({ form }) => {
          this.currentForm.set(form);
          this.formStatus.set(form.status);
          this.saved.emit();
        },
        error: () => this.loadError.set('No se pudo guardar la configuración del formulario.'),
      });
  }

  openProductPicker(): void {
    if (this.isReadOnly()) return;
    this.selectedAvailableProductIds.set([]);
    this.productPickerOpen.set(true);
    this.productError.set(null);
  }

  closeProductPicker(): void {
    this.productPickerOpen.set(false);
    this.selectedAvailableProductIds.set([]);
  }

  toggleAvailableProduct(productId: number, checked: boolean): void {
    if (this.isReadOnly()) return;
    this.selectedAvailableProductIds.update((ids) => {
      if (checked) {
        return ids.includes(productId) ? ids : [...ids, productId];
      }
      return ids.filter((id) => id !== productId);
    });
  }

  selectAllAvailableProducts(): void {
    if (this.isReadOnly()) return;
    this.selectedAvailableProductIds.set(
      selectedProductIds(this.products(), this.availableProducts()),
    );
  }

  addSelectedProducts(): void {
    if (this.isReadOnly()) return;
    const nextProducts = appendSelectedProducts(
      this.products(),
      this.availableProducts(),
      this.selectedAvailableProductIds(),
    );
    if (nextProducts.length === this.products().length) {
      this.productError.set('Selecciona al menos un producto para agregar.');
      return;
    }
    this.products.set(nextProducts);
    this.closeProductPicker();
    this.productError.set(null);
  }

  openProductCreation(): void {
    if (this.isReadOnly()) return;
    this.productCreateError.set(null);
    if (this.productCategories().length) {
      this.productModalOpen.set(true);
      return;
    }
    this.facade
      .loadProductCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.productCategories.set(categories);
          this.productModalOpen.set(true);
        },
        error: () => this.productCreateError.set('No se pudieron cargar las categorías.'),
      });
  }

  closeProductCreation(): void {
    if (!this.isCreatingProduct()) {
      this.productModalOpen.set(false);
    }
  }

  createProduct(value: ProductFormValue): void {
    if (this.isCreatingProduct()) {
      return;
    }
    this.isCreatingProduct.set(true);
    this.productCreateError.set(null);
    this.facade
      .createProduct(value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isCreatingProduct.set(false)),
      )
      .subscribe({
        next: (product) => {
          const result = appendCreatedProduct(this.products(), this.availableProducts(), product);
          this.availableProducts.set(result.availableProducts);
          this.products.set(result.products);
          this.productModalOpen.set(false);
        },
        error: () => this.productCreateError.set('No se pudo crear el producto.'),
      });
  }

  removeProduct(index: number): void {
    if (this.isReadOnly()) return;
    this.products.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  updateProduct(index: number, key: 'price' | 'maxQuantity', value: string): void {
    if (this.isReadOnly()) return;
    this.products.set(updateProductDraft(this.products(), index, key, value));
  }

  setProductAvailability(index: number, isAvailable: boolean): void {
    if (this.isReadOnly()) return;
    this.products.set(updateProductAvailability(this.products(), index, isAvailable));
  }

  removeField(fieldId: string): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) => fields.filter((field) => field.id !== fieldId));
  }

  addAdditionalField(field: FormFieldConfig): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) => [...fields, toFieldDraft(field)]);
  }

  openCustomFieldForm(): void {
    if (this.isReadOnly() || !this.selectedTemplateId()) return;
    this.customFieldError.set(null);
    this.customFieldOpen.set(true);
  }

  closeCustomFieldForm(): void {
    if (!this.customFieldSaving()) {
      this.customFieldOpen.set(false);
    }
  }

  createCustomField(value: CustomFormFieldValue): void {
    const templateId = this.selectedTemplateId();
    const template = this.templates().find((item) => item.id === templateId);
    const result = buildCustomFieldPayload(value, template);
    if (!templateId || !result.payload) {
      this.customFieldError.set(result.error ?? 'Selecciona una plantilla válida.');
      return;
    }
    this.customFieldSaving.set(true);
    this.customFieldError.set(null);
    this.facade
      .createTemplateField(templateId, result.payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.customFieldSaving.set(false)),
      )
      .subscribe({
        next: (field) => {
          this.templates.set(appendFieldToTemplate(this.templates(), templateId, field));
          this.addAdditionalField(field);
          this.customFieldOpen.set(false);
        },
        error: () => this.customFieldError.set('No se pudo registrar el campo personalizado.'),
      });
  }

  startFieldDrag(fieldId: string, event: DragEvent): void {
    if (this.isReadOnly()) return;
    this.draggedFieldId.set(fieldId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', fieldId);
    }
  }

  allowFieldDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropField(targetId: string, event: DragEvent): void {
    event.preventDefault();
    if (this.isReadOnly()) {
      this.clearFieldDrag();
      return;
    }
    const sourceId = this.draggedFieldId() ?? event.dataTransfer?.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      this.clearFieldDrag();
      return;
    }
    this.dynamicFields.set(reorderFields(this.dynamicFields(), sourceId, targetId));
    this.clearFieldDrag();
  }

  clearFieldDrag(): void {
    this.draggedFieldId.set(null);
  }

  updateField(
    fieldId: string,
    key: 'label' | 'type' | 'required' | 'enabled',
    value: string | boolean,
  ): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) =>
      fields.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }
        if (key === 'type' && value === 'select') {
          return {
            ...field,
            type: value as FormFieldType,
            options: field.options?.length ? field.options : [''],
          };
        }
        if (key === 'type' && value !== 'select') {
          return { ...field, type: value as FormFieldType, options: undefined };
        }
        return { ...field, [key]: value };
      }),
    );
  }

  addOption(fieldId: string): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) =>
      fields.map((field) =>
        field.id === fieldId ? { ...field, options: [...(field.options ?? ['']), ''] } : field,
      ),
    );
  }

  removeOption(fieldId: string, optionIndex: number): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) =>
      fields.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }
        const options = (field.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex);
        return { ...field, options: options.length ? options : [''] };
      }),
    );
  }

  updateOption(fieldId: string, optionIndex: number, value: string): void {
    if (this.isReadOnly()) return;
    this.dynamicFields.update((fields) =>
      fields.map((field) => {
        if (field.id !== fieldId) {
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

  private loadProductsFromFacade(): void {
    this.loadSubscription?.unsubscribe();
    this.reset();
    if (!this.campaignId) {
      return;
    }
    const branchId = this.selectedBranchId();
    if (!branchId) {
      this.loadError.set('Selecciona una sucursal activa antes de configurar el formulario.');
      return;
    }

    this.isLoading.set(true);
    this.loadSubscription = this.facade
      .load(this.campaignId, branchId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({
          availableProducts,
          assignedAvailableProducts,
          assignedUnavailableProducts,
          templates,
          forms,
          errors,
          formsLoadFailed,
          templatesLoadFailed,
        }) => {
          errors.forEach((error) =>
            this.loadError.update((current) => (current ? `${current} ${error}` : error)),
          );
          this.formsLoadFailed.set(formsLoadFailed);
          this.availableProducts.set(availableProducts);
          const assigned = [...assignedAvailableProducts, ...assignedUnavailableProducts].filter(
            (product, index, items) => items.findIndex((item) => item.id === product.id) === index,
          );
          this.products.set(assigned.map((product, index) => toProductDraft(product, index)));
          this.templates.set(templates);

          if (formsLoadFailed || templatesLoadFailed) {
            return;
          }

          const form = selectForm(forms);
          if (form) {
            this.currentForm.set(form);
            this.title.set(form.title);
            this.description.set(form.description ?? '');
            this.selectedBranchId.set(form.branchId);
            this.selectedTemplateId.set(form.templateId);
            this.formStatus.set(form.status);
            const template = templates.find((item) => item.id === form.templateId);
            this.dynamicFields.set(
              mergeTemplateFields(template?.fields ?? [], form.fields).map((field) =>
                toFieldDraft(field),
              ),
            );
          } else {
            const template = templates[0];
            this.selectedTemplateId.set(template?.id ?? null);
            this.dynamicFields.set(
              (template?.fields ?? [])
                .filter((field) => field.fieldGroup === 'required_base')
                .map((field) => toFieldDraft(field)),
            );
          }
        },
        error: () => this.loadError.set('No se pudo cargar la configuración del formulario.'),
      });
  }
}
