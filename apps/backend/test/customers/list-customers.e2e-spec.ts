import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner, type OwnerApi } from '../support/owner.js';

describe('listing customers (e2e)', () => {
  let t: TestApp;
  let api: OwnerApi;
  let businessId: string;

  beforeEach(async () => {
    t = await createTestApp();
    const owner = await createOwner(t);
    api = owner.api;
    businessId = owner.business.id;

    const make = (name: string, phone: string) => createCustomer(t.prisma, businessId, { name, phone });
    const mahmoud = await make('محمود حسن', '+201023456781');
    const sara = await make('سارة عادل', '+201112345678');
    const ahmed = await make('أحمد السيد', '+201212345678');
    const mona = await make('منى إبراهيم', '+201512345678');
    await make('هبة مصطفى', '+201098765432');
    const gone = await createCustomer(t.prisma, businessId, { name: 'قديم', archivedAt: new Date() });

    const ids = [mahmoud.id, sara.id, ahmed.id, mona.id, gone.id];
    const charge = await createCharge(t.prisma, businessId, ids);
    const invoice = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    await invoice(mahmoud.id, '2026-09-20');
    await invoice(sara.id, '2026-09-26');
    const claimed = await invoice(ahmed.id, '2026-09-20', { amount: 600 });
    await createPendingClaim(t.prisma, claimed.id);
    await invoice(mona.id, '2026-09-20', { paidAt: new Date('2026-09-19T10:00:00.000Z') });
    await invoice(gone.id, '2026-09-20');
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('computes status and balance, most urgent first, without archived customers', async () => {
    const res = await api.get('/customers').expect(200);
    expect(res.body.map((c: { name: string; status: string | null; balance: number }) => [c.name, c.status, c.balance])).toEqual([
      ['محمود حسن', 'overdue', 450],
      ['أحمد السيد', 'awaiting_confirmation', 600],
      ['سارة عادل', 'due_soon', 450],
      ['منى إبراهيم', 'paid', 0],
      ['هبة مصطفى', null, 0],
    ]);
    expect(res.body[0].headline).toMatchObject({ dueDate: '2026-09-20', status: 'overdue', amount: 450 });
  });

  it('filters by status and rejects unknown statuses', async () => {
    const res = await api.get('/customers?status=overdue').expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['محمود حسن']);
    await api.get('/customers?status=late').expect(400);
  });

  it('searches by name and by phone digits typed in Arabic', async () => {
    const byName = await api.get(`/customers?search=${encodeURIComponent('سارة')}`).expect(200);
    expect(byName.body.map((c: { name: string }) => c.name)).toEqual(['سارة عادل']);
    const byPhone = await api.get(`/customers?search=${encodeURIComponent('٠١٠٢٣٤')}`).expect(200);
    expect(byPhone.body.map((c: { name: string }) => c.name)).toEqual(['محمود حسن']);
  });

  it("never shows another business's customers", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112340000' });
    await createCustomer(t.prisma, other.id, { name: 'غريب' });
    const res = await api.get('/customers').expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).not.toContain('غريب');
  });
});
