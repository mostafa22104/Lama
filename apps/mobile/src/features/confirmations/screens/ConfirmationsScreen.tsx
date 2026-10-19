import React, { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useClaims, useConfirmClaim, useRejectClaim, useUndoClaim } from '../api/use-claims';
import { ClaimCard } from '../components/ClaimCard';
import { UndoSnackbar } from '../components/UndoSnackbar';

interface LastAction {
  claimId: string;
  name: string;
  isConfirm: boolean;
}

export function ConfirmationsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  const { data: claims, isLoading, refetch, isRefetching } = useClaims();
  const confirmMutation = useConfirmClaim();
  const rejectMutation = useRejectClaim();
  const undoMutation = useUndoClaim();

  const handleConfirm = (id: string) => {
    const target = claims?.find((c) => c.id === id);
    confirmMutation.mutate(id, {
      onSuccess: () => {
        if (target) setLastAction({ claimId: id, name: target.customerName, isConfirm: true });
      },
    });
  };

  const handleReject = (id: string) => {
    const target = claims?.find((c) => c.id === id);
    rejectMutation.mutate(id, {
      onSuccess: () => {
        if (target) setLastAction({ claimId: id, name: target.customerName, isConfirm: false });
      },
    });
  };

  const handleUndo = () => {
    if (!lastAction) return;
    undoMutation.mutate(lastAction.claimId, {
      onSuccess: () => setLastAction(null),
    });
  };

  if (isLoading && !claims) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={240} radius={18} />
        <Skeleton width="100%" height={240} radius={18} />
      </Screen>
    );
  }

  const items = claims ?? [];
  const snackbar = lastAction ? (
    <UndoSnackbar
      message={
        lastAction.isConfirm
          ? t('confirmations:confirmedSuccess', { name: lastAction.name })
          : t('confirmations:rejectedSuccess', { name: lastAction.name })
      }
      onUndo={handleUndo}
    />
  ) : undefined;

  return (
    <Screen
      scroll
      footer={snackbar}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <View style={styles.topBar}>
        <Text variant="screenTitle" weight={700} style={styles.title}>
          {t('confirmations:title')}
        </Text>
        {items.length > 0 ? (
          <View style={styles.badge}>
            <Text variant="caption" weight={700} style={styles.badgeText}>
              {t('confirmations:pendingBadge', { count: items.length })}
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="body" color="muted">
        {t('confirmations:subtitle')}
      </Text>

      {items.length === 0 ? (
        <EmptyState
          icon="confirmations"
          title={t('confirmations:emptyTitle')}
          message={t('confirmations:emptySubtitle')}
        />
      ) : (
        <View style={styles.list}>
          {items.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onConfirm={handleConfirm}
              onReject={handleReject}
              isConfirming={confirmMutation.isPending && confirmMutation.variables === claim.id}
              isRejecting={rejectMutation.isPending && rejectMutation.variables === claim.id}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  title: { flex: 1 },
  badge: { backgroundColor: t.status.awaiting.bg, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { color: t.status.awaiting.fg },
  list: { gap: 14, marginTop: 4 },
}));

