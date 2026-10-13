import type { AuthResponse } from '@lamma/shared';
import { AppError } from '../../core/api/app-error';
import { configureAuth } from '../../core/api/client';
import { clearRefreshToken, readRefreshToken, saveRefreshToken } from '../../core/storage/secure-token';
import { authApi } from './api/auth-api';
import { useAuthStore } from './auth-store';

async function forget(): Promise<void> {
  useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
  await clearRefreshToken().catch(() => undefined);
}

/** Exchanges the saved refresh token for a new pair. Returns the new access token, or null. */
async function rotate(): Promise<string | null> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;
  const tokens = await authApi.refresh(refreshToken);
  await saveRefreshToken(tokens.refreshToken);
  useAuthStore.setState({ accessToken: tokens.accessToken });
  return tokens.accessToken;
}

export function installAuthHooks(): void {
  configureAuth({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refresh: rotate,
    onAuthFailure: () => {
      void forget();
    },
  });
}

export async function restoreSession(): Promise<void> {
  useAuthStore.setState({ status: 'restoring' });
  try {
    // Calls rotate directly: it runs before any authenticated request exists.
    const accessToken = await rotate();
    if (!accessToken) return void useAuthStore.setState({ status: 'signedOut' });
    const business = await authApi.me();
    useAuthStore.setState({ status: 'signedIn', business });
  } catch (error) {
    // Only a real token rejection ends the session; anything else (offline, 5xx, 429) keeps it.
    if (error instanceof AppError && error.code === 'TOKEN_INVALID') return forget();
    useAuthStore.setState({ status: 'offline' });
  }
}

export async function signIn(response: AuthResponse): Promise<void> {
  await saveRefreshToken(response.tokens.refreshToken);
  useAuthStore.setState({ status: 'signedIn', accessToken: response.tokens.accessToken, business: response.business });
}

export async function signOut(): Promise<void> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
  await forget();
}
