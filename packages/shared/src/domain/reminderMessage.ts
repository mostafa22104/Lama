import { resources } from '../i18n/index.js';
import type { Gender } from '../types/customers.js';
import type { Locale } from '../types/locale.js';
import { CURRENCY_LABEL, formatAmount } from './money.js';

export interface ReminderMessageInput {
  locale: Locale;
  customerName: string;
  gender: Gender | null;
  businessName: string;
  /** Display title, e.g. "اشتراك سبتمبر". */
  title: string;
  amount: number;
  /** Positive before the due date, 0 on it, negative after it. */
  daysUntilDue: number;
  link: string;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function dayCount(days: number, locale: Locale): string {
  const words = resources[locale].reminders.days;
  if (days === 1) return words.one;
  if (days === 2) return words.two;
  return fill(days <= 10 ? words.few : words.many, { n: String(days) });
}

export function buildReminderMessage(input: ReminderMessageInput): string {
  const copy = resources[input.locale].reminders;
  const gender = input.gender ?? 'neutral';
  const values = {
    name: input.customerName,
    business: input.businessName,
    title: input.title,
    amount: formatAmount(input.amount),
    currency: CURRENCY_LABEL[input.locale],
    days: dayCount(Math.abs(input.daysUntilDue), input.locale),
  };
  const [body, cta] =
    input.daysUntilDue > 0
      ? [copy.before, copy.payCta[gender]]
      : input.daysUntilDue === 0
        ? [copy.onDue, copy.onDueCta[gender]]
        : [copy.after, copy.proofCta[gender]];
  return [fill(copy.greeting[gender], values), fill(body, values), cta, input.link].join('\n');
}

export function whatsappUrl(phoneE164: string, text: string): string {
  return `https://wa.me/${phoneE164.replace('+', '')}?text=${encodeURIComponent(text)}`;
}

export function payLink(baseUrl: string, publicToken: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/p/${publicToken}`;
}
