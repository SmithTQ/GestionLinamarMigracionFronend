import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '@core/constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class TokenService {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.token);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEYS.token);
  }
}
