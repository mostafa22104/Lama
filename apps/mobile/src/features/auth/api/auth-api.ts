import type { AuthResponse, AuthTokens, BusinessDto, OtpRequestBody, OtpVerifyBody } from '@lamma/shared';
import { api, publicApi } from '../../../core/api/instances';

export const authApi = {
  requestOtp: async (body: OtpRequestBody): Promise<void> => {
    await api.post('/auth/otp/request', body);
  },
  verifyOtp: async (body: OtpVerifyBody): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/otp/verify', body)).data,
  refresh: async (refreshToken: string): Promise<AuthTokens> =>
    (await publicApi.post<AuthTokens>('/auth/refresh', { refreshToken })).data,
  logout: async (refreshToken: string): Promise<void> => {
    await publicApi.post('/auth/logout', { refreshToken });
  },
  me: async (): Promise<BusinessDto> => (await api.get<BusinessDto>('/business')).data,
};
