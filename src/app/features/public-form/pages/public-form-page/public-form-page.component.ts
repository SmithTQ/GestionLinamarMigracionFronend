import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PublicFormFieldComponent } from '@features/public-form/components/public-form-field/public-form-field.component';
import { LocationValue } from '@shared/components/location-picker/location-picker.component';
import {
  PublicCampaignForm,
  PublicCampaignFormService,
  PublicFormField,
} from '@features/public-form/services/public-campaign-form.service';

interface PublicFormStep {
  id: string;
  title: string;
  description: string;
  fields: PublicFormField[];
}

@Component({
  selector: 'app-public-form-page',
  standalone: true,
  imports: [ButtonComponent, LoadingComponent, PublicFormFieldComponent],
  templateUrl: './public-form-page.component.html',
  styleUrl: './public-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicFormPageComponent implements OnDestroy {
  private static readonly maxFileSizeBytes = 10 * 1024 * 1024;
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly service = inject(PublicCampaignFormService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = signal<PublicCampaignForm | null>(null);
  readonly values = signal<Record<string, string>>({});
  readonly files = signal<Record<string, File | null>>({});
  readonly filePreviews = signal<Record<string, string>>({});
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly success = signal<number | null>(null);
  readonly currentStep = signal(0);
  readonly publicKey = this.route.snapshot.paramMap.get('publicKey') ?? '';
  readonly isInvitation = this.route.snapshot.data['invitation'] === true;
  readonly formSteps = computed(() => this.buildFormSteps(this.form()?.fields ?? []));
  readonly currentStepFields = computed(() => this.formSteps()[this.currentStep()]?.fields ?? []);

  constructor() {
    this.load();
  }

  setValue(key: string, value: string): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  setLocation(location: LocationValue): void {
    this.values.update((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }

  value(key: string): string {
    return this.values()[key] ?? '';
  }

  fieldOptions(field: PublicFormField): string[] {
    const options = field.config?.['options'];
    return Array.isArray(options)
      ? options.filter((option): option is string => typeof option === 'string')
      : [];
  }

  fieldFileAccept(field: PublicFormField): string {
    const accept = field.config?.['accept'];
    if (Array.isArray(accept)) {
      const configured = accept
        .filter((item): item is string => typeof item === 'string')
        .join(',');
      return configured || 'image/jpeg,image/png,image/webp';
    }
    return typeof accept === 'string' ? accept : 'image/jpeg,image/png,image/webp';
  }

  filePreview(field: PublicFormField): string {
    return this.filePreviews()[field.key] ?? '';
  }

  setFile(field: PublicFormField, file: File | null): void {
    this.fileError.set(null);
    if (!file) {
      const previousPreview = this.filePreviews()[field.key];
      if (previousPreview) URL.revokeObjectURL(previousPreview);
      this.files.update((current) => ({ ...current, [field.key]: null }));
      this.filePreviews.update((current) => {
        const next = { ...current };
        delete next[field.key];
        return next;
      });
      return;
    }
    if (!this.isAcceptedFile(field, file)) return;
    const previousPreview = this.filePreviews()[field.key];
    if (previousPreview) URL.revokeObjectURL(previousPreview);
    const preview = URL.createObjectURL(file);
    this.files.update((current) => ({ ...current, [field.key]: file }));
    this.filePreviews.update((current) => ({ ...current, [field.key]: preview }));
  }

  private isAcceptedFile(field: PublicFormField, file: File): boolean {
    if (file.size > PublicFormPageComponent.maxFileSizeBytes) {
      this.fileError.set('El archivo no puede superar los 10 MB.');
      return false;
    }

    const acceptedTypes = this.fieldFileAccept(field)
      .split(',')
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);
    const accepted = acceptedTypes.some((type) => {
      if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1));
      if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
      return type === file.type;
    });
    if (!accepted) {
      this.fileError.set('El tipo de archivo seleccionado no es válido.');
      return false;
    }
    return true;
  }

  fieldValueKey(field: PublicFormField): string {
    if (field.key === 'product') return 'product_sku';
    if (field.key === 'district') return 'district_code';
    return field.key;
  }

  isProductField(field: PublicFormField): boolean {
    return field.key === 'product' || field.type === 'product';
  }

  isDistrictField(field: PublicFormField): boolean {
    return field.key === 'district' || field.type === 'district';
  }

  submit(): void {
    const currentForm = this.form();
    if (!currentForm || this.isSubmitting()) return;
    this.error.set(null);
    if (!this.validateRequiredFields(currentForm)) return;
    this.isSubmitting.set(true);
    const payload = this.buildSubmissionPayload();
    const request = this.isInvitation
      ? this.service.submitInvitation(this.publicKey, payload)
      : this.service.submit(this.publicKey, payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (result) => this.success.set(result.order_id),
        error: () => this.error.set('No se pudo registrar el pedido. Intenta nuevamente.'),
      });
  }

  private load(): void {
    if (!this.publicKey) {
      this.isLoading.set(false);
      this.error.set('El enlace del formulario no es válido.');
      return;
    }
    const request = this.isInvitation
      ? this.service.getInvitation(this.publicKey)
      : this.service.get(this.publicKey);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (form) => {
          this.form.set(form);
          this.currentStep.set(0);
          const prefill = form.prefill;
          if (this.isInvitation && prefill) {
            this.values.update((current) => ({
              ...current,
              ...Object.fromEntries(
                Object.entries(prefill).filter(
                  (entry): entry is [string, string] => typeof entry[1] === 'string',
                ),
              ),
            }));
          }
        },
        error: () => this.error.set('El formulario no está disponible o ya fue cerrado.'),
      });
  }

  private validateRequiredFields(form: PublicCampaignForm): boolean {
    const missingField = this.findFirstMissingField(form.fields);
    if (missingField) {
      this.error.set('Completa todos los campos obligatorios antes de enviar.');
      this.focusField(missingField);
      return false;
    }
    return true;
  }

  nextStep(): void {
    const steps = this.formSteps();
    const missingField = this.findFirstMissingField(this.currentStepFields());
    if (missingField) {
      this.error.set('Completa los campos obligatorios de este paso para continuar.');
      this.focusField(missingField);
      return;
    }
    this.error.set(null);
    if (this.currentStep() < steps.length - 1) {
      this.currentStep.update((step) => step + 1);
    }
  }

  previousStep(): void {
    this.error.set(null);
    this.currentStep.update((step) => Math.max(step - 1, 0));
  }

  goToStep(step: number): void {
    if (step <= this.currentStep()) {
      this.error.set(null);
      this.currentStep.set(step);
    }
  }

  private findFirstMissingField(fields: PublicFormField[]): PublicFormField | null {
    return (
      fields.find((field) => {
        if (!field.required) return false;
        if (field.type === 'map' || field.key === 'location') {
          return !this.value('latitude').trim() || !this.value('longitude').trim();
        }
        if (field.type === 'file') return !this.files()[field.key];
        return !this.value(this.fieldValueKey(field)).trim();
      }) ?? null
    );
  }

  private focusField(field: PublicFormField): void {
    requestAnimationFrame(() => {
      const targetId = this.isProductField(field)
        ? `${this.fieldInputId(field)}-options`
        : this.fieldInputId(field);
      const container = this.document.getElementById(targetId);
      const target = container?.matches('input, select, textarea, button')
        ? container
        : (container?.querySelector<HTMLElement>('input, select, textarea, button') ?? container);
      if (!target) {
        this.focusValidationSummary();
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
    });
  }

  private fieldInputId(field: PublicFormField): string {
    return `public-form-field-${field.key}`;
  }

  private focusValidationSummary(): void {
    const summary = this.document.getElementById('public-form-validation-summary');
    summary?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    summary?.focus({ preventScroll: true });
  }

  private buildFormSteps(fields: PublicFormField[]): PublicFormStep[] {
    const order: Pick<PublicFormStep, 'id' | 'title' | 'description'>[] = [
      {
        id: 'order',
        title: 'Pedido y entrega',
        description: 'Selecciona el producto y define dónde se realizará la entrega.',
      },
      {
        id: 'contact',
        title: 'Datos de contacto',
        description: 'Indica la información necesaria para coordinar tu pedido.',
      },
      {
        id: 'additional',
        title: 'Detalles adicionales',
        description: 'Añade información complementaria para personalizar tu pedido.',
      },
    ];
    const groups = order.map((step) => ({ ...step, fields: [] as PublicFormField[] }));

    fields.forEach((field) => {
      const group = this.fieldStep(field);
      groups[group].fields.push(field);
    });

    return groups.filter((step) => step.fields.length > 0);
  }

  private fieldStep(field: PublicFormField): number {
    if (
      this.isProductField(field) ||
      this.isDistrictField(field) ||
      field.type === 'map' ||
      field.key === 'delivery_reference'
    ) {
      return 0;
    }
    if (field.field_group === 'custom' || field.field_group === 'optional_base') return 2;
    return 1;
  }

  private buildSubmissionPayload(): FormData {
    const payload = new FormData();
    payload.append('submission_key', this.createSubmissionKey());
    Object.entries(this.values())
      .filter(([, value]) => value.trim().length > 0)
      .forEach(([key, value]) => payload.append(key, this.normalizeSubmissionValue(key, value)));
    Object.entries(this.files()).forEach(([key, file]) => {
      if (file) payload.append(key, file, file.name);
    });
    return payload;
  }

  private normalizeSubmissionValue(key: string, value: string): string {
    if (key !== 'delivery_date') {
      return value;
    }

    const normalized = value.trim();
    const dayFirstMatch = normalized.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (dayFirstMatch) {
      return `${dayFirstMatch[3]}-${dayFirstMatch[2]}-${dayFirstMatch[1]}`;
    }

    return normalized.split('T')[0];
  }

  private createSubmissionKey(): string {
    return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  ngOnDestroy(): void {
    Object.values(this.filePreviews()).forEach((preview) => URL.revokeObjectURL(preview));
  }
}
