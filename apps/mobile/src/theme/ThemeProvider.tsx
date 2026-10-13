import React, { type ReactNode, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { buildTheme } from './build-theme';
import { resolveThemeName } from './resolve-theme';
import { ThemeContext } from './theme-context';
import { useThemeStore } from './theme-store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => buildTheme(resolveThemeName(mode, systemScheme)), [mode, systemScheme]);
  // backgroundColor is Android-only and absent from RN's typings, so it is passed via a spread.
  const statusBarProps = {
    barStyle: theme.name === 'dark' ? 'light-content' : 'dark-content',
    backgroundColor: theme.colors.bg,
  } as const;
  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar {...statusBarProps} />
      {children}
    </ThemeContext.Provider>
  );
}
