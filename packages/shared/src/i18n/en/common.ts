import type { arCommon } from '../ar/common.js';
import type { TranslationShape } from '../translation.js';

export const enCommon: TranslationShape<typeof arCommon> = {
  appName: 'Lamma',
  currency: 'EGP',
  status: {
    paid: 'Paid',
    due_soon: 'Due soon',
    overdue: 'Overdue',
    awaiting_confirmation: 'Awaiting confirmation',
    upcoming: 'Upcoming',
  },
  businessType: {
    academy: 'Academy',
    building: 'Building',
    tutor: 'Tutor',
    nursery: 'Nursery',
    other: 'Other',
  },
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
};
