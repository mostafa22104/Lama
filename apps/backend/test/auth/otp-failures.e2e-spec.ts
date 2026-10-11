import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { OWNER_PHONE, requestCode, SIGNUP, verify } from '../support/auth-flow.js';

describe('OTP failures (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('rejects a phone that is not an Egyptian mobile', async () => {
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: '0123' })
      .expect(400);
    expect(res.body.code).toBe('CONTACT_INVALID');
  });

  it('reports which fields failed validation', async () => {
    const res = await t.api().post('/api/v1/auth/otp/request').send({ contact: OWNER_PHONE }).expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'channel' })]));
  });

  it('rejects an invalid business type inside signup', async () => {
    const code = await requestCode(t);
    const res = await verify(t, {
      contact: OWNER_PHONE,
      code,
      signup: { ...SIGNUP, businessType: 'bakery' },
    }).expect(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'signup.businessType' })]),
    );
  });

  it('rejects a wrong code', async () => {
    const code = await requestCode(t);
    const wrong = code === '000000' ? '111111' : '000000';
    const res = await verify(t, { contact: OWNER_PHONE, code: wrong, signup: SIGNUP }).expect(400);
    expect(res.body.code).toBe('OTP_INVALID');
  });

  it('enforces the resend cooldown', async () => {
    await requestCode(t);
    const res = await t
      .api()
      .post('/api/v1/auth/otp/request')
      .send({ channel: 'phone', contact: OWNER_PHONE })
      .expect(429);
    expect(res.body.code).toBe('OTP_COOLDOWN');
  });

  it('refuses to reuse a code after a successful verify', async () => {
    const code = await requestCode(t);
    await verify(t, { contact: OWNER_PHONE, code, signup: SIGNUP }).expect(200);
    const res = await verify(t, { contact: OWNER_PHONE, code }).expect(400);
    expect(res.body.code).toBe('OTP_INVALID');
  });
});
