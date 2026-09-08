import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiErrorStore } from '@core/services/api-error.store';
import { AuthStore } from '@features/auth/store/auth.store';

export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const apiErrorStore = inject(ApiErrorStore);
  const router = inject(Router);
  const permissions = route.data['permissions'] as string[] | undefined;

  if (!permissions?.length || authStore.hasAnyPermission(permissions)) {
    return true;
  }

  apiErrorStore.show('No tienes permisos suficientes para acceder a esta sección.');
  return router.createUrlTree(['/dashboard']);
};
