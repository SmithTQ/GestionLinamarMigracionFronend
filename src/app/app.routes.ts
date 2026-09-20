import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { campaignContextGuard } from '@core/guards/campaign-context.guard';
import { branchContextGuard } from '@core/guards/branch-context.guard';
import { permissionGuard } from '@core/guards/permission.guard';
import { AuthLayoutComponent } from '@layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from '@layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'formulario/invitacion/:publicKey',
    data: { invitation: true },
    loadComponent: () =>
      import('@features/public-form/pages/public-form-page/public-form-page.component').then(
        (m) => m.PublicFormPageComponent,
      ),
  },
  {
    path: 'public/forms/:publicKey',
    loadComponent: () =>
      import('@features/public-form/pages/public-form-page/public-form-page.component').then(
        (m) => m.PublicFormPageComponent,
      ),
  },
  {
    path: 'ruta/:token',
    loadComponent: () =>
      import('@features/public-route/pages/public-route-page/public-route-page.component').then(
        (m) => m.PublicRoutePageComponent,
      ),
  },
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
        path: 'campaign-selection',
        loadComponent: () =>
          import('@features/campaigns/pages/campaign-selection-page/campaign-selection-page.component').then(
            (m) => m.CampaignSelectionPageComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [campaignContextGuard],
        loadChildren: () =>
          import('@features/dashboard/feature.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'orders',
        canActivate: [permissionGuard, campaignContextGuard],
        data: { permissions: ['orders.view'] },
        loadChildren: () => import('@features/orders/feature.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'routes',
        canActivate: [permissionGuard, campaignContextGuard],
        data: { permissions: ['routes.manage'] },
        loadChildren: () =>
          import('@features/dispatch/feature.routes').then((m) => m.DISPATCH_ROUTES),
      },
      {
        path: 'customers',
        canActivate: [campaignContextGuard],
        loadChildren: () =>
          import('@features/customers/feature.routes').then((m) => m.CUSTOMERS_ROUTES),
      },
      {
        path: 'campaigns',
        canActivate: [permissionGuard, branchContextGuard],
        data: {
          permissions: ['campaigns.view'],
          operationalModes: ['super_admin', 'branch_admin'],
        },
        loadChildren: () =>
          import('@features/campaigns/feature.routes').then((m) => m.CAMPAIGNS_ROUTES),
      },
      {
        path: 'districts',
        canActivate: [permissionGuard, branchContextGuard],
        data: {
          permissions: ['districts.view', 'district_lists.view'],
          requireAllPermissions: true,
          operationalModes: ['super_admin', 'branch_admin'],
        },
        loadChildren: () =>
          import('@features/districts/feature.routes').then((m) => m.DISTRICTS_ROUTES),
      },
      {
        path: 'products',
        canActivate: [permissionGuard, branchContextGuard],
        data: {
          permissions: ['products.view'],
          operationalModes: ['super_admin', 'branch_admin'],
        },
        loadComponent: () =>
          import('@features/products/pages/products-page/products-page.component').then(
            (m) => m.ProductsPageComponent,
          ),
      },
      {
        path: 'branches',
        canActivate: [permissionGuard],
        data: { permissions: ['branches.view'], operationalModes: ['super_admin'] },
        loadChildren: () =>
          import('@features/branches/feature.routes').then((m) => m.BRANCHES_ROUTES),
      },
      {
        path: 'users',
        canActivate: [permissionGuard, branchContextGuard],
        data: {
          permissions: ['users.view'],
          operationalModes: ['super_admin', 'branch_admin'],
        },
        loadChildren: () => import('@features/users/feature.routes').then((m) => m.USERS_ROUTES),
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
