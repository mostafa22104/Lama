import type { ErrorCode } from '../../types/errors.js';

export const enErrors: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some details are missing or invalid',
  UNAUTHORIZED: 'Please log in first',
  TOKEN_INVALID: 'Your session ended, please log in again',
  NOT_FOUND: "We couldn't find that",
  OTP_INVALID: 'That code is not correct',
  OTP_EXPIRED: 'The code expired, request a new one',
  OTP_TOO_MANY_ATTEMPTS: 'Too many tries, request a new code',
  OTP_COOLDOWN: 'Wait a minute before requesting another code',
  SIGNUP_REQUIRED: 'This number is not registered, create an account',
  CONTACT_INVALID: 'That phone number or email is not valid',
  RATE_LIMITED: 'Too many requests, try again shortly',
  PLAN_LIMIT_REACHED: "You've reached your plan's customer limit",
  INTERNAL_ERROR: 'Something went wrong, try again',
};
