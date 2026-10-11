import { Injectable } from '@nestjs/common';
import { type ChargeInput, type ChargeUpdate, periodOf } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
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
    return this.charges.update(id, patch);
  }

  private async resolveCustomers(businessId: string, input: ChargeInput): Promise<string[]> {
    if (input.assignTo === 'all') {
      const ids = await this.charges.activeCustomerIds(businessId);
      if (ids.length === 0) throw fieldError('assignTo', 'noCustomers');
      return ids;
    }
    const wanted = [...new Set(input.customerIds ?? [])];
    if (wanted.length === 0) throw fieldError('customerIds', 'required');
    const found = await this.charges.activeCustomerIds(businessId, wanted);
    if (found.length !== wanted.length) throw fieldError('customerIds', 'unknownCustomer');
    return wanted;
  }
}
