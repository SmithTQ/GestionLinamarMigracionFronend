import { ApiResponse } from '@core/models/api-response.model';
import { User } from '@core/models/user.model';

export interface LoginRequestDto {
  login: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  token_type: 'Bearer';
  user: User;
}

export type LoginResponseDto = ApiResponse<AuthResponseData>;
export type MeResponseDto = ApiResponse<User>;
export type LogoutResponseDto = ApiResponse<null>;
