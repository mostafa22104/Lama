import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../shared/components';
import { makeStyles, useTheme } from '../../theme';

export function SplashScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text variant="display" color="primaryInk">{t('common:appName')}</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24 },
}));
