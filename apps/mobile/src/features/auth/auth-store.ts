import { create } from 'zustand';
import type { BusinessDto } from '@lamma/shared';

export type AuthStatus = 'restoring' | 'offline' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  business: BusinessDto | null;
}

/** In-memory only: the access token never touches disk. */
export const useAuthStore = create<AuthState>()(() => ({ status: 'restoring', accessToken: null, business: null }));
