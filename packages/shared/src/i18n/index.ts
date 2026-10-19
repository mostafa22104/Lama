import type { Locale } from '../types/locale.js';
import { arAuth } from './ar/auth.js';
import { arCommon } from './ar/common.js';
import { arConfirmations } from './ar/confirmations.js';
import { arCustomers } from './ar/customers.js';
import { arErrors } from './ar/errors.js';
import { arHome } from './ar/home.js';
import { arOnboarding } from './ar/onboarding.js';
import { arReminders } from './ar/reminders.js';
import { arReports } from './ar/reports.js';
import { arSettings } from './ar/settings.js';
import { enAuth } from './en/auth.js';
import { enCommon } from './en/common.js';
import { enConfirmations } from './en/confirmations.js';
import { enCustomers } from './en/customers.js';
import { enErrors } from './en/errors.js';
import { enHome } from './en/home.js';
import { enOnboarding } from './en/onboarding.js';
import { enReminders } from './en/reminders.js';
import { enReports } from './en/reports.js';
import { enSettings } from './en/settings.js';

export const resources = {
  ar: { common: arCommon, errors: arErrors, reminders: arReminders, auth: arAuth, home: arHome, customers: arCustomers, reports: arReports, settings: arSettings, confirmations: arConfirmations, onboarding: arOnboarding },
  en: { common: enCommon, errors: enErrors, reminders: enReminders, auth: enAuth, home: enHome, customers: enCustomers, reports: enReports, settings: enSettings, confirmations: enConfirmations, onboarding: enOnboarding },
} as const;

export type TranslationNamespace = keyof (typeof resources)['ar'];

export const DEFAULT_LOCALE: Locale = 'ar';

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export type { TranslationShape } from './translation.js';
