import { User } from '@core/models/user.model';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
