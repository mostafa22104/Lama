import { JwtService } from '@nestjs/jwt';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testEnv } from '../../testing/test-env.js';
import { AccessTokenService } from './access-token.service.js';

const service = new AccessTokenService(new JwtService(), testEnv());

describe('AccessTokenService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips the business id', () => {
    expect(service.verify(service.sign('biz_1')).sub).toBe('biz_1');
  });

  it('rejects tampered tokens with TOKEN_INVALID', () => {
    const token = service.sign('biz_1');
    expect(() => service.verify(`${token}x`)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });

  it('rejects tokens signed with another secret', () => {
    const other = new AccessTokenService(new JwtService(), testEnv({ JWT_ACCESS_SECRET: 'z'.repeat(32) }));
    expect(() => service.verify(other.sign('biz_1'))).toThrow(
      expect.objectContaining({ code: 'TOKEN_INVALID' }),
    );
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'));
    const token = service.sign('biz_1');
    vi.setSystemTime(new Date('2026-09-20T10:16:00Z'));
    expect(() => service.verify(token)).toThrow(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });
});
