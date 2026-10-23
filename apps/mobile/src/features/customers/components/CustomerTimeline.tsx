import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { HistoryEventDto, Theme, ThemeColors } from '@lamma/shared';
import { AmountText, Card, Icon, type IconName, StatusChip, Text } from '../../../shared/components';
import { makeStyles, useTheme } from '../../../theme';

interface CustomerTimelineProps {
  events: HistoryEventDto[];
}

export function CustomerTimeline({ events }: CustomerTimelineProps) {
  const styles = useStyles();
  const { colors, status } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text variant="section" weight={700}>{t('customers:historyTitle')}</Text>
      <Card style={styles.card}>
        {events.map((ev, index) => {
          const isLast = index === events.length - 1;
          const { icon, bg, iconColor, title, subtitle, amount, status: chipStatus } = formatEvent(ev, t, colors, status);

          return (
            <View key={index} style={styles.eventRow}>
              {!isLast ? <View style={styles.verticalLine} /> : null}
              <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                <Icon name={icon} size={18} color={iconColor} />
              </View>
              <View style={styles.eventBody}>
                <View style={styles.titleRow}>
                  <Text variant="body" weight={600} numberOfLines={1}>{title}</Text>
                  {chipStatus ? <StatusChip status={chipStatus} /> : null}
                </View>
                <View style={styles.subRow}>
                  <Text variant="caption" color="muted">{subtitle}</Text>
                  {amount !== undefined ? <AmountText amount={amount} size="row" /> : null}
                </View>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

function formatEvent(
  ev: HistoryEventDto,
  t: (key: string, opts?: Record<string, unknown>) => string,
  colors: ThemeColors,
  statusPalette: Theme['status'],
): { icon: IconName; bg: string; iconColor: keyof ThemeColors; title: string; subtitle: string; amount?: number; status?: 'paid' | 'overdue' | 'due_soon' } {
  const atDate = ev.at ? ev.at.slice(0, 10) : '';
  if (ev.type === 'reminder') {
    return { icon: 'bell', bg: colors.line, iconColor: 'muted', title: t('customers:history.reminderSent'), subtitle: atDate };
  }
  if (ev.type === 'payment') {
    return {
      icon: 'check',
      bg: statusPalette.paid.bg,
      iconColor: 'whatsapp',
      title: ev.method === 'cash' ? t('customers:history.paidCash', { title: ev.title }) : t('customers:history.paidProof', { title: ev.title }),
      subtitle: atDate,
      amount: ev.amount,
      status: 'paid',
    };
  }
  if (ev.type === 'invoice') {
    return {
      icon: 'calendar',
      bg: statusPalette.overdue.bg,
      iconColor: 'danger',
      title: ev.title,
      subtitle: atDate,
      amount: ev.amount,
      status: ev.status === 'due_soon' ? 'due_soon' : 'overdue',
    };
  }
  return { icon: 'plus', bg: colors.primarySoft, iconColor: 'primaryInk', title: t('customers:history.created'), subtitle: atDate };
}

const useStyles = makeStyles((t) => ({
  root: { gap: 10 },
  card: { paddingVertical: 12 },
  eventRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, position: 'relative' },
  verticalLine: { position: 'absolute', top: 38, bottom: -6, start: 17, width: 2, backgroundColor: t.colors.line },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  eventBody: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
