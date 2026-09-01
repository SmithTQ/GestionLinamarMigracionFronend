import { User } from '@core/models/user.model';

export interface LoginRequestDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: User;
  error?: string;
}
