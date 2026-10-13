import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '../../../shared/components';

export function ReportsPlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState icon="reports" title={t('common:tabs.reports')} message={t('common:comingSoon')} />
    </Screen>
  );
}
