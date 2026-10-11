import type { Locale } from '../types/locale.js';

export const CURRENCY_LABEL: Record<Locale, string> = { ar: 'ج.م', en: 'EGP' };

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Western digits with thousands separators, e.g. 23400 → "23,400". */
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}

export function formatMoney(amount: number, locale: Locale): { amount: string; currency: string } {
  return { amount: formatAmount(amount), currency: CURRENCY_LABEL[locale] };
}
