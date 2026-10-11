import type { Theme } from './theme.js';

/** Derived from the brand palette; tuned for contrast on a deep teal-black background. */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    bg: '#0E1716',
    surface: '#16211F',
    ink: '#E8EEEC',
    muted: '#9AAAA6',
    line: '#2A3835',
    inputBorder: '#3A4A46',
    primary: '#1F7A70',
    primaryDark: '#16605A',
    primarySoft: '#173A36',
    primaryInk: '#6CC9BB',
    onPrimary: '#FFFFFF',
    gold: '#D9A04A',
    goldSoft: '#3A2E1A',
    logoAccent: '#6B5528',
    whatsapp: '#177A45',
    whatsappSoft: '#15301F',
    danger: '#F08A80',
    dangerSoft: '#3A1A17',
    disabledBg: '#2F3A37',
    chatBg: '#1A2321',
  },
  status: {
    paid: { fg: '#7DD3A0', bg: '#15301F' },
    dueSoon: { fg: '#F2C26B', bg: '#3A2C12' },
    overdue: { fg: '#F49A90', bg: '#3D1A17' },
    awaiting: { fg: '#93B8EC', bg: '#172A44' },
  },
};
