import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiErrorStore } from '@core/services/api-error.store';
import { AuthStore } from '@features/auth/store/auth.store';
import { OperationalMode } from '@core/models/user.model';

export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const apiErrorStore = inject(ApiErrorStore);
  const router = inject(Router);
  const permissions = route.data['permissions'] as string[] | undefined;
  const requireAll = route.data['requireAllPermissions'] === true;
  const operationalModes = route.data['operationalModes'] as OperationalMode[] | undefined;

  const hasRequiredPermissions = requireAll
    ? permissions?.every((permission) => authStore.hasPermission(permission))
    : permissions?.some((permission) => authStore.hasPermission(permission));
  const currentMode = authStore.user()?.operational_context?.mode ?? null;
  const hasOperationalAccess = !operationalModes?.length || operationalModes.includes(currentMode);

  if ((!permissions?.length || hasRequiredPermissions) && hasOperationalAccess) {
    return true;
  }

  apiErrorStore.show('No tienes permisos suficientes para acceder a esta sección.');
  return router.createUrlTree(['/dashboard']);
};
