import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  OTP_SECRET: 'b'.repeat(32),
};

describe('parseEnv', () => {
  it('defaults WEB_BASE_URL for local development and validates it', () => {
    expect(parseEnv(valid).WEB_BASE_URL).toBe('http://localhost:3001');
    expect(() => parseEnv({ ...valid, WEB_BASE_URL: 'not a url' })).toThrow(/WEB_BASE_URL/);
  });

  it('requires an explicit http(s) WEB_BASE_URL in production', () => {
    const prod = { ...valid, NODE_ENV: 'production' };
    expect(() => parseEnv(prod)).toThrow(/WEB_BASE_URL/);
    expect(parseEnv({ ...prod, WEB_BASE_URL: 'https://lamma.app' }).WEB_BASE_URL).toBe('https://lamma.app');
    expect(parseEnv({ ...valid, NODE_ENV: 'test' }).WEB_BASE_URL).toBe('http://localhost:3001');
  });

  it('rejects non-http WEB_BASE_URL schemes', () => {
    expect(() => parseEnv({ ...valid, WEB_BASE_URL: 'javascript:alert(1)' })).toThrow(/WEB_BASE_URL/);
    expect(() => parseEnv({ ...valid, WEB_BASE_URL: 'ftp://x' })).toThrow(/WEB_BASE_URL/);
  });

  it('applies defaults for optional values', () => {
    const env = parseEnv(valid);
    expect(env).toMatchObject({
      PORT: 3000,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TTL_DAYS: 30,
      OTP_TTL_SECONDS: 300,
      OTP_MAX_ATTEMPTS: 5,
      OTP_RESEND_COOLDOWN_SECONDS: 60,
    });
  });

  it('requires NODE_ENV so a forgotten value cannot select dev-only behaviour', () => {
    const { NODE_ENV: _omitted, ...withoutNodeEnv } = valid;
    expect(() => parseEnv(withoutNodeEnv)).toThrow(/NODE_ENV/);
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
