import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AmountText, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface HomeStatCardsProps {
  overdueAmount: number;
  overdueCustomerCount: number;
  awaitingCount: number;
  onOverduePress: () => void;
  onAwaitingPress: () => void;
}

export function HomeStatCards({
  overdueAmount,
  overdueCustomerCount,
  awaitingCount,
  onOverduePress,
  onAwaitingPress,
}: HomeStatCardsProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.grid}>
      <Pressable accessibilityRole="button" onPress={onOverduePress} style={[styles.card, styles.overdueCard]}>
        <Text variant="caption" weight={700} color="danger">{t('home:overdueTitle')}</Text>
        <AmountText amount={overdueAmount} size="medium" color="danger" />
        <Text variant="caption" color="danger">
          {t('home:customersCount', { count: overdueCustomerCount })}
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onAwaitingPress} style={[styles.card, styles.awaitingCard]}>
        <Text variant="caption" weight={700} style={styles.awaitingText}>{t('home:awaitingTitle')}</Text>
        <Text variant="display" weight={700} style={styles.awaitingText}>{awaitingCount}</Text>
        <Text variant="caption" style={styles.awaitingSub}>{t('home:transferScreenshots')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, borderRadius: 18, padding: 14, gap: 4, minHeight: 96, justifyContent: 'center' },
  overdueCard: { backgroundColor: t.colors.dangerSoft },
  awaitingCard: { backgroundColor: t.status.awaiting.bg },
  awaitingText: { color: t.status.awaiting.fg },
  awaitingSub: { color: t.status.awaiting.fg, opacity: 0.8 },
}));
