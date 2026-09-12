import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiErrorBannerComponent } from '@shared/components/api-error-banner/api-error-banner.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ApiErrorBannerComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isNavigating = signal(false);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
      }
    });
  }
}
