import { HttpErrorResponse } from '@angular/common/http';

interface ErrorPayload {
  mensaje?: unknown;
  message?: unknown;
  errors?: unknown;
  datos?: { mensaje?: unknown; message?: unknown };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const payload = getPayload(error);
  const directMessage =
    payload?.mensaje ?? payload?.message ?? payload?.datos?.mensaje ?? payload?.datos?.message;
  if (typeof directMessage === 'string' && directMessage.trim() && !isValidationKey(directMessage)) {
    return directMessage.trim();
  }

  const validationMessage = getValidationMessage(payload?.errors);
  if (validationMessage) return validationMessage;
  return typeof directMessage === 'string' && isValidationKey(directMessage)
    ? formatValidationMessage(directMessage)
    : fallback;
}

function getPayload(error: unknown): ErrorPayload | null {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string') return { message: error.error };
    return isErrorPayload(error.error) ? error.error : null;
  }
  return isErrorPayload(error) ? error : null;
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return typeof value === 'object' && value !== null;
}

function getValidationMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object') return null;
  const messages = Object.values(errors as Record<string, unknown>).flatMap((value) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
  );
  return messages.length > 0 ? messages.map(formatValidationMessage).join(' ') : null;
}

function isValidationKey(message: string): boolean {
  return message.trim().startsWith('validation.');
}

function formatValidationMessage(message: string): string {
  const normalized = message.trim();
  const knownMessages: Record<string, string> = {
    'validation.confirmed': 'La confirmacion no coincide.',
    'validation.password.mixed': 'La contrasena debe incluir mayusculas y minusculas.',
    'validation.required': 'Completa los campos obligatorios.',
  };
  return knownMessages[normalized] ?? normalized;
}
