import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { signUp } from '../support/auth-flow.js';

describe('refresh and logout (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  const refresh = (refreshToken: string) =>
    t.api().post('/api/v1/auth/refresh').send({ refreshToken });

  it('rotates tokens and rejects the old refresh token', async () => {
    const { tokens } = await signUp(t);
    const res = await refresh(tokens.refreshToken).expect(200);
    expect(res.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      accessTokenExpiresIn: 900,
    });
    expect(res.body.refreshToken).not.toBe(tokens.refreshToken);

    const reuse = await refresh(tokens.refreshToken).expect(401);
    expect(reuse.body.code).toBe('TOKEN_INVALID');
    await refresh(res.body.refreshToken).expect(200);
  });

  it('logout revokes the refresh token', async () => {
    const { tokens } = await signUp(t);
    await t.api().post('/api/v1/auth/logout').send({ refreshToken: tokens.refreshToken }).expect(204);
    const res = await refresh(tokens.refreshToken).expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an unknown refresh token', async () => {
    const res = await refresh('garbage').expect(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
});
