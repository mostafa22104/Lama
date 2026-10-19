export type ClaimVerdict =
  | 'all_match'
  | 'amount_differs'
  | 'duplicate'
  | 'unreadable'
  | 'needs_review';

export interface PaymentClaimItemDto {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  chargeTitle: string;
  invoiceAmount: number;
  extractedAmount: number | null;
  extractedDate: string | null;
  transactionId: string | null;
  recipient: string | null;
  rawText: string;
  checkAmount: boolean;
  checkDate: boolean;
  checkRecipient: boolean;
  duplicateOfClaimId: string | null;
  verdict: ClaimVerdict;
  createdAt: string;
  screenshotKey: string;
}
