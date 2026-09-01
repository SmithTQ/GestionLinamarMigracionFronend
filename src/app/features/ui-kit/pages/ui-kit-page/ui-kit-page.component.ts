import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageContainerComponent } from '@layout/components/page-container/page-container.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { TableColumn, TableComponent } from '@shared/components/table/table.component';
import { CardComponent } from '@shared/components/card/card.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { UiKitStore } from '@features/ui-kit/store/ui-kit.store';

@Component({
  selector: 'app-ui-kit-page',
  standalone: true,
  imports: [
    PageContainerComponent,
    ButtonComponent,
    InputComponent,
    TableComponent,
    CardComponent,
    ModalComponent,
    LoadingComponent,
  ],
  templateUrl: './ui-kit-page.component.html',
  styleUrls: ['./ui-kit-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiKitPageComponent {
  private readonly uiKitStore = inject(UiKitStore);

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'Codigo', sortable: true, filterable: true },
    { key: 'name', label: 'Componente', sortable: true, filterable: true },
    { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'badge' },
    { key: 'owner', label: 'Responsable', sortable: true, filterable: true },
    { key: 'updated', label: 'Actualizado', sortable: true, filterable: true },
  ];

  readonly rows = this.uiKitStore.rows;
  readonly isModalOpen = this.uiKitStore.isModalOpen;

  openModal(): void {
    this.uiKitStore.openModal();
  }

  closeModal(): void {
    this.uiKitStore.closeModal();
  }
}
