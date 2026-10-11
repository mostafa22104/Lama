import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';

describe('auth rate limit (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('allows 10 requests a minute per IP, then returns RATE_LIMITED', async () => {
    for (let i = 0; i < 10; i++) {
      const contact = `010${String(10_000_000 + i)}`;
      await t.api().post('/api/v1/auth/otp/request').send({ channel: 'phone', contact }).expect(204);
    }
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: '01099999999' })
      .expect(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });
});
