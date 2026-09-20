import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { AuthStore } from '@features/auth/store/auth.store';
import { ApiErrorStore } from '@core/services/api-error.store';
import { getApiErrorMessage } from '@core/utils/api-error-message';
import { HttpActivityService } from './http-activity.service';
import { NotificationStore } from '@core/services/notification.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const apiErrorStore = inject(ApiErrorStore);
  const notifications = inject(NotificationStore);
  const httpActivity = inject(HttpActivityService);
  const token = authStore.token();
  const isLoginEndpoint = request.url.includes('/auth/login');

  const headers = request.headers.set('Accept', 'application/json');
  const authenticatedRequest =
    token && !isLoginEndpoint
      ? request.clone({ headers: headers.set('Authorization', `Bearer ${token}`) })
      : request.clone({ headers });

  httpActivity.start();
  return next(authenticatedRequest).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse) || !isMutationRequest(request.method)) return;
      const message = getSuccessMessage(event.body);
      if (message) notifications.success(message);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginEndpoint) {
        authStore.clearSession();
        void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      if (error instanceof HttpErrorResponse && error.status !== 401) {
        const message = getApiErrorMessage(error, getHttpErrorMessage(error.status));
        apiErrorStore.show(message, error.status === 422 ? 'warning' : 'error');
      }

      return throwError(() => error);
    }),
    finalize(() => httpActivity.stop()),
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

function isMutationRequest(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function getSuccessMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const message = (body as { mensaje?: unknown; message?: unknown }).mensaje ??
    (body as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message.trim() : null;
}
