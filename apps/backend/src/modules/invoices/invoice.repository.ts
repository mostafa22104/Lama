import { Injectable } from '@nestjs/common';
import { periodRange } from '@lamma/shared';
import { fromIsoDate, toIsoDate } from '../../common/dates/date-codec.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { INVOICE_SELECT, type InvoiceRecord } from './invoice-record.js';
import type { ChargeTerms, InvoiceRow } from './invoice-rows.js';

/** Keeps one INSERT well under Postgres' 65,535 bind-parameter limit. */
const CREATE_CHUNK_SIZE = 2000;

export interface GenerationCharge extends ChargeTerms {
  id: string;
  billingFrom: Date;
  customerIds: string[];
}

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMonthlyCharges(businessId: string): Promise<GenerationCharge[]> {
    const charges = await this.prisma.charge.findMany({
      where: { businessId, kind: 'monthly', active: true },
      select: {
        id: true, kind: true, title: true, amount: true, dayOfMonth: true, dueDate: true, billingFrom: true,
        assignments: { where: { customer: { archivedAt: null } }, select: { customerId: true } },
      },
    });
    return charges.map(({ assignments, dueDate, ...charge }) => ({
      ...charge,
      dueDate: dueDate ? toIsoDate(dueDate) : null,
      customerIds: assignments.map((a) => a.customerId),
    }));
  }

  async existingKeys(chargeIds: string[], periods: string[]): Promise<Set<string>> {
    const rows = await this.prisma.invoice.findMany({
      where: { chargeId: { in: chargeIds }, period: { in: periods } },
      select: { chargeId: true, customerId: true, period: true },
    });
    return new Set(rows.map((r) => `${r.chargeId}|${r.customerId}|${r.period}`));
  }

  async createMissing(businessId: string, rows: (InvoiceRow & { chargeId: string })[]): Promise<void> {
    for (let start = 0; start < rows.length; start += CREATE_CHUNK_SIZE) {
      await this.prisma.invoice.createMany({
        data: rows.slice(start, start + CREATE_CHUNK_SIZE).map((row) => ({ ...row, businessId })),
        skipDuplicates: true,
      });
    }
  }

  findOpen(businessId: string): Promise<InvoiceRecord[]> {
    return this.prisma.invoice.findMany({
      where: { businessId, paidAt: null, customer: { archivedAt: null } },
      select: INVOICE_SELECT,
      orderBy: { dueDate: 'asc' },
    });
  }

  async invoicedCustomerIds(businessId: string): Promise<Set<string>> {
    const rows = await this.prisma.invoice.findMany({
      where: { businessId },
      distinct: ['customerId'],
      select: { customerId: true },
    });
    return new Set(rows.map((row) => row.customerId));
  }

  findForCustomer(businessId: string, customerId: string): Promise<InvoiceRecord[]> {
    return this.prisma.invoice.findMany({
      where: { businessId, customerId },
      select: INVOICE_SELECT,
      orderBy: { dueDate: 'desc' },
    });
  }

  findOwned(businessId: string, id: string): Promise<InvoiceRecord | null> {
    return this.prisma.invoice.findFirst({ where: { id, businessId, customer: { archivedAt: null } }, select: INVOICE_SELECT });
  }

  /** Pays the invoice in one transaction; only the first caller wins. */
  markPaidInCash(businessId: string, id: string, now: Date): Promise<InvoiceRecord | 'not_found' | 'already_paid'> {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, businessId, customer: { archivedAt: null } },
        select: { amount: true } });
      if (!invoice) return 'not_found';
      const { count } = await tx.invoice.updateMany({ where: { id, paidAt: null }, data: { paidAt: now } });
      if (count === 0) return 'already_paid';
      await tx.payment.create({ data: { invoiceId: id, amount: invoice.amount, method: 'cash', recordedAt: now } });
      return tx.invoice.findUniqueOrThrow({ where: { id }, select: INVOICE_SELECT });
    });
  }

  findForPeriod(businessId: string, period: string): Promise<{ amount: number; paidAt: Date | null }[]> {
    const { start, end } = periodRange(period);
    return this.prisma.invoice.findMany({
      where: {
        businessId,
        customer: { archivedAt: null },
        OR: [{ period }, { period: null, dueDate: { gte: fromIsoDate(start), lte: fromIsoDate(end) } }],
      },
      select: { amount: true, paidAt: true },
    });
  }
}
