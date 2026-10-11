import { afterEach, describe, expect, it } from 'vitest';
import { assertTestDatabase } from './assert-test-database.js';
import { loadTestEnv } from './load-test-env.js';

const testUrl = loadTestEnv()['DATABASE_URL'] as string;

describe('assertTestDatabase', () => {
  const originalEnv = process.env['NODE_ENV'];
  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  it('accepts the .env.test database', () => {
    expect(() => assertTestDatabase(testUrl)).not.toThrow();
  });

  it('rejects a different database', () => {
    const other = new URL(testUrl);
    other.port = '51214';
    expect(() => assertTestDatabase(other.toString())).toThrow(/Refusing to touch/);
    expect(() => assertTestDatabase(undefined)).toThrow(/Refusing to touch/);
  });

  it('rejects when NODE_ENV is not test', () => {
    process.env['NODE_ENV'] = 'development';
    expect(() => assertTestDatabase(testUrl)).toThrow(/Refusing to touch/);
  });
});
