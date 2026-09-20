import { Injectable, inject, signal } from '@angular/core';
import { NotificationStore, NotificationType } from './notification.store';

@Injectable({ providedIn: 'root' })
export class ApiErrorStore {
  private readonly notifications = inject(NotificationStore);
  private readonly messageSignal = signal<string | null>(null);

  readonly message = this.messageSignal.asReadonly();

  show(message: string, type: Extract<NotificationType, 'error' | 'warning'> = 'error'): void {
    this.messageSignal.set(message);
    if (type === 'warning') this.notifications.warning(message);
    else this.notifications.error(message);
  }

  clear(): void {
    this.messageSignal.set(null);
  }
}
