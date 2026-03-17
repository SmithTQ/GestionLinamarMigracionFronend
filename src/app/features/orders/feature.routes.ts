import { Routes } from '@angular/router';
import { OrdersPageComponent } from '@features/orders/pages/orders-page/orders-page.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersPageComponent,
  },
];
