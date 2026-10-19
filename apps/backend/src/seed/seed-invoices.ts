import { generatePublicToken } from '../common/crypto/public-token.js';
import { fromIsoDate } from '../common/dates/date-codec.js';
import type { PrismaClient } from '../generated/prisma/client.js';

type DB = PrismaClient;

export async function seedOctoberInvoices(
  db: DB,
  bId: string,
  charges: { id: string }[],
  c: { id: string }[],
): Promise<void> {
  // 1. Overdue: 450 + 900 + 1200 + 300 = 2,850 EGP across 4 customers
  await createInv(db, bId, charges[0].id, c[0].id, '2026-10', 'اشتراك أكتوبر 2026', 450, '2026-10-05');
  await createInv(db, bId, charges[1].id, c[1].id, '2026-10', 'اشتراك تدريب خاص', 900, '2026-10-05');
  await createInv(db, bId, charges[2].id, c[2].id, null, 'كامب الصيف 2026', 1200, '2026-10-10');
  const youssef = await createInv(db, bId, charges[4].id, c[3].id, '2026-10', 'اشتراك ناشئين', 300, '2026-10-12');

  // Youssef reminder sent today (1 sent out of 7)
  await db.reminderLog.create({
    data: { invoiceId: youssef.id, kind: 'after', channel: 'whatsapp_link', sentAt: new Date() },
  });

  // 2. Awaiting confirmation: 3 claims (600 + 150 + 450 = 1,200 EGP)
  await createWithClaim(db, bId, charges[1].id, c[4].id, '2026-10', 'اشتراك أكتوبر', 600, '2026-10-05', {
    screenshotKey: 'claims/ahmed.png',
    extractedAmount: 600,
    checkAmount: true,
    checkDate: true,
    checkRecipient: true,
    verdict: 'all_match',
    transactionId: 'IP-20261014-9982',
    rawText: 'تحويل 600 ج.م إلى nogoum.academy@instapay مرجع: IP-20261014-9982',
  });
  await createWithClaim(db, bId, charges[3].id, c[5].id, null, 'تيشيرت الأكاديمية', 150, '2026-10-10', {
    screenshotKey: 'claims/dina.png',
    extractedAmount: 150,
    checkAmount: true,
    checkDate: true,
    checkRecipient: true,
    verdict: 'duplicate',
    transactionId: 'IP-20261010-1122',
    rawText: 'تحويل 150 ج.م مكرر',
  });
  await createWithClaim(db, bId, charges[0].id, c[6].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-05', {
    screenshotKey: 'claims/rana.png',
    extractedAmount: 400,
    checkAmount: false,
    checkDate: true,
    checkRecipient: true,
    verdict: 'amount_differs',
    transactionId: 'IP-20261013-5431',
    rawText: 'تحويل 400 ج.م',
  });

  // 3. Reminders today (unpaid, due soon or today or promised): 5 more to reach 7 total
  await createInv(db, bId, charges[0].id, c[7].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-18'); // Sara (before 3 days)
  await createInv(db, bId, charges[0].id, c[8].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-15'); // Islam (on due date)
  await createInv(db, bId, charges[0].id, c[9].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-15'); // Nourhan (on due date)
  await createInv(db, bId, charges[0].id, c[10].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-20', '2026-10-15'); // Yasmine (promised today)
  await createInv(db, bId, charges[0].id, c[11].id, '2026-10', 'اشتراك أكتوبر', 450, '2026-10-18'); // Mona (before 3 days)
  await createInv(db, bId, charges[0].id, c[12].id, '2026-10', 'اشتراك أكتوبر', 1800, '2026-10-18'); // Heba (before 3 days, multi)

  // 4. Paid invoices: exactly 23,400 EGP collected so far in October
  const paidAmounts = [4500, 4500, 4500, 4500, 2700, 2700];
  const paidCusts = [c[13].id, c[14].id, c[15].id, c[16].id, c[17].id, c[18].id];
  for (let i = 0; i < paidAmounts.length; i++) {
    const inv = await createInv(db, bId, charges[0].id, paidCusts[i], '2026-10', 'اشتراك أكتوبر', paidAmounts[i], '2026-10-05');
    await db.invoice.update({ where: { id: inv.id }, data: { paidAt: fromIsoDate('2026-10-04') } });
    await db.payment.create({
      data: { invoiceId: inv.id, amount: paidAmounts[i], method: i % 2 === 0 ? 'instapay' : 'cash', recordedAt: new Date() },
    });
  }
}

export async function seedSeptemberInvoices(db: DB, bId: string, chId: string, c: { id: string }[]): Promise<void> {
  // Last month collected: 19,800 EGP
  const amounts = [3300, 3300, 3300, 3300, 3300, 3300];
  for (let i = 0; i < amounts.length; i++) {
    const inv = await createInv(db, bId, chId, c[i].id, '2026-09', 'اشتراك سبتمبر 2026', amounts[i], '2026-09-05');
    await db.invoice.update({ where: { id: inv.id }, data: { paidAt: fromIsoDate('2026-09-04') } });
    await db.payment.create({
      data: { invoiceId: inv.id, amount: amounts[i], method: 'instapay', recordedAt: fromIsoDate('2026-09-04') },
    });
  }
}

async function createInv(db: DB, b: string, ch: string, cu: string, p: string | null, t: string, a: number, due: string, prom?: string) {
  return db.invoice.create({
    data: {
      businessId: b,
      chargeId: ch,
      customerId: cu,
      period: p,
      title: t,
      amount: a,
      dueDate: fromIsoDate(due),
      promisedDate: prom ? fromIsoDate(prom) : null,
      publicToken: generatePublicToken(),
    },
  });
}

interface SeedClaimData {
  screenshotKey: string;
  extractedAmount: number;
  checkAmount: boolean;
  checkDate: boolean;
  checkRecipient: boolean;
  verdict: 'all_match' | 'amount_differs' | 'duplicate';
  transactionId?: string;
  rawText: string;
}

async function createWithClaim(
  db: DB,
  b: string,
  ch: string,
  cu: string,
  p: string | null,
  t: string,
  a: number,
  due: string,
  claim: SeedClaimData,
) {
  const inv = await createInv(db, b, ch, cu, p, t, a, due);
  await db.paymentClaim.create({
    data: { invoiceId: inv.id, status: 'pending', recipient: 'nogoum.academy@instapay', extractedDate: fromIsoDate(due), ...claim },
  });
}
