import type { ThemeName } from '@lamma/shared';

export type ThemeMode = 'light' | 'dark' | 'system';

export function resolveThemeName(mode: ThemeMode, systemScheme: string | null | undefined): ThemeName {
  if (mode !== 'system') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
