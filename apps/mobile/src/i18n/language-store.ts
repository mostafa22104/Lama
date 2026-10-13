import type { Locale } from '@lamma/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../core/storage/zustand-storage';

interface LanguageState {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

/** Arabic by default, whatever the phone's language: the product is Arabic-first. */
export const useLanguageStore = create<LanguageState>()(
  persist((set) => ({ language: 'ar', setLanguage: (language) => set({ language }) }), {
    name: 'language',
    storage: persistStorage,
  }),
);
