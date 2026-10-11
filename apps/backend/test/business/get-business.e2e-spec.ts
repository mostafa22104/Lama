import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../../src/common/auth/access-token.service.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness } from '../support/factories.js';

describe('GET /api/v1/business (e2e)', () => {
  let t: TestApp;
  let tokens: AccessTokenService;

  beforeEach(async () => {
    t = await createTestApp();
    tokens = t.app.get(AccessTokenService);
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('returns 401 UNAUTHORIZED without a token', async () => {
    const res = await t.api().get('/api/v1/business').expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 TOKEN_INVALID for a garbage token', async () => {
    const res = await t.api().get('/api/v1/business').set('Authorization', 'Bearer nope').expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it("returns the owner's business", async () => {
    const business = await createBusiness(t.prisma);
    const res = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${tokens.sign(business.id)}`)
      .expect(200);
    expect(res.body).toEqual({
      id: business.id,
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      email: null,
      plan: 'free',
      logoUrl: null,
      area: null,
      weeklyBackup: false,
    });
  });

  it('returns 404 NOT_FOUND when the business no longer exists', async () => {
    const res = await t
      .api()
      .get('/api/v1/business')
      .set('Authorization', `Bearer ${tokens.sign('missing-id')}`)
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
