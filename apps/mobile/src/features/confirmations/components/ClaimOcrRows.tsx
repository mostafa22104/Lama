import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentClaimItemDto } from '@lamma/shared';
import { Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ClaimOcrRowsProps {
  claim: PaymentClaimItemDto;
}

export function ClaimOcrRows({ claim }: ClaimOcrRowsProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const isDuplicate = claim.verdict === 'duplicate';

  return (
    <View testID="claim-ocr-rows" style={styles.container}>
      <Text variant="caption" weight={700} color="primary" style={styles.header}>
        {t('confirmations:ocrHeader')}
      </Text>

      <View style={styles.row}>
        <Text variant="caption" color="muted">{t('confirmations:amount')}</Text>
        <Text variant="body" weight={700}>{`${claim.extractedAmount ?? 0} ج.م`}</Text>
        <View style={styles.tagWrap}>
          <Icon name={claim.checkAmount ? 'check' : 'alert'} size={14} color={claim.checkAmount ? 'whatsapp' : 'gold'} />
          <Text variant="caption" weight={600} color={claim.checkAmount ? 'whatsapp' : 'gold'}>
            {claim.checkAmount ? t('confirmations:matched') : t('confirmations:differs', { expected: claim.invoiceAmount })}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="caption" color="muted">{t('confirmations:date')}</Text>
        <Text variant="body" weight={700}>{claim.extractedDate ?? '-'}</Text>
        <View style={styles.tagWrap}>
          <Icon name={claim.checkDate ? 'check' : 'alert'} size={14} color={claim.checkDate ? 'whatsapp' : 'gold'} />
          <Text variant="caption" weight={600} color={claim.checkDate ? 'whatsapp' : 'gold'}>
            {claim.checkDate ? t('confirmations:matched') : t('confirmations:oldDate')}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="caption" color="muted">{t('confirmations:transactionId')}</Text>
        <Text variant="caption" weight={700} numberOfLines={1}>{claim.transactionId ?? '-'}</Text>
        <View style={styles.tagWrap}>
          <Icon name={!isDuplicate ? 'check' : 'alert'} size={14} color={!isDuplicate ? 'whatsapp' : 'gold'} />
          <Text variant="caption" weight={600} color={!isDuplicate ? 'whatsapp' : 'gold'}>
            {!isDuplicate ? t('confirmations:newTx') : t('confirmations:duplicateTx')}
          </Text>
        </View>
      </View>

      <View style={styles.lastRow}>
        <Text variant="caption" color="muted">{t('confirmations:recipient')}</Text>
        <Text variant="caption" weight={700} numberOfLines={1}>{claim.recipient ?? '-'}</Text>
        <View style={styles.tagWrap}>
          <Icon name={claim.checkRecipient ? 'check' : 'alert'} size={14} color={claim.checkRecipient ? 'whatsapp' : 'gold'} />
          <Text variant="caption" weight={600} color={claim.checkRecipient ? 'whatsapp' : 'gold'}>
            {claim.checkRecipient ? t('confirmations:yourAccount') : t('confirmations:differs', { expected: '' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    gap: 4,
  },
  header: {
    fontSize: 12,
    marginBottom: 2,
  },
  row: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.line,
    gap: 1,
  },
  lastRow: {
    paddingVertical: 4,
    gap: 1,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
}));
