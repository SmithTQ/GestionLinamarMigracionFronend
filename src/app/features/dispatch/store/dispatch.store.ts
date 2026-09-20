import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { DeliveryRoutePage } from '../models/delivery-route.model';
import { DispatchService } from '../services/dispatch.service';
import { SessionDataStateService } from '@core/services/session-data-state.service';

@Injectable({ providedIn: 'root' })
export class DispatchStore {
  private readonly service = inject(DispatchService);
  private readonly sessionDataState = inject(SessionDataStateService);
  private requestId = 0;
  readonly page = signal<DeliveryRoutePage>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.sessionDataState.register(() => this.reset());
  }

  load(page = 1, pageSize = this.page().pageSize): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list(page, pageSize)
      .pipe(finalize(() => requestId === this.requestId && this.loading.set(false)))
      .subscribe({
        next: (result) => {
          if (requestId === this.requestId) this.page.set(result);
        },
        error: (error) => {
          if (requestId === this.requestId) this.error.set(readError(error));
        },
      });
  }

  reset(): void {
    this.requestId += 1;
    this.page.set(createEmptyPage());
    this.loading.set(false);
    this.error.set(null);
  }
}

function readError(error: unknown): string {
  const candidate = error as { error?: { mensaje?: string } };
  return candidate?.error?.mensaje ?? 'No se pudieron cargar las rutas.';
}

function createEmptyPage(): DeliveryRoutePage {
  return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 };
}
