import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Text, Toggle } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface BackupToggleCardProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export function BackupToggleCard({ value, onValueChange }: BackupToggleCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconTile}>
          <Icon name="mail" color="primaryInk" size={22} />
        </View>
        <View style={styles.textWrap}>
          <Text variant="body" weight={700}>{t('settings:weeklyBackupTitle')}</Text>
          <Text variant="caption" color="muted">{t('settings:weeklyBackupSubtitle')}</Text>
        </View>
        <Toggle value={value} onChange={onValueChange} label={t('settings:weeklyBackupTitle')} />
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { padding: 14 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 2 },
}));
