import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { toAppError } from './app-error';
import { refreshOnce } from './refresh';

export interface AuthHooks {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
}

let hooks: AuthHooks | null = null;

/** The auth feature plugs its session in here, so core never imports features. */
export function configureAuth(next: AuthHooks | null): void {
  hooks = next;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

function isExpiredToken(error: AxiosError): boolean {
  const body = error.response?.data as { code?: string } | undefined;
  return error.response?.status === 401 && body?.code === 'TOKEN_INVALID';
}

export function createPublicClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15_000 });
  client.interceptors.response.use(undefined, (error) => Promise.reject(toAppError(error)));
  return client;
}

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15_000 });
  client.interceptors.request.use((config) => {
    const token = hooks?.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (hooks && original && !original._retried && isExpiredToken(error)) {
      original._retried = true;
      const token = await refreshOnce(hooks.refresh);
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`);
        return client(original);
      }
      hooks.onAuthFailure();
    }
    throw toAppError(error);
  });
  return client;
}
