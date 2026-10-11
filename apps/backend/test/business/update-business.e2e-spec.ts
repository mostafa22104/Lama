import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('business settings (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('updates only the fields sent, trimming text', async () => {
    const { api } = await createOwner(t);
    const res = await api.patch('/business', { name: '  أكاديمية النجوم  ', weeklyBackup: true }).expect(200);
    expect(res.body).toMatchObject({
      name: 'أكاديمية النجوم',
      weeklyBackup: true,
      instapayAddress: 'nogoum.academy@instapay',
    });
  });

  it('stores an empty area as null', async () => {
    const { api } = await createOwner(t, { area: 'التجمع الخامس' });
    const res = await api.patch('/business', { area: '' }).expect(200);
    expect(res.body.area).toBeNull();
  });

  it('clears the area with null', async () => {
    const { api } = await createOwner(t, { area: 'التجمع الخامس' });
    const res = await api.patch('/business', { area: null }).expect(200);
    expect(res.body.area).toBeNull();
  });

  it('rejects empty names and unknown fields', async () => {
    const { api } = await createOwner(t);
    const empty = await api.patch('/business', { name: ' ' }).expect(400);
    expect(empty.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
    await api.patch('/business', { plan: 'pro' }).expect(400);
  });

  it('rejects null for required fields', async () => {
    const { api } = await createOwner(t);
    const res = await api.patch('/business', { name: null }).expect(400);
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
  });

  it('reports plan usage without archived customers', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    await createCustomer(t.prisma, business.id, { name: 'سارة عادل' });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });
    const res = await api.get('/business/usage').expect(200);
    expect(res.body).toEqual({ plan: 'free', customerCount: 2, maxCustomers: 20, upgradeRequestedAt: null });
  });

  it('records an upgrade request at the current time', async () => {
    const { api } = await createOwner(t);
    await api.post('/business/upgrade-request').expect(204);
    const res = await api.get('/business/usage').expect(200);
    expect(res.body.upgradeRequestedAt).toBe(DEFAULT_TEST_NOW);
  });
});
