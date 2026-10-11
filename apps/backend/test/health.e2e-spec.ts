import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/create-test-app.js';

describe('health and error contract (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    const res = await t.api().get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes use the error contract', async () => {
    const res = await t.api().get('/api/v1/does-not-exist').expect(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND' });
  });
});
