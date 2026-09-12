import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { permissionGuard } from '@core/guards/permission.guard';
import { AuthLayoutComponent } from '@layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from '@layout/main-layout/main-layout.component';

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
        canActivate: [permissionGuard],
        data: { permissions: ['orders.view'] },
        loadChildren: () => import('@features/orders/feature.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('@features/customers/feature.routes').then((m) => m.CUSTOMERS_ROUTES),
      },
      {
        path: 'campaigns',
        canActivate: [permissionGuard],
        data: { permissions: ['campaigns.view'] },
        loadChildren: () =>
          import('@features/campaigns/feature.routes').then((m) => m.CAMPAIGNS_ROUTES),
      },
      {
        path: 'districts',
        canActivate: [permissionGuard],
        data: {
          permissions: ['districts.view', 'district_lists.view'],
          requireAllPermissions: true,
        },
        loadChildren: () =>
          import('@features/districts/feature.routes').then((m) => m.DISTRICTS_ROUTES),
      },
      {
        path: 'products',
        canActivate: [permissionGuard],
        data: { permissions: ['products.view'] },
        loadComponent: () =>
          import('@features/products/pages/products-page/products-page.component').then(
            (m) => m.ProductsPageComponent,
          ),
      },
      {
        path: 'ui-kit',
        loadChildren: () => import('@features/ui-kit/feature.routes').then((m) => m.UI_KIT_ROUTES),
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
