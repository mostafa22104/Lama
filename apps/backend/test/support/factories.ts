import type { Business, Charge, Customer, Invoice, PaymentClaim, Prisma } from '../../src/generated/prisma/client.js';
import type { PrismaService } from '../../src/infra/prisma/prisma.service.js';

export function createBusiness(
  prisma: PrismaService,
  overrides: Partial<Prisma.BusinessCreateInput> = {},
): Promise<Business> {
  return prisma.business.create({
    data: {
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      ...overrides,
    },
  });
}

export function createCustomer(
  prisma: PrismaService,
  businessId: string,
  overrides: Partial<Prisma.CustomerUncheckedCreateInput> = {},
): Promise<Customer> {
  return prisma.customer.create({
    data: { businessId, name: 'محمود حسن', phone: '+201023456781', ...overrides },
  });
}

/** One-time by default so the monthly generator never adds invoices behind a test's back. */
export function createCharge(
  prisma: PrismaService,
  businessId: string,
  customerIds: string[],
  overrides: Partial<Prisma.ChargeUncheckedCreateInput> = {},
): Promise<Charge> {
  return prisma.charge.create({
    data: {
      businessId,
      kind: 'one_time',
      title: 'اشتراك',
      amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      createdAt: new Date('2026-09-01T09:00:00.000Z'),
      ...overrides,
      assignments: { createMany: { data: customerIds.map((customerId) => ({ customerId })) } },
    },
  });
}

let tokenCounter = 0;

export function createInvoice(
  prisma: PrismaService,
  input: { businessId: string; chargeId: string; customerId: string } & Partial<Prisma.InvoiceUncheckedCreateInput>,
): Promise<Invoice> {
  tokenCounter += 1;
  return prisma.invoice.create({
    data: {
      title: 'اشتراك',
      period: null,
      amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      publicToken: `test-token-${tokenCounter}-${Date.now()}`,
      ...input,
    },
  });
}

export function createPendingClaim(prisma: PrismaService, invoiceId: string): Promise<PaymentClaim> {
  return prisma.paymentClaim.create({
    data: {
      invoiceId,
      screenshotKey: 'test/screenshot.png',
      rawText: '',
      checkAmount: true,
      checkDate: true,
      checkRecipient: true,
      verdict: 'all_match',
    },
  });
}
