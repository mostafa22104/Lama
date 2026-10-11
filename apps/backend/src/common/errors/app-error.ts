import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@lamma/shared';

const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  OTP_INVALID: HttpStatus.BAD_REQUEST,
  OTP_EXPIRED: HttpStatus.BAD_REQUEST,
  OTP_TOO_MANY_ATTEMPTS: HttpStatus.TOO_MANY_REQUESTS,
  OTP_COOLDOWN: HttpStatus.TOO_MANY_REQUESTS,
  SIGNUP_REQUIRED: HttpStatus.NOT_FOUND,
  CONTACT_INVALID: HttpStatus.BAD_REQUEST,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  PLAN_LIMIT_REACHED: HttpStatus.FORBIDDEN,
  INVOICE_ALREADY_PAID: HttpStatus.CONFLICT,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  PAYLOAD_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** The only error type services throw. Clients translate `code`; `message` is for logs. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? code);
  }

  get status(): HttpStatus {
    return STATUS_BY_CODE[this.code];
  }
}
