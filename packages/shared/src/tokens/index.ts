import { darkTheme } from './dark.js';
import { lightTheme } from './light.js';
import type { Theme, ThemeName } from './theme.js';

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };

export { lightTheme, darkTheme };
export * from './theme.js';
export * from './contrast.js';
export * from './status.js';
export * from './typography.js';
export * from './layout.js';
