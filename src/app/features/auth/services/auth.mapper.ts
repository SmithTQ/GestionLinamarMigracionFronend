import { AuthSession } from '@features/auth/models/auth.model';
import { LoginResponseDto } from './auth.dto';

export function mapLoginResponseToSession(dto: LoginResponseDto): AuthSession {
  const token = dto.access_token;
  const user = dto.user;

  if (!token || !user) {
    throw new Error('Respuesta de login invalida.');
  }

  return { token, user: { ...user, role: user.role ?? 'user' } };
}
