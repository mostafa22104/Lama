import { I18nManager } from 'react-native';
import RNRestart from 'react-native-restart';
import { isRtl, type Locale } from '@lamma/shared';
import { useLanguageStore } from './language-store';

export interface DirectionDeps {
  isRTL: boolean;
  allowRTL: (value: boolean) => void;
  forceRTL: (value: boolean) => void;
  restart: () => void;
}

const nativeDeps = (): DirectionDeps => ({
  isRTL: I18nManager.isRTL,
  allowRTL: (value) => I18nManager.allowRTL(value),
  forceRTL: (value) => I18nManager.forceRTL(value),
  restart: () => RNRestart.restart(),
});

function apply(language: Locale, deps: DirectionDeps): void {
  deps.allowRTL(true);
  deps.forceRTL(isRtl(language));
  deps.restart();
}

/** RN applies RTL only after a restart; fix any mismatch at startup. Returns true if it restarted. */
export function ensureDirection(language: Locale, deps: DirectionDeps = nativeDeps()): boolean {
  if (deps.isRTL === isRtl(language)) return false;
  apply(language, deps);
  return true;
}

export function changeLanguage(language: Locale, deps: DirectionDeps = nativeDeps()): void {
  useLanguageStore.getState().setLanguage(language);
  apply(language, deps);
}
