import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, SegmentedControl, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import type { ThemeMode } from '../../../theme/resolve-theme';
import { useThemeStore } from '../../../theme/theme-store';

export function AppearanceCard() {
  const styles = useStyles();
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const options: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings:themeSystem', 'تلقائي') },
    { value: 'light', label: t('settings:themeLight', 'فاتح') },
    { value: 'dark', label: t('settings:themeDark', 'داكن') },
  ];

  return (
    <Card style={styles.card}>
      <Text variant="section" weight={700}>{t('settings:themeSection')}</Text>
      <SegmentedControl options={options} value={mode} onChange={setMode} />
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 10, paddingVertical: 14 },
}));
