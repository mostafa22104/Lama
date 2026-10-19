import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { InvoiceStatus } from '@lamma/shared';
import { formatAmount } from '@lamma/shared';
import { AmountText, Button, Card, Icon, StatusChip, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface CustomerBalanceCardProps {
  balance: number;
  status: InvoiceStatus | null;
  nextDue: { dueDate: string; amount: number } | null;
  onSendReminder: () => void;
  onEdit: () => void;
  onRecordCash?: () => void;
  isRecordingCash?: boolean;
}

export function CustomerBalanceCard({
  balance,
  status,
  nextDue,
  onSendReminder,
  onEdit,
  onRecordCash,
  isRecordingCash = false,
}: CustomerBalanceCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="body" weight={600} color="muted">{t('customers:balanceDue')}</Text>
        {status ? <StatusChip status={status} /> : null}
      </View>

      <AmountText amount={balance} size="large" color={status === 'overdue' ? 'danger' : 'primaryInk'} />

      {nextDue ? (
        <View style={styles.nextDueBar}>
          <Icon name="calendar" color="muted" size={18} />
          <Text variant="caption" color="muted">
            {t('customers:nextDueCard', {
              date: nextDue.dueDate,
              amount: `${formatAmount(nextDue.amount)} ${t('common:currency')}`,
            })}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.flexBtn}>
          <Button label={t('customers:sendReminder')} variant="whatsapp" icon="whatsapp" onPress={onSendReminder} />
        </View>
        <View style={styles.flexBtnSecondary}>
          <Button label={t('customers:edit')} variant="outline" icon="pencil" onPress={onEdit} />
        </View>
      </View>

      {onRecordCash ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRecordCash}
          disabled={isRecordingCash}
          style={styles.cashBtn}
        >
          <Icon name="cash" color="primaryInk" size={20} />
          <Text variant="caption" weight={600} color="primaryInk">
            {t('customers:recordCash')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextDueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  flexBtn: { flex: 1.4 },
  flexBtnSecondary: { flex: 1 },
  cashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
}));
