import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '../../../shared/components';

export function CustomersPlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState icon="users" title={t('common:tabs.customers')} message={t('common:comingSoon')} />
    </Screen>
  );
}
