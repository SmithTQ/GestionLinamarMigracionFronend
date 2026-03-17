import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import {
  TableAction,
  TableColumn,
  TableComponent,
  TablePagination,
} from '@shared/components/table/table.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [PageContainerComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {
  readonly isModalOpen = signal(false);

  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Codigo', sortable: true, filterable: true },
    { key: 'customer', label: 'Cliente', sortable: true, filterable: true },
    { key: 'district', label: 'Distrito', sortable: true, filterable: true },
    { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'badge' },
    { key: 'total', label: 'Total', sortable: true, filterable: true, align: 'right' },
    { key: 'date', label: 'Fecha', sortable: true, filterable: true },
  ];

  readonly actions: TableAction[] = [
    { id: 'view', label: 'Ver', variant: 'ghost' },
    { id: 'edit', label: 'Editar', variant: 'ghost' },
    { id: 'assign', label: 'Asignar', variant: 'outline' },
  ];

  readonly rows = [
    {
      code: 'ORD-12844',
      customer: 'Lucia Reyes',
      district: 'Miraflores',
      status: 'En ruta',
      total: 'S/ 520.00',
      date: '2026-03-17',
    },
    {
      code: 'ORD-12831',
      customer: 'Juan Pacheco',
      district: 'San Borja',
      status: 'Pendiente',
      total: 'S/ 260.00',
      date: '2026-03-16',
    },
    {
      code: 'ORD-12818',
      customer: 'Erika Flores',
      district: 'Surco',
      status: 'Entregado',
      total: 'S/ 410.00',
      date: '2026-03-16',
    },
    {
      code: 'ORD-12795',
      customer: 'Paola Campos',
      district: 'La Molina',
      status: 'Incidencia',
      total: 'S/ 690.00',
      date: '2026-03-15',
    },
  ];

  readonly pagination: TablePagination = {
    page: 1,
    pageSize: 10,
    total: 128,
    pageSizeOptions: [10, 25, 50],
  };

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }
}
