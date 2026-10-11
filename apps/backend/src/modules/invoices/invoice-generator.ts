import { Injectable } from '@nestjs/common';
import { type IsoDate, periodOf, periodsBetween, toBusinessDate } from '@lamma/shared';
import { buildInvoiceRows } from './invoice-rows.js';
import { InvoiceRepository } from './invoice.repository.js';

const MAX_CATCH_UP_PERIODS = 24;

const keyOf = (chargeId: string, customerId: string, period: string) => `${chargeId}|${customerId}|${period}`;

/** Lazily creates every missing monthly invoice up to today's month. Safe to call on every read. */
@Injectable()
export class InvoiceGenerator {
  constructor(private readonly invoices: InvoiceRepository) {}

  async ensureUpToDate(businessId: string, today: IsoDate): Promise<void> {
    const charges = await this.invoices.findActiveMonthlyCharges(businessId);
    const currentPeriod = periodOf(today);
    const planned = charges.map((charge) => {
      const first = periodOf(toBusinessDate(charge.billingFrom));
      return { charge, periods: periodsBetween(first, currentPeriod).slice(-MAX_CATCH_UP_PERIODS) };
    });
    const allPeriods = [...new Set(planned.flatMap((p) => p.periods))];
    if (allPeriods.length === 0 || charges.length === 0) return;

    const existing = await this.invoices.existingKeys(charges.map((c) => c.id), allPeriods);
    const missing = planned.flatMap(({ charge, periods }) =>
      periods.flatMap((period) =>
        charge.customerIds
          .filter((customerId) => !existing.has(keyOf(charge.id, customerId, period)))
          .flatMap((customerId) =>
            buildInvoiceRows(charge, [customerId], [period]).map((row) => ({ ...row, chargeId: charge.id })),
          ),
      ),
    );
    if (missing.length > 0) await this.invoices.createMissing(businessId, missing);
  }
}
