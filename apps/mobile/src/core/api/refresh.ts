let inflight: Promise<string | null> | null = null;

/** Runs at most one refresh at a time; concurrent callers share its result. */
export function refreshOnce(refresh: () => Promise<string | null>): Promise<string | null> {
  inflight ??= refresh()
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
