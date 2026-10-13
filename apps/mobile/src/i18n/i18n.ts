import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type Locale, resources } from '@lamma/shared';

/** Initializes i18next once, synchronously (resources are bundled). */
export function initI18n(language: Locale): I18n {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: DEFAULT_LOCALE,
      ns: ['common', 'errors', 'auth', 'reminders'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      initAsync: false,
    });
  }
  return i18next;
}

export { i18next as i18n };
