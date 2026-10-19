import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ClaimReceiptPreviewProps {
  amount: number | null;
  date: string | null;
  transactionId: string | null;
  recipient: string | null;
}

export function ClaimReceiptPreview({
  amount,
  date,
  transactionId,
  recipient,
}: ClaimReceiptPreviewProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View testID="claim-receipt-preview" style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="check" size={14} color="onPrimary" />
      </View>
      <Text variant="caption" weight={600} style={styles.successText}>
        {t('confirmations:successfulTransfer')}
      </Text>
      <Text variant="body" weight={700} style={styles.amountText}>
        {`${amount ?? 0}.00 EGP`}
      </Text>
      <View style={styles.divider} />
      <View style={styles.metaWrap}>
        {date ? <Text variant="caption" style={styles.metaText}>{date}</Text> : null}
        {transactionId ? <Text variant="caption" style={styles.metaText}>{`Ref: ${transactionId}`}</Text> : null}
        {recipient ? <Text variant="caption" numberOfLines={1} style={styles.metaText}>{`To: ${recipient}`}</Text> : null}
      </View>
      <View style={styles.barLong} />
      <View style={styles.barShort} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    width: 106,
    minHeight: 180,
    borderRadius: 12,
    backgroundColor: t.colors.bg,
    borderWidth: 1,
    borderColor: t.colors.line,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: t.colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 9,
    color: t.colors.muted,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 13,
    color: t.colors.ink,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: t.colors.line,
    marginVertical: 2,
  },
  metaWrap: {
    width: '100%',
    gap: 2,
  },
  metaText: {
    fontSize: 8,
    color: t.colors.muted,
    lineHeight: 11,
  },
  barLong: {
    width: '75%',
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.line,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  barShort: {
    width: '50%',
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.line,
    alignSelf: 'flex-start',
  },
}));
