import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createOwner } from '../support/owner.js';

describe('reminder rule (e2e)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('defaults to all three reminders, even for businesses without a stored rule', async () => {
    const { api } = await createOwner(t);
    const res = await api.get('/reminders/rule').expect(200);
    expect(res.body).toEqual({ beforeDays: 3, onDueDate: true, afterDays: 3 });
  });

  it('saves a new rule and allows turning offsets off with null', async () => {
    const { api } = await createOwner(t);
    await api.put('/reminders/rule', { beforeDays: null, onDueDate: true, afterDays: 5 }).expect(200);
    const res = await api.get('/reminders/rule').expect(200);
    expect(res.body).toEqual({ beforeDays: null, onDueDate: true, afterDays: 5 });
  });

  it('validates every field', async () => {
    const { api } = await createOwner(t);
    await api.put('/reminders/rule', { beforeDays: 0, onDueDate: true, afterDays: 3 }).expect(400);
    await api.put('/reminders/rule', { beforeDays: 3, afterDays: 3 }).expect(400);
    await api.put('/reminders/rule', { onDueDate: true, afterDays: 3 }).expect(400);
  });
});
