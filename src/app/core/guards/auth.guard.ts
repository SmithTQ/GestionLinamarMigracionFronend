import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() || environment.demoAuthEnabled) {
    return true;
  }

  return router.parseUrl('/auth/login');
};
