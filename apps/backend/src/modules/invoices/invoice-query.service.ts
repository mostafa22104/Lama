import { Injectable } from '@nestjs/common';
import type { InvoiceSummaryDto, IsoDate } from '@lamma/shared';
import { InvoiceGenerator } from './invoice-generator.js';
import { type OpenInvoice, toInvoiceSummary, toOpenInvoice } from './invoice-record.js';
import { InvoiceRepository } from './invoice.repository.js';

@Injectable()
export class InvoiceQueryService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly generator: InvoiceGenerator,
  ) {}

  /** Creates any missing monthly invoices; call before reading invoices another way. */
  refresh(businessId: string, today: IsoDate): Promise<void> {
    return this.generator.ensureUpToDate(businessId, today);
  }

  /** Unpaid invoices of active customers, oldest due first. Generates missing months first. */
  async openInvoices(businessId: string, today: IsoDate): Promise<OpenInvoice[]> {
    await this.generator.ensureUpToDate(businessId, today);
    return (await this.invoices.findOpen(businessId)).map((record) => toOpenInvoice(record, today));
  }

  invoicedCustomerIds(businessId: string): Promise<Set<string>> {
    return this.invoices.invoicedCustomerIds(businessId);
  }

  /** Every invoice of one customer, newest due first. */
  async customerInvoices(businessId: string, customerId: string, today: IsoDate): Promise<InvoiceSummaryDto[]> {
    await this.generator.ensureUpToDate(businessId, today);
    return (await this.invoices.findForCustomer(businessId, customerId)).map((r) => toInvoiceSummary(r, today));
  }

  async findOne(businessId: string, invoiceId: string, today: IsoDate): Promise<OpenInvoice | null> {
    const record = await this.invoices.findOwned(businessId, invoiceId);
    return record ? toOpenInvoice(record, today) : null;
  }

  async periodSummary(
    businessId: string,
    period: string,
    today: IsoDate,
  ): Promise<{ expected: number; collected: number; invoiceCount: number; paidCount: number }> {
    await this.generator.ensureUpToDate(businessId, today);
    const rows = await this.invoices.findForPeriod(businessId, period);
    const paid = rows.filter((row) => row.paidAt !== null);
    return {
      expected: rows.reduce((sum, row) => sum + row.amount, 0),
      collected: paid.reduce((sum, row) => sum + row.amount, 0),
      invoiceCount: rows.length,
      paidCount: paid.length,
    };
  }
}
