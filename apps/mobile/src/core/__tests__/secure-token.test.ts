import { clearRefreshToken, readRefreshToken, saveRefreshToken } from '../storage/secure-token';

describe('secure token storage', () => {
  it('saves, reads and clears the refresh token', async () => {
    await saveRefreshToken('rt-1');
    await expect(readRefreshToken()).resolves.toBe('rt-1');
    await clearRefreshToken();
    await expect(readRefreshToken()).resolves.toBeNull();
  });
});
