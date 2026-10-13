import { RADIUS, SIZES, SPACING, type Theme, type ThemeName, themes, TYPE_SCALE } from '@lamma/shared';
import { FONTS } from './fonts';

export interface AppTheme extends Theme {
  type: typeof TYPE_SCALE;
  radius: typeof RADIUS;
  sizes: typeof SIZES;
  spacing: typeof SPACING;
  fonts: typeof FONTS;
}

const cache = new Map<ThemeName, AppTheme>();

export function buildTheme(name: ThemeName): AppTheme {
  const cached = cache.get(name);
  if (cached) return cached;
  const theme: AppTheme = { ...themes[name], type: TYPE_SCALE, radius: RADIUS, sizes: SIZES, spacing: SPACING, fonts: FONTS };
  cache.set(name, theme);
  return theme;
}
