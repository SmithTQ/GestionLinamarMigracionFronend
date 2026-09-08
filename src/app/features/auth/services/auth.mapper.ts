import { AuthSession } from '@features/auth/models/auth.model';
import { LoginResponseDto } from './auth.dto';

export function mapLoginResponseToSession(dto: LoginResponseDto): AuthSession {
  const token = dto.datos?.token;
  const user = dto.datos?.user;

  if (!token || !user) {
    throw new Error('Respuesta de login invalida.');
  }

  return { token, user };
}
