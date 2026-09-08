import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSession, LoginCredentials } from '@features/auth/models/auth.model';

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  me(): Observable<AuthSession['user']>;
  logout(): Observable<void>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
