import { describe, expect, it } from 'vitest';
import { generatePublicToken } from './public-token.js';

describe('generatePublicToken', () => {
  it('is 22 url-safe characters and unique', () => {
    const tokens = new Set(Array.from({ length: 500 }, generatePublicToken));
    expect(tokens.size).toBe(500);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});
