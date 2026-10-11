import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('customer history (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('returns the timeline newest first', async () => {
    t.clock.set('2026-08-01T09:00:00.000Z');
    const { business, api } = await createOwner(t);
    const created = await api.post('/customers', { name: 'محمود حسن', phone: '01023456781' }).expect(201);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    t.clock.set('2026-09-23T09:00:00.000Z');
    const august = await t.prisma.invoice.findFirstOrThrow({ where: { period: '2026-08' } });
    await t.prisma.invoice.update({ where: { id: august.id }, data: { paidAt: new Date('2026-08-21T10:00:00.000Z') } });
    await t.prisma.payment.create({
      data: { invoiceId: august.id, amount: 450, method: 'cash', recordedAt: new Date('2026-08-21T10:00:00.000Z') },
    });

    const res = await api.get(`/customers/${created.body.id}/history`).expect(200);
    expect(res.body.map((e: { type: string; at: string }) => [e.type, e.at])).toEqual([
      ['invoice', '2026-09-20'],
      ['payment', '2026-08-21T10:00:00.000Z'],
      ['invoice', '2026-08-20'],
      ['created', '2026-08-01T09:00:00.000Z'],
    ]);
    expect(business.id).toBeTruthy();
  });

  it("answers 404 for another business's customer", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);
    await api.get(`/customers/${foreign.id}/history`).expect(404);
  });
});
