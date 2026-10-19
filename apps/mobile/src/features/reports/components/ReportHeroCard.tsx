import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '@lamma/shared';
import { AmountText, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ReportHeroCardProps {
  collected: number;
  expected: number;
}

export function ReportHeroCard({ collected, expected }: ReportHeroCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const percent = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  return (
    <View style={styles.card}>
      <Text variant="body" style={styles.subtext}>{t('reports:heroWeCollected')}</Text>
      <AmountText amount={collected} size="large" color="surface" />
      <Text variant="section" weight={600} style={styles.whiteText}>{t('reports:thisMonth')}</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      <Text variant="caption" style={styles.subtext}>
        {t('reports:heroProgressSubtitle', {
          percent,
          expected: `${formatAmount(expected)} ${t('common:currency')}`,
        })}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    backgroundColor: '#0F5E56',
    borderRadius: 22,
    padding: 20,
    gap: 8,
  },
  whiteText: { color: '#FFFFFF' },
  subtext: { color: '#CFE5E0' },
  track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginVertical: 4 },
  fill: { height: '100%', borderRadius: 5, backgroundColor: '#F3D9A4' },
}));
