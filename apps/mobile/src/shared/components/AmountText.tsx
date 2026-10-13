import React from 'react';
import { View } from 'react-native';
import { formatMoney, type ThemeColors } from '@lamma/shared';
import { useLanguageStore } from '../../i18n';
import { makeStyles } from '../../theme';
import { Text } from './Text';

const SIZES = { large: { number: 38, currency: 22 }, medium: { number: 26, currency: 16 }, row: { number: 16, currency: 12 } } as const;

/** Big Western-digit number with a smaller currency after it (design rule). */
export function AmountText({ amount, size = 'row', color = 'ink' }: { amount: number; size?: keyof typeof SIZES; color?: keyof ThemeColors }) {
  const styles = useStyles();
  const language = useLanguageStore((state) => state.language);
  const money = formatMoney(amount, language);
  const scale = SIZES[size];
  return (
    <View style={styles.row}>
      <Text weight={700} color={color} ltr style={{ fontSize: scale.number, lineHeight: Math.round(scale.number * 1.25) }}>{money.amount}</Text>
      <Text weight={600} color={color} style={{ fontSize: scale.currency }}>{money.currency}</Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({ row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 } }));
