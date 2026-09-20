import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppNotification, NotificationStore } from '@core/services/notification.store';

@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly notificationStore = inject(NotificationStore);

  readonly notifications = this.notificationStore.notifications;

  dismiss(notification: AppNotification): void {
    this.notificationStore.dismiss(notification.id);
  }
}
