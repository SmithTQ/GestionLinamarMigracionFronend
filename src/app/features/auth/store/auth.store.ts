import { Injectable, computed, signal } from '@angular/core';
import { AuthSession } from '@features/auth/models/auth.model';
import { STORAGE_KEYS } from '@core/constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userSignal = signal<AuthSession['user'] | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal() && !!this.tokenSignal());

  constructor() {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    const storedToken = sessionStorage.getItem(STORAGE_KEYS.token);
    if (storedUser) {
      this.userSignal.set(JSON.parse(storedUser) as AuthSession['user']);
    }
    if (storedToken) {
      this.tokenSignal.set(storedToken);
    }
  }

  setSession(session: AuthSession): void {
    this.userSignal.set(session.user);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
    this.tokenSignal.set(session.token);
    sessionStorage.setItem(STORAGE_KEYS.token, session.token);
  }

  clearSession(): void {
    this.userSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    this.tokenSignal.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.token);
  }
}
