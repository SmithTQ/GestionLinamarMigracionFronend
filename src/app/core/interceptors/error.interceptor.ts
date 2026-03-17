import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoggingService } from '@core/services/logging.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggingService);

  return next(req).pipe(
    catchError((error) => {
      logger.error('HTTP error captured', error);
      return throwError(() => error);
    }),
  );
};
