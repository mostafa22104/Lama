import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryRefreshTokenRepository } from '../../../testing/in-memory-refresh-token.repository.js';
import { testEnv } from '../../../testing/test-env.js';
import type { RefreshTokenRepository } from './refresh-token.repository.js';
import { RefreshTokenService } from './refresh-token.service.js';

const t0 = new Date('2026-09-20T10:00:00Z');
const days = (n: number) => new Date(t0.getTime() + n * 86_400_000);
const invalid = expect.objectContaining({ code: 'TOKEN_INVALID' });

describe('RefreshTokenService', () => {
  let repo: InMemoryRefreshTokenRepository;
  let service: RefreshTokenService;

  beforeEach(() => {
    repo = new InMemoryRefreshTokenRepository();
    service = new RefreshTokenService(repo as unknown as RefreshTokenRepository, testEnv());
  });

  it('stores only a hash of the issued token', async () => {
    const token = await service.issue('biz_1', t0);
    expect(token.length).toBeGreaterThanOrEqual(64);
    expect(repo.records[0].tokenHash).not.toBe(token);
  });

  it('rotates: returns a new token and the old one stops working', async () => {
    const first = await service.issue('biz_1', t0);
    const rotated = await service.rotate(first, days(1));
    expect(rotated.businessId).toBe('biz_1');
    expect(rotated.refreshToken).not.toBe(first);
    await expect(service.rotate(first, days(1))).rejects.toThrow(invalid);
    await expect(service.rotate(rotated.refreshToken, days(2))).resolves.toMatchObject({
      businessId: 'biz_1',
    });
  });

  it('rejects tokens past REFRESH_TTL_DAYS', async () => {
    const token = await service.issue('biz_1', t0);
    await expect(service.rotate(token, days(31))).rejects.toThrow(invalid);
  });

  it('rejects revoked tokens; revoking twice is harmless', async () => {
    const token = await service.issue('biz_1', t0);
    await service.revoke(token, days(1));
    await service.revoke(token, days(1));
    await expect(service.rotate(token, days(1))).rejects.toThrow(invalid);
  });

  it('rejects unknown tokens', async () => {
    await expect(service.rotate('not-a-real-token', t0)).rejects.toThrow(invalid);
  });
});
