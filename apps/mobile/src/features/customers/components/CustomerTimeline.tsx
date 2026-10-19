import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { HistoryEventDto } from '@lamma/shared';
import { AmountText, Card, Icon, StatusChip, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface CustomerTimelineProps {
  events: HistoryEventDto[];
}

export function CustomerTimeline({ events }: CustomerTimelineProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text variant="section" weight={700}>{t('customers:historyTitle')}</Text>
      <Card style={styles.card}>
        {events.map((ev, index) => {
          const isLast = index === events.length - 1;
          const { icon, color, title, subtitle, amount, status } = formatEvent(ev, t);

          return (
            <View key={index} style={styles.eventRow}>
              {!isLast ? <View style={styles.verticalLine} /> : null}
              <View style={[styles.iconCircle, { backgroundColor: color }]}>
                <Icon name={icon} size={18} color="surface" />
              </View>
              <View style={styles.eventBody}>
                <View style={styles.titleRow}>
                  <Text variant="body" weight={600} numberOfLines={1}>{title}</Text>
                  {status ? <StatusChip status={status} /> : null}
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

function formatEvent(ev: HistoryEventDto, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (ev.type === 'reminder') {
    return { icon: 'bell' as const, color: '#5E6A67', title: t('customers:history.reminderSent'), subtitle: ev.at };
  }
  if (ev.type === 'payment') {
    return {
      icon: 'check' as const,
      color: '#1B6B43',
      title: ev.method === 'cash' ? t('customers:history.paidCash', { title: ev.title }) : t('customers:history.paidProof', { title: ev.title }),
      subtitle: ev.at,
      amount: ev.amount,
      status: 'paid' as const,
    };
  }
  if (ev.type === 'invoice') {
    return { icon: 'calendar' as const, color: '#A8231B', title: ev.title, subtitle: ev.at, amount: ev.amount, status: ev.status };
  }
  return { icon: 'plus' as const, color: '#0F5E56', title: t('customers:history.created'), subtitle: ev.at };
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
