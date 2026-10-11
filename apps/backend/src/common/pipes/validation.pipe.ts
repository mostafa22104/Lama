import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';

export interface FieldError {
  field: string;
  constraints: string[];
}

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, constraints: Object.keys(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new AppError('VALIDATION_FAILED', 'Validation failed', flatten(errors)),
  });
}
