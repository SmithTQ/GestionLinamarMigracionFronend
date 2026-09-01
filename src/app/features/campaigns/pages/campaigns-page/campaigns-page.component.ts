import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { NgClass } from '@angular/common';
import {
  TableColumn,
  TableComponent,
  TablePagination,
  TableAction,
} from '@shared/components/table/table.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CampaignsStore } from '@features/campaigns/store/campaigns.store';
import { InputComponent } from '@shared/components/input/input.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { Campaign } from '@features/campaigns/models/campaign.model';

@Component({
  selector: 'app-campaigns-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    TableComponent,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    NgClass,
  ],
  templateUrl: './campaigns-page.component.html',
  styleUrls: ['./campaigns-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  private readonly campaignsStore = inject(CampaignsStore);

  readonly isModalOpen = signal(false);
  readonly isConfirmationOpen = signal(false);
  readonly isFormBuilderOpen = signal(false);
  readonly lastCreatedCampaignId = signal<string | null>(null);

  readonly name = signal('');
  readonly budget = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly status = signal<Campaign['status']>('active');
  readonly nameError = signal<string | undefined>(undefined);

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

  readonly products = signal<
    Array<{ id: string; name: string; image: string; price: string; fileName?: string }>
  >([
    { id: 'prod-1', name: 'Caja mediana', image: '', price: '25.00' },
    { id: 'prod-2', name: 'Sobre express', image: '', price: '12.00' },
  ]);
  readonly selectedProductId = signal<string | null>(null);
  readonly productError = signal<string | null>(null);
  readonly deliveryScheduleOptions = signal<string[]>(['09:00 - 13:00', '13:00 - 18:00']);
  readonly scheduleOptionsError = signal<string | null>(null);

  readonly dynamicFields = signal<
    Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>
  >([]);
  readonly fieldLabelError = signal<string | null>(null);

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'Cod.', sortable: true, filterable: true },
    { key: 'name', label: 'Campana', sortable: true, filterable: true },
    { key: 'budget', label: 'Presup.', sortable: true, filterable: true, align: 'right' },
    { key: 'startDate', label: 'Inicio', sortable: true, filterable: true },
    { key: 'endDate', label: 'Fin', sortable: true, filterable: true },
    { key: 'ordersCount', label: 'Pedidos', sortable: true, filterable: true, align: 'right' },
    {
      key: 'deliveredCount',
      label: 'Entregados',
      sortable: true,
      filterable: true,
      align: 'right',
    },
    {
      key: 'totalObtained',
      label: 'Total (S/)',
      sortable: true,
      filterable: true,
      align: 'right',
    },
    { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'badge' },
  ];

  readonly campaigns = this.campaignsStore.campaigns;
  readonly rows = computed(() =>
    this.campaigns().map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      budget: `S/ ${campaign.budget.toFixed(2)}`,
      startDate: campaign.startDate,
      endDate: campaign.endDate ?? '-',
      ordersCount: campaign.ordersCount.toLocaleString('es-PE'),
      deliveredCount: campaign.deliveredCount.toLocaleString('es-PE'),
      totalObtained: `S/ ${campaign.totalObtained.toFixed(2)}`,
      status: this.formatStatus(campaign.status),
    })),
  );

  readonly pagination: TablePagination = {
    page: 1,
    pageSize: 10,
    total: 24,
    pageSizeOptions: [10, 25, 50],
  };

  readonly actions: TableAction[] = [
    { id: 'view', label: 'Ver', variant: 'ghost', icon: 'eye' },
    { id: 'edit', label: 'Editar', variant: 'ghost', icon: 'file-pen-line' },
    { id: 'pause', label: 'Pausar', variant: 'outline', icon: 'circle-pause' },
  ];

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.resetErrors();
  }

  createCampaign(): void {
    this.resetErrors();
    const name = this.name().trim();

    if (!name) {
      this.nameError.set('Ingresa un nombre de campana.');
    }
    if (this.nameError()) {
      return;
    }

    const budgetValue = Number(this.budget().toString().replace(',', '.'));
    const campaignId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const campaign: Campaign = {
      id: campaignId,
      name,
      status: this.status(),
      budget: Number.isFinite(budgetValue) ? budgetValue : 0,
      startDate: this.startDate() || new Date().toISOString().slice(0, 10),
      endDate: this.endDate() || undefined,
      ordersCount: 0,
      deliveredCount: 0,
      totalObtained: 0,
    };

    this.campaignsStore.add(campaign);
    this.resetForm();
    this.closeModal();
    this.lastCreatedCampaignId.set(campaignId);
    this.isConfirmationOpen.set(true);
  }

  closeConfirmation(): void {
    this.isConfirmationOpen.set(false);
  }

  openFormBuilder(): void {
    this.isConfirmationOpen.set(false);
    if (this.dynamicFields().length === 0) {
      this.dynamicFields.set([this.createEmptyField()]);
    }
    this.isFormBuilderOpen.set(true);
  }

  closeFormBuilder(): void {
    this.isFormBuilderOpen.set(false);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
  }

  addField(): void {
    this.dynamicFields.update((fields) => [...fields, this.createEmptyField()]);
  }

  removeField(index: number): void {
    this.dynamicFields.update((fields) => fields.filter((_, i) => i !== index));
  }

  updateField(index: number, key: 'label' | 'type' | 'required', value: string | boolean): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, i) => {
        if (i !== index) {
          return field;
        }
        if (key === 'type' && value === 'select') {
          return { ...field, type: value, options: field.options?.length ? field.options : [''] };
        }
        if (key === 'type' && value !== 'select') {
          const { options, ...rest } = field;
          return { ...rest, type: String(value) };
        }
        return { ...field, [key]: value };
      }),
    );
  }

  saveFormDefinition(): void {
    const hasEmpty = this.dynamicFields().some((field) => !field.label.trim());
    if (hasEmpty) {
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
    this.productError.set(null);
    this.fieldLabelError.set(null);
    this.scheduleOptionsError.set(null);
    this.closeFormBuilder();
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'completed':
        return 'Finalizada';
      default:
        return 'Borrador';
    }
  }

  private resetForm(): void {
    this.name.set('');
    this.budget.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.status.set('active');
  }

  private resetErrors(): void {
    this.nameError.set(undefined);
  }

  private createEmptyField(): {
    id: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  } {
    return {
      id: `field-${Math.random().toString(16).slice(2, 8)}`,
      label: '',
      type: 'text',
      required: false,
    };
  }

  addOption(fieldIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, i) =>
        i === fieldIndex ? { ...field, options: [...(field.options ?? ['']), ''] } : field,
      ),
    );
  }

  removeOption(fieldIndex: number, optionIndex: number): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, i) => {
        if (i !== fieldIndex) {
          return field;
        }
        const options = (field.options ?? []).filter((_, idx) => idx !== optionIndex);
        return { ...field, options: options.length ? options : [''] };
      }),
    );
  }

  updateOption(fieldIndex: number, optionIndex: number, value: string): void {
    this.dynamicFields.update((fields) =>
      fields.map((field, i) => {
        if (i !== fieldIndex) {
          return field;
        }
        const options = (field.options ?? []).map((option, idx) =>
          idx === optionIndex ? value : option,
        );
        return { ...field, options };
      }),
    );
  }

  formatOptions(options?: string[]): string {
    if (!options || options.length === 0) {
      return '-';
    }
    const cleaned = options.map((option) => option.trim()).filter((option) => option.length > 0);
    return cleaned.length ? cleaned.join(', ') : '-';
  }

  addProduct(): void {
    this.products.update((items) => [
      ...items,
      {
        id: `prod-${Math.random().toString(16).slice(2, 8)}`,
        name: '',
        image: '',
        price: '',
      },
    ]);
  }

  removeProduct(index: number): void {
    this.products.update((items) => items.filter((_, i) => i !== index));
  }

  updateProduct(index: number, key: 'name' | 'image' | 'price' | 'fileName', value: string): void {
    this.products.update((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }

  onProductFileChange(index: number, files: FileList | null): void {
    const file = files && files.length ? files[0] : null;
    if (!file) {
      this.updateProduct(index, 'image', '');
      this.updateProduct(index, 'fileName', '');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.updateProduct(index, 'image', String(reader.result || ''));
      this.updateProduct(index, 'fileName', file.name);
    };
    reader.readAsDataURL(file);
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
      options.map((option, i) => (i === index ? value : option)),
    );
  }

  removeScheduleOption(index: number): void {
    this.scheduleOptionsError.set(null);
    this.deliveryScheduleOptions.update((options) => options.filter((_, i) => i !== index));
  }
}
