import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';

describe('oversized bodies (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('answers 413 PAYLOAD_TOO_LARGE instead of a 500', async () => {
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: 'x'.repeat(200_000) })
      .expect(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
