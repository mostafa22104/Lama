import { useMutation } from '@tanstack/react-query';
import type { OtpRequestBody, OtpVerifyBody } from '@lamma/shared';
import type { AppError } from '../../../core/api/app-error';
import { signIn } from '../session';
import { authApi } from './auth-api';

export function useRequestOtp() {
  return useMutation<void, AppError, OtpRequestBody>({ mutationFn: authApi.requestOtp });
}

export function useVerifyOtp() {
  return useMutation<void, AppError, OtpVerifyBody>({
    mutationFn: async (body) => signIn(await authApi.verifyOtp(body)),
  });
}
