export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
