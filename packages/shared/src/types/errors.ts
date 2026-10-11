export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'TOKEN_INVALID',
  'NOT_FOUND',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_TOO_MANY_ATTEMPTS',
  'OTP_COOLDOWN',
  'SIGNUP_REQUIRED',
  'CONTACT_INVALID',
  'RATE_LIMITED',
  'PLAN_LIMIT_REACHED',
  'INVOICE_ALREADY_PAID',
  'FORBIDDEN',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
