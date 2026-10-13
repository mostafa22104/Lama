import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import type { ThemeName } from '@lamma/shared';
import type { AppTheme } from './build-theme';
import { useTheme } from './use-theme';

/** Builds a hook returning StyleSheet styles for the current theme, created once per theme. */
export function makeStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (theme: AppTheme) => T,
) {
  const cache = new Map<ThemeName, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme.name);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme.name, styles);
    }
    return styles;
  };
}
