import type { TranslationShape } from '../translation.js';
import type { arCustomers } from '../ar/customers.js';

export const enCustomers: TranslationShape<typeof arCustomers> = {
  title: 'Customers',
  customerCount: '{{count}} customers',
  addCustomer: 'Add',
  searchPlaceholder: 'Search name or phone',
  searchA11y: 'Search customer',
  filters: {
    all: 'All',
    overdue: 'Overdue',
    dueSoon: 'Due soon',
    awaiting: 'Awaiting',
    paid: 'Paid',
  },
  emptySearch: 'No customers found',
  emptyList: 'No customers yet',
  profileTitle: 'Customer profile',
  balanceDue: 'Current balance',
  daysOverdue: '{{days}} days overdue',
  nextDueCard: 'Next due: {{date}} · {{amount}}',
  sendReminder: 'Send reminder',
  edit: 'Edit',
  recordCash: 'Paid cash? Record here',
  cashRecordedSuccess: 'Cash payment recorded ✅',
  historyTitle: 'History',
  history: {
    created: 'Added to Lamma',
    reminderSent: 'WhatsApp reminder sent',
    paidCash: 'Paid {{title}} in cash',
    paidProof: 'Paid {{title}}',
    confirmedProof: 'Confirmed via transfer receipt',
  },
};
