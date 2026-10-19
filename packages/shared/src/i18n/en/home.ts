import type { TranslationShape } from '../translation.js';
import type { arHome } from '../ar/home.js';

export const enHome: TranslationShape<typeof arHome> = {
  greeting: 'Good morning',
  settingsA11y: 'Settings',
  collectedIn: 'Collected in {{month}}',
  reportLink: 'Report',
  ofExpected: 'of {{expected}}',
  remainingText: '{{amount}} remaining',
  overdueTitle: 'Overdue',
  customersCount: '{{count}} customers',
  awaitingTitle: 'Awaiting you',
  transferScreenshots: 'transfer receipts',
  remindersToday: "Today's reminders ({{count}})",
  sendAll: 'Send all',
  plusMore: '+{{count}}',
  overdueSectionTitle: 'Overdue',
  allCustomersLink: 'All customers',
  emptyOverdue: 'No overdue payments today 🎉',
  newCharge: 'New charge',
};
