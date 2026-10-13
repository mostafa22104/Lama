import appConfig from '../../../app.json';

const DEV_API_BASE_URL = 'http://10.0.2.2:3000/api/v1'; // the Android emulator's alias for this PC

export function resolveApiBaseUrl(input: { isDev: boolean; releaseUrl: string }): string {
  if (input.isDev) return DEV_API_BASE_URL;
  if (!input.releaseUrl) throw new Error('Set "releaseApiBaseUrl" in apps/mobile/app.json for release builds');
  return input.releaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl({ isDev: __DEV__, releaseUrl: appConfig.releaseApiBaseUrl });
