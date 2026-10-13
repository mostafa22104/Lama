import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { type InvoiceStatus, statusKeyFor } from '@lamma/shared';
import { makeStyles, useTheme } from '../../theme';
import { Text } from './Text';

export function StatusChip({ status }: { status: InvoiceStatus }) {
  const styles = useStyles();
  const { status: palette } = useTheme();
  const { t } = useTranslation();
  const key = statusKeyFor(status);
  if (!key) return null;
  const colors = palette[key];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.fg }]} />
      <Text variant="caption" weight={600} style={{ color: colors.fg }}>{t(`common:status.${status}`)}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.chip },
  dot: { width: 7, height: 7, borderRadius: 4 },
}));
