import { toAppError } from './app-error';

let inflight: Promise<string | null> | null = null;

/**
 * Runs at most one refresh at a time; concurrent callers share its result.
 * - resolves null (and signs out once) only when the refresh resolves null or the
 *   server rejects the token (AppError 'TOKEN_INVALID')
 * - any other failure (NETWORK, INTERNAL_ERROR, ...) is rethrown as AppError without
 *   signing out, so a transient outage never destroys a valid session
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
      if (appError.code !== 'TOKEN_INVALID') throw appError;
      onAuthFailure();
      return null;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
