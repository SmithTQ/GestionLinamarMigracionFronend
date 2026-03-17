import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { LoggingService } from '@core/services/logging.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggingService);
  const startedAt = Date.now();

  return next(req).pipe(
    tap({
      next: () => {
        const elapsed = Date.now() - startedAt;
        logger.info(`${req.method} ${req.url} (${elapsed}ms)`);
      },
    }),
  );
};
