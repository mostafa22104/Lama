import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('creating customers (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('creates a customer with a normalized phone', async () => {
    const { api } = await createOwner(t);
    const res = await api
      .post('/customers', { name: ' محمود حسن ', phone: '010 2345 6781', note: 'ولي أمر يوسف', gender: 'male' })
      .expect(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'محمود حسن',
      phone: '+201023456781',
      note: 'ولي أمر يوسف',
      gender: 'male',
      createdAt: DEFAULT_TEST_NOW,
    });
  });

  it('stores a blank note as null', async () => {
    const { api } = await createOwner(t);
    const res = await api.post('/customers', { name: 'محمود', phone: '010 2345 6781', note: '   ' }).expect(201);
    expect(res.body.note).toBeNull();
  });

  it('allows the same phone twice (siblings share a parent)', async () => {
    const { api } = await createOwner(t);
    await api.post('/customers', { name: 'يوسف', phone: '01023456781' }).expect(201);
    await api.post('/customers', { name: 'مريم', phone: '01023456781' }).expect(201);
  });

  it('rejects a bad phone with CONTACT_INVALID', async () => {
    const { api } = await createOwner(t);
    const res = await api.post('/customers', { name: 'x', phone: '0123' }).expect(400);
    expect(res.body).toMatchObject({ code: 'CONTACT_INVALID', details: { field: 'phone' } });
  });

  it('batch-creates all rows or none', async () => {
    const { business, api } = await createOwner(t);
    const bad = await api
      .post('/customers/batch', {
        customers: [
          { name: 'سارة', phone: '01112345678' },
          { name: 'كريم', phone: 'nope' },
        ],
      })
      .expect(400);
    expect(bad.body.details).toEqual({ field: 'customers.1.phone' });
    expect(await t.prisma.customer.count({ where: { businessId: business.id } })).toBe(0);

    const ok = await api
      .post('/customers/batch', {
        customers: [
          { name: 'سارة', phone: '01112345678' },
          { name: 'كريم', phone: '01212345678' },
        ],
      })
      .expect(201);
    expect(ok.body.created.map((c: { name: string }) => c.name)).toEqual(['سارة', 'كريم']);
  });

  it('enforces the plan limit, ignoring archived customers', async () => {
    const { business, api } = await createOwner(t);
    for (let i = 0; i < 19; i++) await createCustomer(t.prisma, business.id, { name: `عميل ${i}` });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });

    const over = await api
      .post('/customers/batch', {
        customers: [
          { name: 'أ', phone: '01012345601' },
          { name: 'ب', phone: '01012345602' },
        ],
      })
      .expect(403);
    expect(over.body).toMatchObject({ code: 'PLAN_LIMIT_REACHED', details: { max: 20, current: 19 } });

    await api.post('/customers', { name: 'العشرين', phone: '01012345603' }).expect(201);
  });

  it('requires a token', async () => {
    await t.api().post('/api/v1/customers').send({ name: 'x', phone: '01012345678' }).expect(401);
  });
});
