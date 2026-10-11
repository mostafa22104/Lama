import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TEST_NOW } from '../../src/testing/fixed-clock.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('cash payments (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  async function invoiceFor(businessId: string) {
    const customer = await createCustomer(t.prisma, businessId);
    const charge = await createCharge(t.prisma, businessId, [customer.id]);
    return createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId: customer.id });
  }

  it('marks the invoice paid and records a cash payment', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);

    const res = await api.post(`/invoices/${invoice.id}/cash-payment`).expect(201);
    expect(res.body).toMatchObject({ id: invoice.id, status: 'paid', amount: 450 });

    const payments = await t.prisma.payment.findMany({ where: { invoiceId: invoice.id } });
    expect(payments).toEqual([expect.objectContaining({ method: 'cash', amount: 450 })]);
    expect(payments[0].recordedAt.toISOString()).toBe(DEFAULT_TEST_NOW);

    const customer = await api.get(`/customers/${invoice.customerId}`).expect(200);
    expect(customer.body).toMatchObject({ balance: 0, status: 'paid' });
  });

  it('refuses to record the same invoice twice', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);
    await api.post(`/invoices/${invoice.id}/cash-payment`).expect(201);
    const again = await api.post(`/invoices/${invoice.id}/cash-payment`).expect(409);
    expect(again.body.code).toBe('INVOICE_ALREADY_PAID');
    expect(await t.prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });

  it("answers 404 for unknown and other businesses' invoices", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await invoiceFor(other.id);
    const { api } = await createOwner(t);
    await api.post(`/invoices/${foreign.id}/cash-payment`).expect(404);
    await api.post('/invoices/nope/cash-payment').expect(404);
  });
});
