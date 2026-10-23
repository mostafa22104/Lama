import { Injectable } from '@nestjs/common';
import { type ChargeInput, type ChargeUpdate, periodOf } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday, toIsoDate } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { fieldError } from '../../common/errors/field-error.js';
import { buildInvoiceRows } from '../invoices/index.js';
import { toChargeTerms } from './charge-terms.js';
import { ChargesRepository, type ChargeWithCount } from './charges.repository.js';

@Injectable()
export class ChargesService {
  constructor(
    private readonly charges: ChargesRepository,
    private readonly clock: Clock,
  ) {}

  async create(businessId: string, input: ChargeInput): Promise<ChargeWithCount> {
    const terms = toChargeTerms(input);
    const customerIds = await this.resolveCustomers(businessId, input);
    const now = this.clock.now();
    const invoices = buildInvoiceRows(terms, customerIds, [periodOf(businessToday(now))]);
    return this.charges.createWithInvoices(businessId, terms, customerIds, invoices, now);
  }

  list(businessId: string): Promise<ChargeWithCount[]> {
    return this.charges.list(businessId);
  }

  async update(businessId: string, id: string, patch: ChargeUpdate): Promise<ChargeWithCount> {
    const charge = await this.charges.findOwned(businessId, id);
    if (!charge) throw new AppError('NOT_FOUND', 'Charge not found');
    const resumed = patch.active === true && !charge.active;
    return this.charges.update(id, resumed ? { ...patch, billingFrom: this.clock.now() } : patch);
  }

  async assignCustomers(businessId: string, chargeId: string, customerIds: string[]): Promise<ChargeWithCount> {
    const charge = await this.charges.findOwned(businessId, chargeId);
    if (!charge) throw new AppError('NOT_FOUND', 'Charge not found');
    const validIds = await this.charges.activeCustomerIds(businessId, customerIds);
    const now = this.clock.now();
    const terms = toChargeTerms({
      kind: charge.kind,
      title: charge.title,
      amount: charge.amount,
      dayOfMonth: charge.dayOfMonth ?? undefined,
      dueDate: charge.dueDate ? toIsoDate(charge.dueDate) : undefined,
      assignTo: 'selected',
    });
    return this.charges.assignCustomers(chargeId, businessId, validIds, terms, now);
  }

  async getAssignedCustomerIds(businessId: string, chargeId: string): Promise<string[]> {
    const charge = await this.charges.findOwned(businessId, chargeId);
    if (!charge) throw new AppError('NOT_FOUND', 'Charge not found');
    return this.charges.assignedCustomerIds(chargeId);
  }

  private async resolveCustomers(businessId: string, input: ChargeInput): Promise<string[]> {
    if (input.assignTo === 'all') {
      return this.charges.activeCustomerIds(businessId);
    }
    const wanted = [...new Set(input.customerIds ?? [])];
    if (wanted.length === 0) return [];
    const found = await this.charges.activeCustomerIds(businessId, wanted);
    if (found.length !== wanted.length) throw fieldError('customerIds', 'unknownCustomer');
    return wanted;
  }
}

