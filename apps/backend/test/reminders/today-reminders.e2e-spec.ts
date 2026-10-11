import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../support/create-test-app.js';
import { createBusiness, createCharge, createCustomer, createInvoice, createPendingClaim } from '../support/factories.js';
import { createOwner, type OwnerApi } from '../support/owner.js';

describe("today's reminders (e2e)", () => {
  let t: TestApp;
  let api: OwnerApi;
  let ids: Record<string, string>;
  let businessId: string;

  beforeEach(async () => {
    t = await createTestApp();
    const owner = await createOwner(t);
    api = owner.api;
    businessId = owner.business.id;
    const customer = (name: string, phone: string, gender: 'male' | 'female' | null = null) =>
      createCustomer(t.prisma, businessId, { name, phone, gender });
    const sara = await customer('سارة', '+201112345678', 'female');
    const dina = await customer('دينا', '+201012345671');
    const mahmoud = await customer('محمود', '+201023456781', 'male');
    const youssef = await customer('يوسف', '+201012345672');
    const mona = await customer('منى', '+201012345673');
    const ahmed = await customer('أحمد', '+201012345674');
    const karim = await customer('كريم', '+201012345675');
    const charge = await createCharge(t.prisma, businessId, [sara, dina, mahmoud, youssef, mona, ahmed, karim].map((c) => c.id));
    const invoice = (customerId: string, dueDate: string, extra = {}) =>
      createInvoice(t.prisma, { businessId, chargeId: charge.id, customerId, period: '2026-09', dueDate: new Date(`${dueDate}T00:00:00.000Z`), ...extra });

    ids = {
      before: (await invoice(sara.id, '2026-09-26')).id,
      onDue: (await invoice(dina.id, '2026-09-23', { title: 'تيشيرت', period: null, amount: 150 })).id,
      after: (await invoice(mahmoud.id, '2026-09-20')).id,
      longLate: (await invoice(youssef.id, '2026-09-01')).id,
      paid: (await invoice(mona.id, '2026-09-20', { paidAt: new Date() })).id,
      promise: (await invoice(karim.id, '2026-09-10', { promisedDate: new Date('2026-09-23T00:00:00.000Z') })).id,
    };
    const claimed = await invoice(ahmed.id, '2026-09-20');
    await createPendingClaim(t.prisma, claimed.id);
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('hides archived customers from reminders', async () => {
    const archived = await createCustomer(t.prisma, businessId, { name: 'مؤرشف', phone: '+201012345690', archivedAt: new Date() });
    const charge = await createCharge(t.prisma, businessId, [archived.id]);
    const hidden = await createInvoice(t.prisma, {
      businessId,
      chargeId: charge.id,
      customerId: archived.id,
      period: '2026-09',
      dueDate: new Date('2026-09-26T00:00:00.000Z'),
    });
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.items.map((i: { invoiceId: string }) => i.invoiceId)).not.toContain(hidden.id);
    await api.get(`/reminders/invoices/${hidden.id}`).expect(404);
    await api.post(`/reminders/${hidden.id}/sent`, { kind: 'before' }).expect(404);
  });

  it('lists the reminders due today in order, with ready-to-send messages', async () => {
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body).toMatchObject({ date: '2026-09-23', total: 4, sentCount: 0 });
    expect(res.body.items.map((i: { invoiceId: string; kind: string }) => [i.invoiceId, i.kind])).toEqual([
      [ids.before, 'before'],
      [ids.onDue, 'on_due'],
      [ids.promise, 'promise'],
      [ids.after, 'after'],
    ]);

    const sara = res.body.items[0];
    const token = (await t.prisma.invoice.findUniqueOrThrow({ where: { id: ids.before } })).publicToken;
    expect(sara.message).toBe(
      'أهلاً أستاذة سارة،\nفاضل 3 أيام على ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        `تقدري تدفعي من هنا في دقيقة:\nhttp://localhost:3001/p/${token}`,
    );
    expect(sara.waUrl).toBe(`https://wa.me/201112345678?text=${encodeURIComponent(sara.message)}`);
    expect(res.body.items[1].message).toContain('النهارده ميعاد تيشيرت');
  });

  it('marks a reminder as sent', async () => {
    await api.post(`/reminders/${ids.after}/sent`, { kind: 'after' }).expect(204);
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.sentCount).toBe(1);
    expect(res.body.items.find((i: { invoiceId: string }) => i.invoiceId === ids.after).sent).toBe(true);
    const logs = await t.prisma.reminderLog.findMany({ where: { invoiceId: ids.after } });
    expect(logs).toEqual([expect.objectContaining({ kind: 'after', channel: 'whatsapp_link' })]);
  });

  it('a reminder sent before Cairo midnight does not count for today', async () => {
    t.clock.set('2026-09-22T22:30:00.000Z'); // 01:30 on the 23rd in Cairo
    await t.prisma.reminderLog.create({
      data: { invoiceId: ids.after, kind: 'after', channel: 'whatsapp_link', sentAt: new Date('2026-09-22T20:30:00.000Z') },
    });
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.date).toBe('2026-09-23');
    expect(res.body.sentCount).toBe(0);
  });

  it('follows the rule', async () => {
    await api.put('/reminders/rule', { beforeDays: 3, onDueDate: true, afterDays: null }).expect(200);
    const res = await api.get('/reminders/today').expect(200);
    expect(res.body.items.map((i: { kind: string }) => i.kind)).toEqual(['before', 'on_due', 'promise']);
  });

  it('builds a manual reminder for any open invoice', async () => {
    const res = await api.get(`/reminders/invoices/${ids.longLate}`).expect(200);
    expect(res.body).toMatchObject({ kind: 'manual', status: 'overdue' });
    expect(res.body.message).toContain('عدّى ميعاده بـ 22 يوم.');
    const paid = await api.get(`/reminders/invoices/${ids.paid}`).expect(409);
    expect(paid.body.code).toBe('INVOICE_ALREADY_PAID');
  });

  it("refuses other businesses' invoices and bad kinds", async () => {
    const other = await createBusiness(t.prisma, { phone: '+201199999999' });
    const outsider = await createOwner(t, { phone: '+201199999998' });
    expect(other.id).toBeTruthy();
    await outsider.api.post(`/reminders/${ids.after}/sent`, { kind: 'after' }).expect(404);
    await outsider.api.get(`/reminders/invoices/${ids.after}`).expect(404);
    await api.post(`/reminders/${ids.after}/sent`, { kind: 'shout' }).expect(400);
  });
});
