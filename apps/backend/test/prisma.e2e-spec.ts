import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/create-test-app.js';
import { createBusiness } from './support/factories.js';

describe('database (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('stores a business with its default reminder rule', async () => {
    const business = await createBusiness(t.prisma, { reminderRule: { create: {} } });
    const rule = await t.prisma.reminderRule.findUniqueOrThrow({
      where: { businessId: business.id },
    });
    expect(rule).toMatchObject({ beforeDays: 3, onDueDate: true, afterDays: 3 });
    expect(business.plan).toBe('free');
  });

  it('starts every test from an empty database', async () => {
    expect(await t.prisma.business.count()).toBe(0);
  });
});
