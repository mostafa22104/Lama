import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessDto } from '@lamma/shared';
import { Card, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface BusinessInfoCardProps {
  business: BusinessDto;
}

export function BusinessInfoCard({ business }: BusinessInfoCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text variant="section" weight={700}>{t('settings:businessInfoTitle')}</Text>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text variant="caption" color="muted">{t('settings:nameLabel')}</Text>
          <Text variant="body" weight={600}>{business.name}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text variant="caption" color="muted">{t('settings:typeLabel')}</Text>
          <Text variant="body" weight={600}>
            {t(`common:businessType.${business.type}`)}
          </Text>
        </View>
      </View>

      {business.phone ? (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text variant="caption" color="muted">{t('settings:phoneLabel')}</Text>
            <Text variant="body" weight={600} style={styles.phoneText}>{business.phone}</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 4, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  col: { flex: 1, gap: 2 },
  phoneText: { writingDirection: 'ltr', textAlign: 'left' },
}));
