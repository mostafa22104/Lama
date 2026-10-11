import { parseEnv, type Env } from '../config/env.js';

/** A valid Env for unit tests; override only what a test cares about. */
export function testEnv(overrides: Record<string, string> = {}): Env {
  return parseEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://lamma:lamma@localhost:5432/unused',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    OTP_SECRET: 'b'.repeat(32),
    ...overrides,
  });
}
