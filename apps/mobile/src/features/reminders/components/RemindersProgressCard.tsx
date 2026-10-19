import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, ProgressBar, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface RemindersProgressCardProps {
  sentCount: number;
  total: number;
  onSendAll: () => void;
  disabled?: boolean;
}

export function RemindersProgressCard({ sentCount, total, onSendAll, disabled }: RemindersProgressCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const percent = total > 0 ? Math.round((sentCount / total) * 100) : 0;
  const remaining = total - sentCount;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="body" weight={600}>
          {t('reminders:sentProgress', { sent: sentCount, total })}
        </Text>
        <Text variant="caption" color="muted">
          {remaining === 0 ? t('reminders:allDone') : t('reminders:remaining', { count: remaining })}
        </Text>
      </View>

      <ProgressBar value={percent / 100} />

      {remaining > 0 ? (
        <Button
          label={t('reminders:sendAll')}
          variant="whatsapp"
          icon="whatsapp"
          onPress={onSendAll}
          disabled={disabled}
        />
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
