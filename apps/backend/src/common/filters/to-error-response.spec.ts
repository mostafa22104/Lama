import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { toErrorResponse } from './to-error-response.js';

describe('toErrorResponse', () => {
  it('maps AppError to its status and code, keeping details', () => {
    const result = toErrorResponse(new AppError('OTP_COOLDOWN', 'wait', { seconds: 60 }));
    expect(result).toEqual({
      status: 429,
      body: { code: 'OTP_COOLDOWN', message: 'wait', details: { seconds: 60 } },
    });
  });

  it('maps Nest HTTP exceptions to stable codes', () => {
    expect(toErrorResponse(new NotFoundException()).body.code).toBe('NOT_FOUND');
    expect(toErrorResponse(new BadRequestException()).body.code).toBe('VALIDATION_FAILED');
    expect(toErrorResponse(new HttpException('slow down', 429))).toMatchObject({
      status: 429,
      body: { code: 'RATE_LIMITED' },
    });
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    const result = toErrorResponse(new Error('db password is hunter2'));
    expect(result).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
