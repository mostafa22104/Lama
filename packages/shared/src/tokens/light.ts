import type { Theme } from './theme.js';

/** Values from lamma-design-handoff/design-tokens.json. */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    bg: '#F6F4EF',
    surface: '#FFFFFF',
    ink: '#1C2B2A',
    muted: '#5E6A67',
    line: '#E4DFD5',
    inputBorder: '#D6D0C4',
    primary: '#0F5E56',
    primaryDark: '#0A4540',
    primarySoft: '#E2EEEB',
    primaryInk: '#0F5E56',
    onPrimary: '#FFFFFF',
    gold: '#B7791F',
    goldSoft: '#F6ECD8',
    logoAccent: '#F3D9A4',
    whatsapp: '#177A45',
    whatsappSoft: '#DCF3E4',
    danger: '#A8231B',
    dangerSoft: '#FBE4E1',
    disabledBg: '#D9D5CC',
    chatBg: '#EFE7DC',
  },
  status: {
    paid: { fg: '#1B6B43', bg: '#E2F1E8' },
    dueSoon: { fg: '#8A5300', bg: '#FBEFD6' },
    overdue: { fg: '#A8231B', bg: '#FBE4E1' },
    awaiting: { fg: '#2A578F', bg: '#E4ECF7' },
  },
};
