import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AUTH_REPOSITORY } from './auth.repository';
import { AuthSession, LoginCredentials } from '@features/auth/models/auth.model';
import { AuthStore } from '@features/auth/store/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authRepository = inject(AUTH_REPOSITORY);
  private readonly store = inject(AuthStore);

  readonly user = this.store.user;
  readonly isAuthenticated = this.store.isAuthenticated;

  authenticate(credentials: LoginCredentials): Observable<AuthSession> {
    return this.authRepository.login(credentials).pipe(
      tap((session) => {
        this.store.setSession(session);
      }),
    );
  }

  logout(): void {
    this.store.clearSession();
  }
}
