import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ReportSummaryCardsProps {
  paidCount: number;
  totalCount: number;
  lateCount: number;
}

export function ReportSummaryCards({ paidCount, totalCount, lateCount }: ReportSummaryCardsProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.grid}>
      <Card style={styles.card}>
        <Text variant="caption" color="muted">{t('reports:paidCardTitle')}</Text>
        <View style={styles.valueRow}>
          <Text variant="screenTitle" weight={700}>{paidCount}</Text>
          <Text variant="caption" color="muted">
            {t('reports:paidCardValue', { paid: '', total: totalCount })}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text variant="caption" color="muted">{t('reports:stillLateTitle')}</Text>
        <View style={styles.valueRow}>
          <Text variant="screenTitle" weight={700} color="danger">{lateCount}</Text>
          <Text variant="caption" color="muted">{t('reports:stillLateCount', { count: '' })}</Text>
        </View>
      </Card>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  grid: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, padding: 14, gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
}));
