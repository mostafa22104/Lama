import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '@lamma/shared';
import { AmountText, Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface MonthComparisonCardProps {
  currentCollected: number;
  previousCollected: number;
}

export function MonthComparisonCard({ currentCollected, previousCollected }: MonthComparisonCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const diff = currentCollected - previousCollected;
  const isPositive = diff >= 0;
  const max = Math.max(currentCollected, previousCollected, 1);
  const prevPct = Math.round((previousCollected / max) * 100);
  const currPct = Math.round((currentCollected / max) * 100);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="body" weight={700}>{t('reports:vsLastMonth')}</Text>
        <View style={[styles.diffBadge, isPositive ? styles.diffPositive : styles.diffNegative]}>
          <Icon name="trendingUp" size={14} color={isPositive ? 'primaryInk' : 'danger'} />
          <Text variant="caption" weight={700} style={isPositive ? styles.diffTextPositive : styles.diffTextNegative}>
            {isPositive ? t('reports:diffPositive', { amount: formatAmount(diff) }) : t('reports:diffNegative', { amount: formatAmount(Math.abs(diff)) })}
          </Text>
        </View>
      </View>

      <View style={styles.barGroup}>
        <View style={styles.barLabelRow}>
          <Text variant="caption" color="muted">الشهر اللي فات</Text>
          <AmountText amount={previousCollected} size="row" />
        </View>
        <View style={styles.track}>
          <View style={[styles.prevFill, { width: `${prevPct}%` }]} />
        </View>
      </View>

      <View style={styles.barGroup}>
        <View style={styles.barLabelRow}>
          <Text variant="caption" color="muted">الشهر ده</Text>
          <AmountText amount={currentCollected} size="row" />
        </View>
        <View style={styles.track}>
          <View style={[styles.currFill, { width: `${currPct}%` }]} />
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  diffPositive: { backgroundColor: t.status.paid.bg },
  diffNegative: { backgroundColor: t.colors.dangerSoft },
  diffTextPositive: { color: t.status.paid.fg },
  diffTextNegative: { color: t.colors.danger },
  barGroup: { gap: 4 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 12, borderRadius: 6, backgroundColor: t.colors.line, overflow: 'hidden' },
  prevFill: { height: '100%', borderRadius: 6, backgroundColor: t.colors.muted },
  currFill: { height: '100%', borderRadius: 6, backgroundColor: t.colors.primary },
}));
