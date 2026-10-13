import { ensureDirection, initI18n, useLanguageStore } from '../i18n';

/** Runs before the first render. Returns false if the app is restarting to fix RTL/LTR. */
export function bootstrap(): boolean {
  const { language } = useLanguageStore.getState();
  initI18n(language);
  return !ensureDirection(language);
}
