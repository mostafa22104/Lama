import type { Locale } from '../types/locale.js';
import { arCommon } from './ar/common.js';
import { arErrors } from './ar/errors.js';
import { enCommon } from './en/common.js';
import { enErrors } from './en/errors.js';

export const resources = {
  ar: { common: arCommon, errors: arErrors },
  en: { common: enCommon, errors: enErrors },
} as const;

export type TranslationNamespace = keyof (typeof resources)['ar'];

export const DEFAULT_LOCALE: Locale = 'ar';

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export type { TranslationShape } from './translation.js';
