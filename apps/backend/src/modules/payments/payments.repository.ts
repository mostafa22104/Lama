import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPendingClaims(businessId: string) {
    return this.prisma.paymentClaim.findMany({
      where: {
        status: 'pending',
        invoice: { businessId, customer: { archivedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            amount: true,
            customer: { select: { id: true, name: true, phone: true } },
            charge: { select: { title: true } },
          },
        },
      },
    });
  }

  confirmClaim(businessId: string, claimId: string, now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.paymentClaim.findFirst({
        where: { id: claimId, invoice: { businessId } },
        include: { invoice: true },
      });
      if (!claim) return 'not_found' as const;
      if (claim.status !== 'pending') return 'already_decided' as const;

      await tx.paymentClaim.update({
        where: { id: claimId },
        data: { status: 'confirmed', decidedAt: now },
      });
      await tx.invoice.update({
        where: { id: claim.invoiceId },
        data: { paidAt: now },
      });
      await tx.payment.create({
        data: {
          invoiceId: claim.invoiceId,
          amount: claim.extractedAmount ?? claim.invoice.amount,
          method: 'instapay',
          claimId: claim.id,
          recordedAt: now,
        },
      });
      return 'ok' as const;
    });
  }

  async rejectClaim(businessId: string, claimId: string, now: Date) {
    const claim = await this.prisma.paymentClaim.findFirst({
      where: { id: claimId, invoice: { businessId } },
    });
    if (!claim) return 'not_found' as const;
    if (claim.status !== 'pending') return 'already_decided' as const;

    await this.prisma.paymentClaim.update({
      where: { id: claimId },
      data: { status: 'rejected', decidedAt: now },
    });
    return 'ok' as const;
  }

  undoClaim(businessId: string, claimId: string) {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.paymentClaim.findFirst({
        where: { id: claimId, invoice: { businessId } },
      });
      if (!claim) return 'not_found' as const;

      await tx.payment.deleteMany({ where: { claimId } });
      await tx.invoice.update({
        where: { id: claim.invoiceId },
        data: { paidAt: null },
      });
      await tx.paymentClaim.update({
        where: { id: claimId },
        data: { status: 'pending', decidedAt: null },
      });
      return 'ok' as const;
    });
  }
}
