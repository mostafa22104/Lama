import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '../../../shared/components';

export function ConfirmationsPlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState icon="confirmations" title={t('common:tabs.confirmations')} message={t('common:comingSoon')} />
    </Screen>
  );
}
