import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '@lamma/shared';
import { AmountText, Card, ProgressBar, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface CollectionProgressCardProps {
  period: string;
  expected: number;
  collected: number;
  remaining: number;
  collectedPercent: number;
  onOpenReport: () => void;
}

export function CollectionProgressCard({
  period,
  expected,
  collected,
  remaining,
  collectedPercent,
  onOpenReport,
}: CollectionProgressCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const monthIdx = Number(period.split('-')[1] ?? '10') - 1;
  const monthName = t(`common:months.${monthIdx}`);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="body" weight={600} color="muted">
          {t('home:collectedIn', { month: monthName })}
        </Text>
        <Pressable accessibilityRole="link" onPress={onOpenReport}>
          <Text variant="caption" weight={700} color="primaryInk">
            {t('home:reportLink')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.amountRow}>
        <AmountText amount={collected} size="large" color="primaryInk" />
        <Text variant="body" color="muted">
          {t('home:ofExpected', { expected: formatAmount(expected) })}
        </Text>
      </View>

      <ProgressBar value={collectedPercent / 100} />

      <View style={styles.footerRow}>
        <Text variant="caption" weight={600} color="muted">{collectedPercent}%</Text>
        <Text variant="caption" weight={600} color="muted">
          {t('home:remainingText', { amount: `${formatAmount(remaining)} ${t('common:currency')}` })}
        </Text>
      </View>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
