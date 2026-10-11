import { HttpException } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@lamma/shared';
import { AppError } from '../errors/app-error.js';

export interface ErrorResponse {
  status: number;
  body: ApiErrorBody;
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'INVOICE_ALREADY_PAID',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
};

const INTERNAL: ErrorResponse = {
  status: 500,
  body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
};

/** Errors from Express middleware (body-parser) carry `status` and `expose` but are not HttpExceptions. */
function isExposedHttpError(value: unknown): value is { status: number; message: string } {
  const candidate = value as { status?: unknown; expose?: unknown };
  return typeof value === 'object' && value !== null && typeof candidate.status === 'number' && candidate.expose === true;
}

function fromStatus(status: number, message: string): ErrorResponse {
  if (status >= 500) return INTERNAL;
  return { status, body: { code: CODE_BY_STATUS[status] ?? 'VALIDATION_FAILED', message } };
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    const { code, message, details } = exception;
    return { status: exception.status, body: { code, message, details } };
  }
  if (exception instanceof HttpException) return fromStatus(exception.getStatus(), exception.message);
  if (isExposedHttpError(exception)) return fromStatus(exception.status, exception.message);
  return INTERNAL;
}
