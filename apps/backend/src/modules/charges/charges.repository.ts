import { Injectable } from '@nestjs/common';
import { type ChargeUpdate, periodOf } from '@lamma/shared';
import { businessToday, fromIsoDate } from '../../common/dates/date-codec.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { type ChargeTerms, type InvoiceRow, buildInvoiceRows } from '../invoices/index.js';


const WITH_COUNT = {
  _count: { select: { assignments: { where: { customer: { archivedAt: null } } } } },
} as const;
export type ChargeWithCount = Prisma.ChargeGetPayload<{ include: typeof WITH_COUNT }>;

@Injectable()
export class ChargesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async activeCustomerIds(businessId: string, onlyIds?: string[]): Promise<string[]> {
    const rows = await this.prisma.customer.findMany({
      where: { businessId, archivedAt: null, ...(onlyIds ? { id: { in: onlyIds } } : {}) },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  /** Charge, assignments and first invoices in one atomic write. */
  createWithInvoices(
    businessId: string,
    terms: ChargeTerms,
    customerIds: string[],
    invoices: InvoiceRow[],
    createdAt: Date,
  ): Promise<ChargeWithCount> {
    return this.prisma.charge.create({
      data: {
        businessId,
        kind: terms.kind,
        title: terms.title,
        amount: terms.amount,
        dayOfMonth: terms.dayOfMonth,
        dueDate: terms.dueDate ? fromIsoDate(terms.dueDate) : null,
        createdAt,
        billingFrom: terms.startDate ? fromIsoDate(terms.startDate) : createdAt,
        assignments: { createMany: { data: customerIds.map((customerId) => ({ customerId })) } },
        invoices: { createMany: { data: invoices.map((row) => ({ ...row, businessId })) } },
      },
      include: WITH_COUNT,
    });
  }

  list(businessId: string): Promise<ChargeWithCount[]> {
    return this.prisma.charge.findMany({
      where: { businessId },
      include: WITH_COUNT,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOwned(businessId: string, id: string): Promise<ChargeWithCount | null> {
    return this.prisma.charge.findFirst({ where: { id, businessId }, include: WITH_COUNT });
  }

  update(id: string, data: ChargeUpdate & { billingFrom?: Date }): Promise<ChargeWithCount> {
    return this.prisma.charge.update({ where: { id }, data, include: WITH_COUNT });
  }

  async assignedCustomerIds(chargeId: string): Promise<string[]> {
    const rows = await this.prisma.chargeAssignment.findMany({
      where: { chargeId, customer: { archivedAt: null } },
      select: { customerId: true },
    });
    return rows.map((r) => r.customerId);
  }

  async assignCustomers(
    chargeId: string,
    businessId: string,
    customerIds: string[],
    terms: ChargeTerms,
    now: Date,
  ): Promise<ChargeWithCount> {
    const existing = await this.prisma.chargeAssignment.findMany({
      where: { chargeId, customerId: { in: customerIds } },
      select: { customerId: true },
    });
    const existingSet = new Set(existing.map((e) => e.customerId));
    const newIds = customerIds.filter((id) => !existingSet.has(id));
    if (newIds.length > 0) {
      const invoices = buildInvoiceRows(terms, newIds, [periodOf(businessToday(now))]);
      await this.prisma.$transaction([
        this.prisma.chargeAssignment.createMany({
          data: newIds.map((customerId) => ({ chargeId, customerId })),
          skipDuplicates: true,
        }),
        this.prisma.invoice.createMany({
          data: invoices.map((row: InvoiceRow) => ({ ...row, businessId, chargeId })),
        }),


      ]);
    }
    return (await this.findOwned(businessId, chargeId))!;
  }
}

