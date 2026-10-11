import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCustomer } from '../support/factories.js';
import { createOwner } from '../support/owner.js';

describe('updating and archiving customers (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('updates fields and re-normalizes a new phone', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    const res = await api.patch(`/customers/${customer.id}`, { phone: '+20 11 1234 5678', note: null }).expect(200);
    expect(res.body).toMatchObject({ name: 'محمود حسن', phone: '+201112345678', note: null });
  });

  it('rejects null for required fields', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    const res = await api.patch(`/customers/${customer.id}`, { name: null }).expect(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name' })]));
    await api.patch(`/customers/${customer.id}`, { phone: null }).expect(400);
  });

  it('archives instead of deleting, then hides the customer', async () => {
    const { business, api } = await createOwner(t);
    const customer = await createCustomer(t.prisma, business.id);
    await api.delete(`/customers/${customer.id}`).expect(204);

    const row = await t.prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(row.archivedAt).not.toBeNull();
    await api.patch(`/customers/${customer.id}`, { name: 'x' }).expect(404);
    await api.delete(`/customers/${customer.id}`).expect(404);
  });

  it("answers 404 for another business's customer", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201112345678' });
    const foreign = await createCustomer(t.prisma, other.id);
    const { api } = await createOwner(t);
    await api.patch(`/customers/${foreign.id}`, { name: 'x' }).expect(404);
    await api.delete(`/customers/${foreign.id}`).expect(404);
  });
});
