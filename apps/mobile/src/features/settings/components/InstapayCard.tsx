import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface InstapayCardProps {
  instapayAddress: string;
}

export function InstapayCard({ instapayAddress }: InstapayCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text variant="section" weight={700}>{t('settings:instapayTitle')}</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text variant="caption" color="muted">{t('settings:instapaySubtitle')}</Text>
          <Text variant="body" weight={600} style={styles.addressText}>{instapayAddress}</Text>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 4, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  col: { flex: 1, gap: 2 },
  addressText: { writingDirection: 'ltr', textAlign: 'left' },
}));
