import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Plan } from '@lamma/shared';
import { Button, Card, ProgressBar, StatusChip, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface PlanCardProps {
  plan: Plan;
  customerCount: number;
  maxCustomers: number;
  onRequestUpgrade: () => void;
  isUpgrading?: boolean;
}

const PLAN_PRICES: Record<Plan, string> = {
  free: '0 ج.م',
  basic: '199 ج.م',
  pro: '399 ج.م',
};

export function PlanCard({ plan, customerCount, maxCustomers, onRequestUpgrade, isUpgrading }: PlanCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const percent = maxCustomers > 0 ? Math.min(100, Math.round((customerCount / maxCustomers) * 100)) : 0;
  const isPro = plan === 'pro';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="section" weight={700}>{t('settings:planTitle')}</Text>
        <StatusChip status="paid" />
      </View>

      <View style={styles.priceRow}>
        <Text variant="screenTitle" weight={700}>{t(`settings:${plan}`)}</Text>
        <Text variant="body" color="muted">
          {t('settings:perMonth', { amount: PLAN_PRICES[plan] })}
        </Text>
      </View>

      <Text variant="caption" color="muted">
        {t('settings:customersQuota', { used: customerCount, limit: maxCustomers })}
      </Text>

      <ProgressBar value={percent / 100} />

      {!isPro ? (
        <View style={styles.upgradeBox}>
          <Text variant="body" weight={700}>{t('settings:upgradeToPro')}</Text>
          <Text variant="caption" style={styles.upgradeDesc}>{t('settings:proBenefits')}</Text>
          <Button
            label={t('settings:upgradeButton')}
            variant="primary"
            onPress={onRequestUpgrade}
            disabled={isUpgrading}
          />
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  upgradeBox: { backgroundColor: t.colors.goldSoft, borderRadius: 14, padding: 14, gap: 10, marginTop: 4 },
  upgradeDesc: { color: t.name === 'dark' ? t.colors.gold : '#6B4A10', lineHeight: 20 },
}));
