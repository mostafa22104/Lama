import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCharge, createCustomer, createInvoice } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('monthly report (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('compares the month with the previous one and lists who is still late', async () => {
    const { business, api } = await createOwner(t);
    const a = await createCustomer(t.prisma, business.id, { name: 'منى', phone: '+201012345601' });
    const b = await createCustomer(t.prisma, business.id, { name: 'محمود', phone: '+201012345602' });
    const charge = await createCharge(t.prisma, business.id, [a.id, b.id]);
    const inv = (customerId: string, period: string, due: string, paid: boolean) =>
      createInvoice(t.prisma, {
        businessId: business.id, chargeId: charge.id, customerId, period,
        dueDate: new Date(`${due}T00:00:00.000Z`), paidAt: paid ? new Date(`${due}T10:00:00.000Z`) : null,
      });
    await inv(a.id, '2026-08', '2026-08-20', true);
    await inv(b.id, '2026-08', '2026-08-20', true);
    await inv(a.id, '2026-09', '2026-09-20', true);
    await inv(b.id, '2026-09', '2026-09-20', false);

    const res = await api.get('/reports/monthly').expect(200);
    expect(res.body).toMatchObject({
      period: '2026-09',
      expected: 900,
      collected: 450,
      previousCollected: 900,
      invoiceCount: 2,
      paidInvoiceCount: 1,
    });
    expect(res.body.stillLate.map((c: { name: string }) => c.name)).toEqual(['محمود']);

    const august = await api.get('/reports/monthly?period=2026-08').expect(200);
    expect(august.body).toMatchObject({ period: '2026-08', collected: 900, invoiceCount: 2 });
  });

  it('rejects malformed periods', async () => {
    const { api } = await createOwner(t);
    await api.get('/reports/monthly?period=2026-13').expect(400);
    await api.get('/reports/monthly?period=sept').expect(400);
  });
});
