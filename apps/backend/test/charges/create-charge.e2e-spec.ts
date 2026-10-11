import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('creating charges (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('bills every active customer for the current month, even past the due day', async () => {
    const { business, api } = await createOwner(t);
    const a = await createCustomer(t.prisma, business.id);
    const b = await createCustomer(t.prisma, business.id, { name: 'سارة عادل' });
    await createCustomer(t.prisma, business.id, { name: 'قديم', archivedAt: new Date() });

    const res = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    expect(res.body).toMatchObject({ kind: 'monthly', title: 'اشتراك', amount: 450, dayOfMonth: 20, customerCount: 2 });

    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: res.body.id }, orderBy: { customerId: 'asc' } });
    expect(invoices.map((i) => i.customerId).sort()).toEqual([a.id, b.id].sort());
    for (const invoice of invoices) {
      expect(invoice).toMatchObject({ period: '2026-09', amount: 450, title: 'اشتراك', paidAt: null });
      expect(invoice.dueDate.toISOString()).toBe('2026-09-20T00:00:00.000Z');
    }
  });

  it('counts only active customers on a charge', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const gone = await createCustomer(t.prisma, business.id, { name: 'سيمشي' });
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    await api.delete(`/customers/${gone.id}`).expect(204);
    const list = await api.get('/charges').expect(200);
    expect(list.body[0].customerCount).toBe(1);
  });

  it('bills only selected customers for a one-time charge', async () => {
    const { business, api } = await createOwner(t);
    const omar = await createCustomer(t.prisma, business.id, { name: 'عمر خالد' });
    await createCustomer(t.prisma, business.id);
    const res = await api
      .post('/charges', { kind: 'one_time', title: 'كامب الصيف', amount: 1200, dueDate: '2026-10-01', assignTo: 'selected', customerIds: [omar.id] })
      .expect(201);
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: res.body.id } });
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({ customerId: omar.id, period: null, amount: 1200, title: 'كامب الصيف' });
  });

  it('validates amounts, days and dates', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    await api.post('/charges', { kind: 'monthly', amount: 0, dayOfMonth: 20, assignTo: 'all' }).expect(400);
    await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 32, assignTo: 'all' }).expect(400);
    const noDay = await api.post('/charges', { kind: 'monthly', amount: 450, assignTo: 'all' }).expect(400);
    expect(noDay.body.details).toEqual([{ field: 'dayOfMonth', constraints: ['required'] }]);
    const badDate = await api
      .post('/charges', { kind: 'one_time', title: 'x', amount: 10, dueDate: '2026-02-30', assignTo: 'all' })
      .expect(400);
    expect(badDate.body.details).toEqual([{ field: 'dueDate', constraints: ['invalidDate'] }]);
  });

  it('rejects customers of another business and empty audiences', async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);

    const none = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(400);
    expect(none.body.details).toEqual([{ field: 'assignTo', constraints: ['noCustomers'] }]);

    const foreignRes = await api
      .post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'selected', customerIds: [foreign.id] })
      .expect(400);
    expect(foreignRes.body.details).toEqual([{ field: 'customerIds', constraints: ['unknownCustomer'] }]);
  });

  it("lists and updates charges, but never another business's", async () => {
    const { business, api } = await createOwner(t);
    const c = await createCustomer(t.prisma, business.id);
    const created = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    const list = await api.get('/charges').expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await api.patch(`/charges/${created.body.id}`, { amount: 500, active: false }).expect(200);
    expect(updated.body).toMatchObject({ amount: 500, active: false });
    await api.patch(`/charges/${created.body.id}`, { amount: null }).expect(400);

    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreignCharge = await createCharge(t.prisma, other.id, []);
    await api.patch(`/charges/${foreignCharge.id}`, { amount: 1 }).expect(404);
    expect(c.id).toBeTruthy();
  });
});
