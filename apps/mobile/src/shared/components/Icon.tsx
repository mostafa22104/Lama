import React from 'react';
import { I18nManager } from 'react-native';
import type { ThemeColors } from '@lamma/shared';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Banknote from 'lucide-react-native/icons/banknote';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import ChartNoAxesColumn from 'lucide-react-native/icons/chart-no-axes-column';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import House from 'lucide-react-native/icons/house';
import Languages from 'lucide-react-native/icons/languages';
import Download from 'lucide-react-native/icons/download';
import Lock from 'lucide-react-native/icons/lock';
import Camera from 'lucide-react-native/icons/camera';
import Contact from 'lucide-react-native/icons/contact';
import FileSpreadsheet from 'lucide-react-native/icons/file-spreadsheet';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Moon from 'lucide-react-native/icons/moon';
import Pencil from 'lucide-react-native/icons/pencil';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sun from 'lucide-react-native/icons/sun';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import { useTheme } from '../../theme';

const ICONS = {
  arrowBack: ArrowLeft, chevronForward: ChevronLeft, chevronBack: ChevronRight, home: House, users: Users,
  confirmations: CircleCheck, reports: ChartNoAxesColumn, check: Check, close: X, plus: Plus,
  search: Search, bell: Bell, whatsapp: MessageCircle, calendar: Calendar, sun: Sun, moon: Moon,
  language: Languages, logout: LogOut, mail: Mail, phone: Smartphone, cash: Banknote, alert: CircleAlert,
  settings: Settings, trendingUp: TrendingUp, download: Download, pencil: Pencil, lock: Lock,
  camera: Camera, contacts: Contact, excel: FileSpreadsheet,
} as const;

export type IconName = keyof typeof ICONS;

/** "Back" points right in RTL; "forward" chevrons point left in RTL (the design's direction). */
function isFlipped(name: IconName): boolean {
  if (name === 'arrowBack') return I18nManager.isRTL;
  if (name === 'chevronForward') return !I18nManager.isRTL;
  return false;
}

export function Icon({ name, size = 24, color = 'ink' }: { name: IconName; size?: number; color?: keyof ThemeColors }) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      color={colors[color]}
      strokeWidth={2}
      style={isFlipped(name) ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
