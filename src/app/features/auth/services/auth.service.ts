import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
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

  restoreSession(): Observable<AuthSession['user'] | null> {
    if (!this.store.token()) {
      return of(null);
    }

    return this.authRepository.me().pipe(
      tap((user) => this.store.setUser(user)),
      catchError(() => {
        this.store.clearSession();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.authRepository.logout().pipe(
      catchError(() => of(undefined)),
      finalize(() => this.store.clearSession()),
    );
  }
}
