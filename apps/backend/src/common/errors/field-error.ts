import { AppError } from './app-error.js';

/** Same shape as the validation pipe's details, for rules a DTO decorator can't express. */
export function fieldError(field: string, constraint: string): AppError {
  return new AppError('VALIDATION_FAILED', `Invalid ${field}`, [{ field, constraints: [constraint] }]);
}
