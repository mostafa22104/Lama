import { Injectable } from '@nestjs/common';
import type { ChargeUpdate } from '@lamma/shared';
import { fromIsoDate } from '../../common/dates/date-codec.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { ChargeTerms, InvoiceRow } from '../invoices/index.js';

const WITH_COUNT = { _count: { select: { assignments: true } } } as const;
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

  update(id: string, data: ChargeUpdate): Promise<ChargeWithCount> {
    return this.prisma.charge.update({ where: { id }, data, include: WITH_COUNT });
  }
}
