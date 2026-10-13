import { useContext } from 'react';
import type { AppTheme } from './build-theme';
import { ThemeContext } from './theme-context';

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
