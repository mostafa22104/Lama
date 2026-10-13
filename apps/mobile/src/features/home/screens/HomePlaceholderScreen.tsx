import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen } from '../../../shared/components';

export function HomePlaceholderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Screen>
      <EmptyState icon="home" title={t('common:tabs.home')} message={t('common:comingSoon')} />
      {__DEV__ ? (
        <Button
          label="Component gallery"
          variant="outline"
          onPress={() => navigation.getParent()?.navigate('ComponentGallery' as never)}
        />
      ) : null}
    </Screen>
  );
}
