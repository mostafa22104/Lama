import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  OTP_SECRET: 'b'.repeat(32),
};

describe('parseEnv', () => {
  it('applies defaults for optional values', () => {
    const env = parseEnv(valid);
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TTL_DAYS: 30,
      OTP_TTL_SECONDS: 300,
      OTP_MAX_ATTEMPTS: 5,
      OTP_RESEND_COOLDOWN_SECONDS: 60,
    });
  });

  it('coerces numeric strings', () => {
    expect(parseEnv({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('names every missing variable in the error', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL.*JWT_ACCESS_SECRET.*OTP_SECRET/);
  });

  it('rejects short secrets', () => {
    expect(() => parseEnv({ ...valid, OTP_SECRET: 'short' })).toThrow(/OTP_SECRET/);
  });
});
