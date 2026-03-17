import { Injectable, computed, signal } from '@angular/core';
import { User } from '@core/models/user.model';
import { TokenService } from '@core/services/token.service';
import { STORAGE_KEYS } from '@core/constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());

  constructor(private readonly tokenService: TokenService) {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (storedUser) {
      this.userSignal.set(JSON.parse(storedUser) as User);
    }
  }

  login(user: User, token: string): void {
    this.userSignal.set(user);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    this.tokenService.setToken(token);
  }

  logout(): void {
    this.userSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    this.tokenService.clearToken();
  }
}
