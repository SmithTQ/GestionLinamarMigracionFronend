import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '@features/auth/store/auth.store';
import { ApiErrorStore } from '@core/services/api-error.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const apiErrorStore = inject(ApiErrorStore);
  const token = authStore.token();
  const isLoginEndpoint = request.url.includes('/auth/login');

  const headers = request.headers.set('Accept', 'application/json');
  const authenticatedRequest =
    token && !isLoginEndpoint
      ? request.clone({ headers: headers.set('Authorization', `Bearer ${token}`) })
      : request.clone({ headers });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginEndpoint) {
        authStore.clearSession();
        void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      if (error instanceof HttpErrorResponse && error.status !== 401) {
        const message =
          typeof error.error?.mensaje === 'string'
            ? error.error.mensaje
            : getHttpErrorMessage(error.status);
        apiErrorStore.show(message);
      }

      return throwError(() => error);
    }),
  );
};

function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 403:
      return 'No tienes permisos suficientes para realizar esta operación.';
    case 404:
      return 'El recurso solicitado no existe o ya no está disponible.';
    case 409:
      return 'La operación entra en conflicto con el estado actual.';
    case 422:
      return 'Revisa los datos ingresados.';
    case 429:
      return 'Se alcanzó el límite de solicitudes. Inténtalo nuevamente en unos minutos.';
    default:
      return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
}
