import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiErrorStore {
  private readonly messageSignal = signal<string | null>(null);

  readonly message = this.messageSignal.asReadonly();

  show(message: string): void {
    this.messageSignal.set(message);
  }

  clear(): void {
    this.messageSignal.set(null);
  }
}
