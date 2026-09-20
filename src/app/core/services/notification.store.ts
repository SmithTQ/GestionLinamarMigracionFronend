import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  title: string;
}

const DEFAULT_TITLES: Record<NotificationType, string> = {
  success: 'Operacion completada',
  error: 'No se pudo completar la operacion',
  warning: 'Revisa la informacion',
  info: 'Informacion',
};

const AUTO_DISMISS_MS: Record<NotificationType, number> = {
  success: 5_000,
  error: 8_000,
  warning: 7_000,
  info: 5_000,
};

/** Global, bounded notification queue for user-visible API feedback. */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationsSignal = signal<AppNotification[]>([]);
  private nextId = 0;
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly notifications = this.notificationsSignal.asReadonly();

  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  error(message: string, title?: string): void {
    this.show('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  dismiss(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) clearTimeout(timer);
    this.dismissTimers.delete(id);
    this.notificationsSignal.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  }

  private show(type: NotificationType, rawMessage: string, title?: string): void {
    const message = rawMessage.trim();
    if (!message) return;

    const duplicate = this.notificationsSignal().find(
      (notification) => notification.type === type && notification.message === message,
    );
    if (duplicate) {
      this.restartTimer(duplicate);
      return;
    }

    const notification: AppNotification = {
      id: ++this.nextId,
      type,
      message,
      title: title?.trim() || DEFAULT_TITLES[type],
    };
    const currentNotifications = this.notificationsSignal();
    const nextNotifications = [...currentNotifications, notification].slice(-4);
    currentNotifications
      .filter((current) => !nextNotifications.some((next) => next.id === current.id))
      .forEach((discarded) => this.dismiss(discarded.id));
    this.notificationsSignal.set(nextNotifications);
    this.restartTimer(notification);
  }

  private restartTimer(notification: AppNotification): void {
    const previousTimer = this.dismissTimers.get(notification.id);
    if (previousTimer) clearTimeout(previousTimer);
    this.dismissTimers.set(
      notification.id,
      setTimeout(() => this.dismiss(notification.id), AUTO_DISMISS_MS[notification.type]),
    );
  }
}
