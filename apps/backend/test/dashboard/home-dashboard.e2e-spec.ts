import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('home dashboard (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('summarizes the month, overdue money, confirmations and reminders', async () => {
    const { business, api } = await createOwner(t);
    const businessId = business.id;
    const c = (name: string, phone: string, extra = {}) => createCustomer(t.prisma, businessId, { name, phone, ...extra });
    const mona = await c('منى', '+201012345601');
    const mahmoud = await c('محمود', '+201012345602');
    const ahmed = await c('أحمد', '+201012345603');
    const sara = await c('سارة', '+201012345604');
    const youssef = await c('يوسف', '+201012345605');
    const gone = await c('قديم', '+201012345606', { archivedAt: new Date() });
    const charge = await createCharge(t.prisma, businessId, [mona, mahmoud, ahmed, sara, youssef, gone].map((x) => x.id));
    const inv = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, period: '2026-09', dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    await inv(mona.id, '2026-09-20', { paidAt: new Date('2026-09-19T10:00:00.000Z') });
    await inv(mahmoud.id, '2026-09-20');
    const claimed = await inv(ahmed.id, '2026-09-20', { amount: 600 });
    await createPendingClaim(t.prisma, claimed.id);
    await inv(sara.id, '2026-09-26', { amount: 900 });
    await inv(youssef.id, '2026-08-20', { period: '2026-08', amount: 300 });
    await inv(gone.id, '2026-09-20', { amount: 5000 });

    const res = await api.get('/dashboard/home').expect(200);
    expect(res.body).toMatchObject({
      businessName: 'أكاديمية النجوم للكرة',
      period: '2026-09',
      expected: 2400,
      collected: 450,
      remaining: 1950,
      collectedPercent: 18,
      overdue: { amount: 750, customerCount: 2 },
      awaitingConfirmationCount: 1,
      todayReminders: { total: 2, sentCount: 0, preview: [{ customerName: 'سارة' }, { customerName: 'محمود' }] },
    });
    expect(res.body.overdueCustomers.map((x: { name: string }) => x.name).sort()).toEqual(['محمود', 'يوسف'].sort());
  });

  it('is all zeros for a brand-new business', async () => {
    const { api } = await createOwner(t);
    const res = await api.get('/dashboard/home').expect(200);
    expect(res.body).toMatchObject({ expected: 0, collected: 0, remaining: 0, collectedPercent: 0, overdueCustomers: [] });
  });
});
