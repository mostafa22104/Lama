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

  it("answers 404 for an archived customer's invoice", async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);
    await api.delete(`/customers/${invoice.customerId}`).expect(204);
    await api.post(`/invoices/${invoice.id}/cash-payment`).expect(404);
    expect(await t.prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });

  it('records partial cash payment and keeps remaining balance due', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);

    // Pay 200 out of 450
    const res = await api.post(`/invoices/${invoice.id}/cash-payment`).send({ amount: 200 }).expect(201);
    expect(res.body).toMatchObject({ id: invoice.id, amount: 250 });
    expect(res.body.status).not.toBe('paid');

    const payments = await t.prisma.payment.findMany({ where: { invoiceId: invoice.id } });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ method: 'cash', amount: 200 });

    const customerMid = await api.get(`/customers/${invoice.customerId}`).expect(200);
    expect(customerMid.body.balance).toBe(250);

    // Pay remaining 250
    const res2 = await api.post(`/invoices/${invoice.id}/cash-payment`).send({ amount: 250 }).expect(201);
    expect(res2.body).toMatchObject({ id: invoice.id, status: 'paid' });

    const customerFinal = await api.get(`/customers/${invoice.customerId}`).expect(200);
    expect(customerFinal.body.balance).toBe(0);
    expect(customerFinal.body.status).toBe('paid');
  });

  it('rejects invalid payment amounts', async () => {
    const { business, api } = await createOwner(t);
    const invoice = await invoiceFor(business.id);
    await api.post(`/invoices/${invoice.id}/cash-payment`).send({ amount: 0 }).expect(400);
    await api.post(`/invoices/${invoice.id}/cash-payment`).send({ amount: -50 }).expect(400);
  });
});
