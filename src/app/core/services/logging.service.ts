import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  info(message: string, data?: unknown): void {
    console.info(`[INFO] ${message}`, data ?? '');
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data ?? '');
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data ?? '');
  }
}
