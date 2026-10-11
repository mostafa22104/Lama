import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InvoiceGenerator } from '../../src/modules/invoices/index.js';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('monthly invoice generation (e2e)', () => {
  let t: TestApp;
  let generator: InvoiceGenerator;

  beforeEach(async () => {
    t = await createTestApp();
    generator = t.app.get(InvoiceGenerator);
  });

  afterEach(async () => {
    await t.app.close();
  });

  const periodsOf = async (chargeId: string) =>
    (await t.prisma.invoice.findMany({ where: { chargeId }, orderBy: { period: 'asc' } })).map((i) => i.period);

  it('back-fills missed months exactly once', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);

    t.clock.set('2026-12-05T09:00:00.000Z');
    await generator.ensureUpToDate(business.id, '2026-12-05');
    await generator.ensureUpToDate(business.id, '2026-12-05');
    expect(await periodsOf(charge.body.id)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12']);
  });

  it('does not bill months while a charge was paused', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    await api.patch(`/charges/${charge.body.id}`, { active: false }).expect(200);

    t.clock.set('2027-01-05T09:00:00.000Z');
    await api.patch(`/charges/${charge.body.id}`, { active: true }).expect(200);
    await generator.ensureUpToDate(business.id, '2027-01-05');
    expect(await periodsOf(charge.body.id)).toEqual(['2026-09', '2027-01']);
  });

  it('clamps day 31 to the end of short months', async () => {
    t.clock.set('2027-01-15T09:00:00.000Z');
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 31, assignTo: 'all' }).expect(201);

    await generator.ensureUpToDate(business.id, '2027-02-03');
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: charge.body.id }, orderBy: { period: 'asc' } });
    expect(invoices.map((i) => i.dueDate.toISOString().slice(0, 10))).toEqual(['2027-01-31', '2027-02-28']);
  });

  it('uses the new amount for later months only', async () => {
    const { business, api } = await createOwner(t);
    await createCustomer(t.prisma, business.id);
    const charge = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    await api.patch(`/charges/${charge.body.id}`, { amount: 500 }).expect(200);

    await generator.ensureUpToDate(business.id, '2026-10-02');
    const invoices = await t.prisma.invoice.findMany({ where: { chargeId: charge.body.id }, orderBy: { period: 'asc' } });
    expect(invoices.map((i) => [i.period, i.amount])).toEqual([
      ['2026-09', 450],
      ['2026-10', 500],
    ]);
  });

  it('skips inactive charges and archived customers', async () => {
    const { business, api } = await createOwner(t);
    const keep = await createCustomer(t.prisma, business.id);
    const gone = await createCustomer(t.prisma, business.id, { name: 'سيمشي' });
    const active = await api.post('/charges', { kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' }).expect(201);
    const paused = await api.post('/charges', { kind: 'monthly', amount: 100, dayOfMonth: 5, assignTo: 'all' }).expect(201);
    await api.patch(`/charges/${paused.body.id}`, { active: false }).expect(200);
    await api.delete(`/customers/${gone.id}`).expect(204);

    await generator.ensureUpToDate(business.id, '2026-10-02');
    const october = await t.prisma.invoice.findMany({ where: { period: '2026-10' } });
    expect(october.map((i) => [i.chargeId, i.customerId])).toEqual([[active.body.id, keep.id]]);
  });
});
