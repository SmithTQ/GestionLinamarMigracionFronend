import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequestDto, LoginResponseDto, LogoutResponseDto, MeResponseDto } from './auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = environment.apiUrl;

  private readonly http = inject(HttpClient);

  login(payload: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.baseUrl}/auth/login`, payload);
  }

  me(): Observable<MeResponseDto> {
    return this.http.get<MeResponseDto>(`${this.baseUrl}/auth/me`);
  }

  logout(): Observable<LogoutResponseDto> {
    return this.http.post<LogoutResponseDto>(`${this.baseUrl}/auth/logout`, {});
  }
}
