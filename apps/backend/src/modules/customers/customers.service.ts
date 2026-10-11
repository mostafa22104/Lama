import { Injectable } from '@nestjs/common';
import { canAddCustomers, type CustomerInput, type CustomerUpdate, PLAN_LIMITS } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Customer } from '../../generated/prisma/client.js';
import { BusinessService } from '../business/index.js';
import { normalizeCustomerPhone, toCustomerRow } from './customer-input.js';
import { CustomersRepository } from './customers.repository.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly businesses: BusinessService,
    private readonly clock: Clock,
  ) {}

  async create(businessId: string, input: CustomerInput): Promise<Customer> {
    const [created] = await this.createRows(businessId, [toCustomerRow(input)]);
    return created;
  }

  createMany(businessId: string, inputs: CustomerInput[]): Promise<Customer[]> {
    return this.createRows(businessId, inputs.map((input, index) => toCustomerRow(input, index)));
  }

  async update(businessId: string, id: string, patch: CustomerUpdate): Promise<Customer> {
    await this.getOwned(businessId, id);
    const { phone, ...rest } = patch;
    return this.customers.update(id, phone === undefined ? rest : { ...rest, phone: normalizeCustomerPhone(phone) });
  }

  async archive(businessId: string, id: string): Promise<void> {
    await this.getOwned(businessId, id);
    await this.customers.archive(id, this.clock.now());
  }

  async getOwned(businessId: string, id: string): Promise<Customer> {
    const customer = await this.customers.findOwned(businessId, id);
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found');
    return customer;
  }

  private async createRows(businessId: string, rows: ReturnType<typeof toCustomerRow>[]): Promise<Customer[]> {
    const business = await this.businesses.getById(businessId);
    const current = await this.customers.countActive(businessId);
    if (!canAddCustomers(business.plan, current, rows.length)) {
      const max = PLAN_LIMITS[business.plan].maxCustomers;
      throw new AppError('PLAN_LIMIT_REACHED', 'Plan customer limit reached', { max, current });
    }
    return this.customers.createMany(businessId, rows, this.clock.now());
  }
}
