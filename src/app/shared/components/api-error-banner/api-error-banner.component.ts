import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ApiErrorStore } from '@core/services/api-error.store';

@Component({
  selector: 'app-api-error-banner',
  standalone: true,
  templateUrl: './api-error-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiErrorBannerComponent {
  private readonly apiErrorStore = inject(ApiErrorStore);

  readonly message = this.apiErrorStore.message;

  close(): void {
    this.apiErrorStore.clear();
  }
}
