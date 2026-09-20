import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, tap } from 'rxjs';
import { Order, OrderPage, OrderStatus } from '../models/order.model';
import { OrderListQuery, OrderUpdatePayload, OrdersService } from '../services/orders.service';
import { SessionDataStateService } from '@core/services/session-data-state.service';

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly service = inject(OrdersService);
  private readonly sessionDataState = inject(SessionDataStateService);
  private readonly ordersSignal = signal<Order[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly paginationSignal = signal<OrderPage>({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  private requestId = 0;

  readonly orders = this.ordersSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();

  constructor() {
    this.sessionDataState.register(() => this.reset());
  }

  load(query: OrderListQuery = {}): void {
    const currentRequest = ++this.requestId;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.service
      .list(query)
      .pipe(
        tap((page) => {
          if (currentRequest !== this.requestId) return;
          this.paginationSignal.set(page);
          this.ordersSignal.set(page.items);
        }),
        catchError(() => {
          if (currentRequest === this.requestId) {
            this.errorSignal.set('No se pudieron cargar los pedidos.');
          }
          return EMPTY;
        }),
        finalize(() => {
          if (currentRequest === this.requestId) this.loadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  get(id: number): Observable<Order> {
    return this.service.get(id);
  }

  update(id: number, payload: OrderUpdatePayload): Observable<Order> {
    return this.service.update(id, payload);
  }

  changeStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.service.changeStatus(id, status);
  }

  archive(id: number): Observable<void> {
    return this.service.archive(id);
  }

  reset(): void {
    this.requestId += 1;
    this.ordersSignal.set([]);
    this.paginationSignal.set(createEmptyPage());
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}

function createEmptyPage(): OrderPage {
  return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 };
}
