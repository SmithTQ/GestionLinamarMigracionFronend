import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

import { routes } from './app.routes';
import { AUTH_REPOSITORY } from '@features/auth/services/auth.repository';
import { AuthRepositoryImpl } from '@features/auth/services/auth.repository.impl';
import { LUCIDE_ICONS as APP_LUCIDE_ICONS } from '@shared/icons/lucide-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideAnimations(),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useFactory: () => new LucideIconProvider(APP_LUCIDE_ICONS),
    },
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepositoryImpl,
    },
  ],
};
