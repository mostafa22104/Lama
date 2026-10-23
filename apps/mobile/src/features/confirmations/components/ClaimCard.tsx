import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentClaimItemDto } from '@lamma/shared';
import { Button, Card, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { ClaimOcrRows } from './ClaimOcrRows';
import { ClaimReceiptPreview } from './ClaimReceiptPreview';
import { ClaimVerdictBanner } from './ClaimVerdictBanner';

interface ClaimCardProps {
  claim: PaymentClaimItemDto;
  onConfirm: (claimId: string) => void;
  onReject: (claimId: string) => void;
  isConfirming?: boolean;
  isRejecting?: boolean;
}

export function ClaimCard({
  claim,
  onConfirm,
  onReject,
  isConfirming,
  isRejecting,
}: ClaimCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const initial = claim.customerName.trim().charAt(0);
  const saysNote = t('confirmations:saysPaid', {
    amount: claim.extractedAmount ?? claim.invoiceAmount,
    note: claim.chargeTitle,
  });

  return (
    <Card testID={`claim-card-${claim.id}`} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="body" weight={700} color="primaryInk">{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text variant="body" weight={700}>{claim.customerName}</Text>
          <Text variant="caption" color="muted" numberOfLines={1}>{saysNote}</Text>
        </View>
      </View>

      <ClaimVerdictBanner verdict={claim.verdict} expectedAmount={claim.invoiceAmount} />

      <View style={styles.comparisonWrap}>
        <ClaimReceiptPreview
          amount={claim.extractedAmount}
          date={claim.extractedDate}
          transactionId={claim.transactionId}
          recipient={claim.recipient}
        />
        <ClaimOcrRows claim={claim} />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <Button
            label={t('confirmations:rejectBtn')}
            variant="danger"
            size="medium"
            loading={isRejecting}
            onPress={() => onReject(claim.id)}
          />
        </View>
        <View style={styles.actionBtn}>
          <Button
            label={t('confirmations:confirmBtn')}
            variant="primary"
            size="medium"
            loading={isConfirming}
            onPress={() => onConfirm(claim.id)}
          />
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    gap: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  comparisonWrap: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
}));
