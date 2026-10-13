import { toAppError } from './app-error';

let inflight: Promise<string | null> | null = null;

/**
 * Runs at most one refresh at a time; concurrent callers share its result.
 * - resolves null (and signs out once) when the server rejects the refresh
 * - rejects with AppError('NETWORK') without signing out when offline
 */
export function refreshOnce(
  refresh: () => Promise<string | null>,
  onAuthFailure: () => void,
): Promise<string | null> {
  inflight ??= (async () => {
    try {
      const token = await refresh();
      if (token === null) onAuthFailure();
      return token;
    } catch (error) {
      const appError = toAppError(error);
      if (appError.code === 'NETWORK') throw appError;
      onAuthFailure();
      return null;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
