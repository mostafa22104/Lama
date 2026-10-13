import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../core/storage/zustand-storage';
import type { ThemeMode } from './resolve-theme';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ mode: 'system', setMode: (mode) => set({ mode }) }), {
    name: 'theme',
    storage: persistStorage,
  }),
);
