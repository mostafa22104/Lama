import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatMoney, type InvoiceStatus } from '@lamma/shared';
import { useLanguageStore } from '../../i18n';
import { makeStyles } from '../../theme';
import { AmountText } from './AmountText';
import { Avatar } from './Avatar';
import { StatusChip } from './StatusChip';
import { Text } from './Text';

interface CustomerRowProps {
  name: string;
  subtitle: string;
  amount: number;
  status: InvoiceStatus | null;
  onPress?: () => void;
}

export function CustomerRow({ name, subtitle, amount, status, onPress }: CustomerRowProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const money = formatMoney(amount, language);
  // TalkBack reads the whole row: name, subtitle, amount with currency, then the translated status.
  const label = [name, subtitle, `${money.amount} ${money.currency}`, status ? t(`common:status.${status}`) : null]
    .filter(Boolean)
    .join(' ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <Avatar name={name} />
      <View style={styles.texts}>
        <Text variant="section" numberOfLines={1}>{name}</Text>
        <Text variant="caption" color="muted" numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.end}>
        <AmountText amount={amount} />
        {status ? <StatusChip status={status} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: t.spacing.cardPadding,
    backgroundColor: t.colors.surface, borderColor: t.colors.line, borderWidth: 1, borderRadius: t.radius.card,
  },
  texts: { flex: 1, gap: 2 },
  end: { alignItems: 'flex-end', gap: 6 },
}));
