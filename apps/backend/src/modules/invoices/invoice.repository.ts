import { Injectable } from '@nestjs/common';
import { toIsoDate } from '../../common/dates/date-codec.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { ChargeTerms, InvoiceRow } from './invoice-rows.js';

export interface GenerationCharge extends ChargeTerms {
  id: string;
  createdAt: Date;
  customerIds: string[];
}

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMonthlyCharges(businessId: string): Promise<GenerationCharge[]> {
    const charges = await this.prisma.charge.findMany({
      where: { businessId, kind: 'monthly', active: true },
      select: {
        id: true, kind: true, title: true, amount: true, dayOfMonth: true, dueDate: true, createdAt: true,
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
    await this.prisma.invoice.createMany({
      data: rows.map((row) => ({ ...row, businessId })),
      skipDuplicates: true,
    });
  }
}
