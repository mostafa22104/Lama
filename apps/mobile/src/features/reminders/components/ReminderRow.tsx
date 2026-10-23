import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ReminderItemDto } from '@lamma/shared';
import { AmountText, Avatar, Button, Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ReminderRowProps {
  item: ReminderItemDto;
  onSend: () => void;
  isSending?: boolean;
}

export function ReminderRow({ item, onSend, isSending = false }: ReminderRowProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const isOverdue = item.status === 'overdue';

  return (
    <Card style={[styles.card, item.sent ? styles.sentCard : null]}>
      <View style={styles.content}>
        <Avatar name={item.customerName} size={40} />
        <View style={styles.textWrap}>
          <Text variant="body" weight={600} numberOfLines={1}>{item.customerName}</Text>
          <Text variant="caption" weight={600} color={isOverdue ? 'danger' : 'muted'} numberOfLines={1}>
            {item.title}
          </Text>
          <AmountText amount={item.amount} size="row" />
        </View>

        {item.sent ? (
          <View style={styles.sentBadge}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={16} color="onPrimary" />
            </View>
            <Text variant="caption" weight={700} color="whatsapp">
              {t('reminders:sent')}
            </Text>
          </View>
        ) : (
          <Button
            label={t('reminders:sendOnWhatsApp')}
            variant="whatsapp"
            icon="whatsapp"
            size="medium"
            onPress={onSend}
            disabled={isSending}
          />
        )}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { padding: 12 },
  sentCard: { backgroundColor: t.colors.whatsappSoft },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textWrap: { flex: 1, gap: 2 },
  sendBtn: { height: 44, paddingHorizontal: 12 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.whatsapp, alignItems: 'center', justifyContent: 'center' },
}));
