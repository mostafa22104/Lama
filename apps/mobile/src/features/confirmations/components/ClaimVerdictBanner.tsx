import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClaimVerdict } from '@lamma/shared';
import { Icon, Text } from '../../../shared/components';
import { makeStyles, useTheme } from '../../../theme';

interface ClaimVerdictBannerProps {
  verdict: ClaimVerdict;
  expectedAmount: number;
}

export function ClaimVerdictBanner({ verdict, expectedAmount }: ClaimVerdictBannerProps) {
  const styles = useStyles();
  const { status } = useTheme();
  const { t } = useTranslation();

  const isSuccess = verdict === 'all_match';
  const bgColor = isSuccess ? status.paid.bg : status.dueSoon.bg;
  const textColor = isSuccess ? status.paid.fg : status.dueSoon.fg;

  const getLabel = () => {
    switch (verdict) {
      case 'all_match':
        return t('confirmations:verdict.all_match');
      case 'amount_differs':
        return t('confirmations:verdict.amount_differs', { expected: expectedAmount });
      case 'duplicate':
        return t('confirmations:verdict.duplicate');
      case 'unreadable':
        return t('confirmations:verdict.unreadable');
      default:
        return t('confirmations:verdict.duplicate');
    }
  };

  return (
    <View testID="claim-verdict-banner" style={[styles.banner, { backgroundColor: bgColor }]}>
      <Icon name={isSuccess ? 'check' : 'alert'} size={18} color={isSuccess ? 'whatsapp' : 'gold'} />
      <Text variant="body" weight={700} style={[styles.text, { color: textColor }]}>
        {getLabel()}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  text: {
    fontSize: 14,
    flex: 1,
  },
}));
