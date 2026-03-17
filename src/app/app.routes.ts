import { Routes } from '@angular/router';
import { MainLayoutComponent } from '@layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from '@layout/auth-layout/auth-layout.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/feature.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('@features/orders/feature.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('@features/customers/feature.routes').then((m) => m.CUSTOMERS_ROUTES),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('@features/auth/feature.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
