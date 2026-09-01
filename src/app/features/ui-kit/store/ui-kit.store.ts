import { Injectable, inject, signal } from '@angular/core';
import { UiKitService } from '../services/ui-kit.service';

@Injectable({ providedIn: 'root' })
export class UiKitStore {
  private readonly uiKitService = inject(UiKitService);

  private readonly rowsSignal = signal(this.uiKitService.getTableRows());
  readonly rows = this.rowsSignal.asReadonly();

  readonly isModalOpen = signal(false);

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }
}
