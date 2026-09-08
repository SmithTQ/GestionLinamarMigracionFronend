import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthRepository } from './auth.repository';
import { AuthSession, LoginCredentials } from '@features/auth/models/auth.model';
import { AuthApiService } from './auth-api.service';
import { mapLoginResponseToSession } from './auth.mapper';
import { LoginRequestDto } from './auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthRepositoryImpl implements AuthRepository {
  private readonly apiService = inject(AuthApiService);

  login(credentials: LoginCredentials): Observable<AuthSession> {
    const payload: LoginRequestDto = {
      login: credentials.login,
      password: credentials.password,
    };

    return this.apiService.login(payload).pipe(map(mapLoginResponseToSession));
  }

  me(): Observable<AuthSession['user']> {
    return this.apiService.me().pipe(map((response) => response.datos));
  }

  logout(): Observable<void> {
    return this.apiService.logout().pipe(map(() => undefined));
  }
}
