import { AxiosError, AxiosHeaders } from 'axios';
import { AppError, errorMessageKey, toAppError } from '../api/app-error';

const axiosError = (status?: number, data?: unknown) =>
  new AxiosError('x', 'ERR', { headers: new AxiosHeaders() }, null,
    status ? { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } : undefined);

describe('toAppError', () => {
  it('keeps the server error code and details', () => {
    const error = toAppError(axiosError(400, { code: 'VALIDATION_FAILED', details: [{ field: 'name' }] }));
    expect(error).toMatchObject({ code: 'VALIDATION_FAILED', status: 400, details: [{ field: 'name' }] });
  });

  it('maps a missing response to NETWORK and unknown codes to INTERNAL_ERROR', () => {
    expect(toAppError(axiosError()).code).toBe('NETWORK');
    expect(toAppError(axiosError(500, { code: 'WAT' })).code).toBe('INTERNAL_ERROR');
    expect(toAppError(new Error('boom')).code).toBe('INTERNAL_ERROR');
  });

  it('picks the translation key', () => {
    expect(errorMessageKey(new AppError('NETWORK'))).toBe('common:network');
    expect(errorMessageKey(new AppError('OTP_INVALID'))).toBe('errors:OTP_INVALID');
  });
});
