import { createContext } from 'react';
import { type AppTheme, buildTheme } from './build-theme';

export const ThemeContext = createContext<AppTheme>(buildTheme('light'));
