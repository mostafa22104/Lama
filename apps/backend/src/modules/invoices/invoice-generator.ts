import { Injectable } from '@nestjs/common';
import { type IsoDate, periodOf, periodsBetween, toBusinessDate } from '@lamma/shared';
import { buildInvoiceRows } from './invoice-rows.js';
import { InvoiceRepository } from './invoice.repository.js';

const MAX_CATCH_UP_PERIODS = 24;

const keyOf = (row: { chargeId: string; customerId: string; period: string | null }) =>
  `${row.chargeId}|${row.customerId}|${row.period}`;

/** Lazily creates every missing monthly invoice up to today's month. Safe to call on every read. */
@Injectable()
export class InvoiceGenerator {
  constructor(private readonly invoices: InvoiceRepository) {}

  async ensureUpToDate(businessId: string, today: IsoDate): Promise<void> {
    const charges = await this.invoices.findActiveMonthlyCharges(businessId);
    const currentPeriod = periodOf(today);
    const candidates = charges.flatMap((charge) => {
      const first = periodOf(toBusinessDate(charge.createdAt));
      const periods = periodsBetween(first, currentPeriod).slice(-MAX_CATCH_UP_PERIODS);
      return buildInvoiceRows(charge, charge.customerIds, periods).map((row) => ({ ...row, chargeId: charge.id }));
    });
    if (candidates.length === 0) return;

    const periods = [...new Set(candidates.map((row) => row.period ?? ''))];
    const existing = await this.invoices.existingKeys(charges.map((c) => c.id), periods);
    const missing = candidates.filter((row) => !existing.has(keyOf(row)));
    if (missing.length > 0) await this.invoices.createMissing(businessId, missing);
  }
}
