import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import {
  allowNewCode,
  OWNER_PHONE,
  OWNER_PHONE_E164,
  requestCode,
  SIGNUP,
  signUp,
  verify,
} from '../support/auth-flow.js';

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

describe('signup and login (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('signs up a new owner with a normalized phone and a default reminder rule', async () => {
    const result = await signUp(t);
    expect(result.isNewBusiness).toBe(true);
    expect(result.business).toMatchObject({
      name: SIGNUP.businessName,
      type: 'academy',
      phone: OWNER_PHONE_E164,
      plan: 'free',
    });
    expect(result.tokens.accessTokenExpiresIn).toBe(900);
    const rule = await t.prisma.reminderRule.findUnique({ where: { businessId: result.business.id } });
    expect(rule).not.toBeNull();

    const me = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${result.tokens.accessToken}`)
      .expect(200);
    expect(me.body.id).toBe(result.business.id);
  });

  it('logs in with a differently formatted phone and returns the same business', async () => {
    const { business } = await signUp(t);
    for (const spelling of ['010 1234 5678', '+20 10 1234 5678', '00201012345678', '٠١٠١٢٣٤٥٦٧٨']) {
      await allowNewCode(t);
      const code = await requestCode(t, spelling);
      const res = await verify(t, { contact: spelling, code }).expect(200);
      expect(res.body).toMatchObject({ isNewBusiness: false, business: { id: business.id } });
    }
  });

  it('accepts the code typed in Arabic-Indic digits', async () => {
    const code = await requestCode(t);
    await verify(t, { contact: OWNER_PHONE, code: toArabicDigits(code), signup: SIGNUP }).expect(200);
  });

  it('accepts a code with an inner space and a bidi mark', async () => {
    const code = await requestCode(t);
    const pasted = `\u200E${toArabicDigits(code.slice(0, 3))} ${toArabicDigits(code.slice(3))}`;
    await verify(t, { contact: OWNER_PHONE, code: pasted, signup: SIGNUP }).expect(200);
  });

  it('asks an unknown contact to sign up, then signs up with the same code', async () => {
    const code = await requestCode(t);
    const login = await verify(t, { contact: OWNER_PHONE, code }).expect(404);
    expect(login.body.code).toBe('SIGNUP_REQUIRED');

    const signup = await verify(t, { contact: OWNER_PHONE, code, signup: SIGNUP }).expect(200);
    expect(signup.body.isNewBusiness).toBe(true);
  });

  it('logs an existing owner in even when signup details are sent, without changing the business', async () => {
    const { business } = await signUp(t);
    await allowNewCode(t);
    const code = await requestCode(t);
    const res = await verify(t, {
      contact: OWNER_PHONE,
      code,
      signup: { ...SIGNUP, businessName: 'اسم تاني' },
    }).expect(200);
    expect(res.body).toMatchObject({ isNewBusiness: false, business: { name: business.name } });
  });

  it('treats emails case-insensitively', async () => {
    const code = await requestCode(t, 'Owner@Example.COM', 'email');
    const signup = await t
      .api()
      .post('/api/v1/auth/otp/verify')
      .send({ channel: 'email', contact: 'Owner@Example.COM', code, signup: SIGNUP })
      .expect(200);
    expect(signup.body.business.email).toBe('owner@example.com');

    await allowNewCode(t);
    const again = await requestCode(t, 'owner@example.com', 'email');
    const login = await t
      .api()
      .post('/api/v1/auth/otp/verify')
      .send({ channel: 'email', contact: 'owner@example.com', code: again })
      .expect(200);
    expect(login.body.business.id).toBe(signup.body.business.id);
  });
});
