import { Injectable } from '@nestjs/common';
import {
  canAddCustomers,
  type CustomerDetailDto,
  type CustomerInput,
  type CustomerListItemDto,
  type CustomerUpdate,
  type InvoiceStatus,
  type InvoiceSummaryDto,
  nextMonthlyDue,
  PLAN_LIMITS,
  statusPriority,
} from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Customer } from '../../generated/prisma/client.js';
import { BusinessService } from '../business/index.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { normalizeCustomerPhone, toCustomerRow } from './customer-input.js';
import { buildCustomerListItem } from './customer-summary.js';
import { toCustomerDto } from './customer.mapper.js';
import { CustomersRepository } from './customers.repository.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly businesses: BusinessService,
    private readonly clock: Clock,
    private readonly invoices: InvoiceQueryService,
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

  async list(businessId: string, query: { search?: string; status?: InvoiceStatus }): Promise<CustomerListItemDto[]> {
    const today = businessToday(this.clock.now());
    const open = await this.invoices.openInvoices(businessId, today);
    const invoiced = await this.invoices.invoicedCustomerIds(businessId);
    const customers = await this.customers.findActive(businessId, query.search);

    const openByCustomer = new Map<string, InvoiceSummaryDto[]>();
    for (const { summary } of open) {
      openByCustomer.set(summary.customerId, [...(openByCustomer.get(summary.customerId) ?? []), summary]);
    }
    const items = customers.map((customer) =>
      buildCustomerListItem(toCustomerDto(customer), openByCustomer.get(customer.id) ?? [], invoiced.has(customer.id)),
    );
    const rank = (status: InvoiceStatus | null) => (status ? statusPriority(status) : Number.MAX_SAFE_INTEGER);
    return items
      .filter((item) => !query.status || item.status === query.status)
      .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name, 'ar'));
  }

  async detail(businessId: string, id: string): Promise<CustomerDetailDto> {
    const customer = await this.getOwned(businessId, id);
    const today = businessToday(this.clock.now());
    const invoices = await this.invoices.customerInvoices(businessId, id, today);
    const open = invoices.filter((invoice) => invoice.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return {
      ...buildCustomerListItem(toCustomerDto(customer), open, invoices.length > 0),
      openInvoices: open,
      nextDue: nextMonthlyDue(await this.customers.activeMonthlyTerms(id), today),
    };
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
