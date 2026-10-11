export type ThemeName = 'light' | 'dark';
export type StatusKey = 'paid' | 'dueSoon' | 'overdue' | 'awaiting';

export interface StatusColors {
  fg: string;
  bg: string;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  inputBorder: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  /** Primary-colored text and icons. */
  primaryInk: string;
  /** Text and icons on primary or WhatsApp buttons. */
  onPrimary: string;
  gold: string;
  goldSoft: string;
  logoAccent: string;
  whatsapp: string;
  whatsappSoft: string;
  danger: string;
  dangerSoft: string;
  disabledBg: string;
  chatBg: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  status: Record<StatusKey, StatusColors>;
}
