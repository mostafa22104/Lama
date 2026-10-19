import type { TranslationShape } from '../translation.js';
import type { arReports } from '../ar/reports.js';

export const enReports: TranslationShape<typeof arReports> = {
  title: 'Monthly Report',
  prevMonthA11y: 'Previous month',
  nextMonthA11y: 'Next month',
  heroWeCollected: 'Collected for you',
  thisMonth: 'this month',
  heroProgressSubtitle: '{{percent}}% of {{expected}} expected',
  vsLastMonth: 'Compared to last month',
  diffPositive: '+{{amount}}',
  diffNegative: '-{{amount}}',
  paidCardTitle: 'Paid',
  paidCardValue: '{{paid}} of {{total}}',
  stillLateTitle: 'Still late',
  stillLateCount: '{{count}} customers',
  remindThemWhatsApp: 'Remind on WhatsApp',
  downloadExcel: 'Download Excel report',
  exportSuccess: 'Report exported',
};
