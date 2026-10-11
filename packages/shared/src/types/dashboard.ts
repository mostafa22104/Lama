import type { CustomerListItemDto } from './customers.js';

export interface HomeDashboardDto {
  businessName: string;
  period: string;
  expected: number;
  collected: number;
  remaining: number;
  collectedPercent: number;
  overdue: { amount: number; customerCount: number };
  awaitingConfirmationCount: number;
  todayReminders: { total: number; sentCount: number; preview: { customerName: string }[] };
  overdueCustomers: CustomerListItemDto[];
}

export interface MonthlyReportDto {
  period: string;
  expected: number;
  collected: number;
  previousCollected: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  stillLate: CustomerListItemDto[];
}
