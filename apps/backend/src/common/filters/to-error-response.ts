import { HttpException } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@lamma/shared';
import { AppError } from '../errors/app-error.js';

export interface ErrorResponse {
  status: number;
  body: ApiErrorBody;
}

function codeForHttpStatus(status: number): ErrorCode {
  if (status === 400) return 'VALIDATION_FAILED';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    const { code, message, details } = exception;
    return { status: exception.status, body: { code, message, details } };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return { status, body: { code: codeForHttpStatus(status), message: exception.message } };
  }
  return { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
}
