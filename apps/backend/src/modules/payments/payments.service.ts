import { Injectable } from '@nestjs/common';
import type { PaymentClaimItemDto } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import { PaymentsRepository } from './payments.repository.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly clock: Clock,
  ) {}

  async listClaims(businessId: string): Promise<PaymentClaimItemDto[]> {
    const records = await this.repo.findPendingClaims(businessId);
    return records.map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      customerId: r.invoice.customer.id,
      customerName: r.invoice.customer.name,
      customerPhone: r.invoice.customer.phone,
      chargeTitle: r.invoice.charge.title,
      invoiceAmount: r.invoice.amount,
      extractedAmount: r.extractedAmount,
      extractedDate: r.extractedDate ? r.extractedDate.toISOString().slice(0, 10) : null,
      transactionId: r.transactionId,
      recipient: r.recipient,
      rawText: r.rawText,
      checkAmount: r.checkAmount,
      checkDate: r.checkDate,
      checkRecipient: r.checkRecipient,
      duplicateOfClaimId: r.duplicateOfClaimId,
      verdict: r.verdict,
      createdAt: r.createdAt.toISOString(),
      screenshotKey: r.screenshotKey,
    }));
  }

  async confirm(businessId: string, claimId: string): Promise<{ success: true }> {
    const result = await this.repo.confirmClaim(businessId, claimId, this.clock.now());
    if (result === 'not_found') throw new AppError('NOT_FOUND', 'Claim not found');
    if (result === 'already_decided') throw new AppError('INVOICE_ALREADY_PAID', 'Claim already decided');
    return { success: true };
  }

  async reject(businessId: string, claimId: string): Promise<{ success: true }> {
    const result = await this.repo.rejectClaim(businessId, claimId, this.clock.now());
    if (result === 'not_found') throw new AppError('NOT_FOUND', 'Claim not found');
    if (result === 'already_decided') throw new AppError('INVOICE_ALREADY_PAID', 'Claim already decided');
    return { success: true };
  }

  async undo(businessId: string, claimId: string): Promise<{ success: true }> {
    const result = await this.repo.undoClaim(businessId, claimId);
    if (result === 'not_found') throw new AppError('NOT_FOUND', 'Claim not found');
    return { success: true };
  }
}
