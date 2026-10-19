import type { arReminders } from '../ar/reminders.js';
import type { TranslationShape } from '../translation.js';

export const enReminders: TranslationShape<typeof arReminders> = {
  greeting: { female: 'Hi {name},', male: 'Hi {name},', neutral: 'Hi {name},' },
  before: '{title} at {business} ({amount} {currency}) is due in {days}.',
  onDue: '{title} at {business} ({amount} {currency}) is due today.',
  after: '{title} ({amount} {currency}) is {days} overdue.',
  payCta: { female: 'Pay here in a minute:', male: 'Pay here in a minute:', neutral: 'Pay here in a minute:' },
  onDueCta: { female: 'Pay here:', male: 'Pay here:', neutral: 'Pay here:' },
  proofCta: {
    female: 'Already paid? Send the transfer screenshot here:',
    male: 'Already paid? Send the transfer screenshot here:',
    neutral: 'Already paid? Send the transfer screenshot here:',
  },
  days: { one: '1 day', two: '2 days', few: '{n} days', many: '{n} days' },
  screenTitle: "Today's Reminders",
  sentProgress: 'Sent {{sent}} of {{total}}',
  allDone: 'Done for today',
  remaining: '{{count}} remaining',
  sendAll: 'Send all',
  sendOnWhatsApp: 'Send on WhatsApp',
  sent: 'Sent',
  howCustomerSeesIt: 'See how the customer receives it',
  emptyReminders: 'No reminders needed today 🎉',
};
