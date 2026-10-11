import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('customer detail (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('shows the balance, open invoices and the next monthly due date', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    const res = await api.get(`/customers/${customer.id}`).expect(200);
    expect(res.body).toMatchObject({
      id: customer.id,
      balance: 450,
      status: 'overdue',
      nextDue: { dueDate: '2026-10-20', amount: 450 },
    });
    expect(res.body.openInvoices).toEqual([
      expect.objectContaining({ period: '2026-09', dueDate: '2026-09-20', status: 'overdue', amount: 450 }),
    ]);
  });

  it('back-fills the current month before answering', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    t.clock.set('2026-10-25T09:00:00.000Z');

    const res = await api.get(`/customers/${customer.id}`).expect(200);
    expect(res.body.balance).toBe(900);
    expect(res.body.openInvoices.map((i: { period: string }) => i.period)).toEqual(['2026-09', '2026-10']);
  });

  it("answers 404 for archived and other businesses' customers", async () => {
    const { business, api } = await createOwner(t);
    const archived = await createCustomer(t.prisma, business.id, { archivedAt: new Date() });
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    await api.get(`/customers/${archived.id}`).expect(404);
    await api.get(`/customers/${foreign.id}`).expect(404);
  });
});
