import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthRepository } from './auth.repository';
import { AuthSession, LoginCredentials } from '@features/auth/models/auth.model';
import { AuthApiService } from './auth-api.service';
import { mapLoginResponseToSession } from './auth.mapper';
import { LoginRequestDto } from './auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly apiService: AuthApiService) {}

  login(credentials: LoginCredentials): Observable<AuthSession> {
    const payload: LoginRequestDto = {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    };

    return this.apiService.login(payload).pipe(map(mapLoginResponseToSession));
  }
}
