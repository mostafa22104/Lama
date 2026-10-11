import { Injectable } from '@nestjs/common';
import { type MonthlyTerms, toWesternDigits } from '@lamma/shared';
import type { Customer, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { CustomerRow } from './customer-input.js';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(businessId: string): Promise<number> {
    return this.prisma.customer.count({ where: { businessId, archivedAt: null } });
  }

  createMany(businessId: string, rows: CustomerRow[], createdAt: Date): Promise<Customer[]> {
    return this.prisma.customer.createManyAndReturn({
      data: rows.map((row) => ({ ...row, businessId, createdAt })),
    });
  }

  findOwned(businessId: string, id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, businessId, archivedAt: null } });
  }

  findActive(businessId: string, search?: string): Promise<Customer[]> {
    const where: Prisma.CustomerWhereInput = { businessId, archivedAt: null };
    if (search) {
      const digits = toWesternDigits(search).replace(/\D/g, '').replace(/^0+/, '');
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      ];
    }
    return this.prisma.customer.findMany({ where });
  }

  async activeMonthlyTerms(customerId: string): Promise<MonthlyTerms[]> {
    const rows = await this.prisma.chargeAssignment.findMany({
      where: { customerId, charge: { kind: 'monthly', active: true } },
      select: { charge: { select: { amount: true, dayOfMonth: true } } },
    });
    return rows.flatMap(({ charge }) =>
      charge.dayOfMonth === null ? [] : [{ amount: charge.amount, dayOfMonth: charge.dayOfMonth }],
    );
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async archive(id: string, at: Date): Promise<void> {
    await this.prisma.customer.update({ where: { id }, data: { archivedAt: at } });
  }
}
