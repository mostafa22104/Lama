import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { AppTheme } from '../../theme';

export function toNavigationTheme(theme: AppTheme): Theme {
  const base = theme.name === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.ink,
      border: theme.colors.line,
      primary: theme.colors.primary,
      notification: theme.colors.danger,
    },
  };
}
