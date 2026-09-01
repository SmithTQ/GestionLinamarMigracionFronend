import { User } from '@core/models/user.model';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
}
