import { Injectable, computed, signal } from '@angular/core';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ordersSignal = signal<Order[]>([
    {
      id: 'ORD-0921',
      customerName: 'Industria Norte',
      status: 'in_progress',
      total: 24500,
      createdAt: '2026-03-01',
    },
    {
      id: 'ORD-0922',
      customerName: 'Grupo Altavista',
      status: 'completed',
      total: 18200,
      createdAt: '2026-03-05',
    },
  ]);

  readonly orders = this.ordersSignal.asReadonly();
  readonly totalSales = computed(() =>
    this.ordersSignal().reduce((acc, order) => acc + order.total, 0),
  );

  add(order: Order): void {
    this.ordersSignal.update((state) => [...state, order]);
  }
}
