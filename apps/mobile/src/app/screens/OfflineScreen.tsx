import React from 'react';
import { useTranslation } from 'react-i18next';
import { restoreSession } from '../../features/auth';
import { Button, EmptyState, Screen } from '../../shared/components';

export function OfflineScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false}>
      <EmptyState
        icon="alert"
        title={t('common:offlineTitle')}
        message={t('common:network')}
        action={<Button label={t('common:retry')} onPress={() => void restoreSession()} />}
      />
    </Screen>
  );
}
