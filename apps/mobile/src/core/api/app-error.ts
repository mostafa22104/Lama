import { isAxiosError } from 'axios';
import { ERROR_CODES, type ErrorCode } from '@lamma/shared';

export type ClientErrorCode = ErrorCode | 'NETWORK';

export class AppError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isAxiosError(error)) {
    if (!error.response) return new AppError('NETWORK');
    const body = error.response.data as { code?: unknown; details?: unknown } | undefined;
    const code = isErrorCode(body?.code) ? body.code : 'INTERNAL_ERROR';
    return new AppError(code, error.response.status, body?.details);
  }
  return new AppError('INTERNAL_ERROR');
}

export function errorMessageKey(error: AppError): string {
  return error.code === 'NETWORK' ? 'common:network' : `errors:${error.code}`;
}
