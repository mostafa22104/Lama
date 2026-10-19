import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface TeamCardProps {
  ownerName: string;
}

export function TeamCard({ ownerName }: TeamCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="section" weight={700}>{t('settings:teamTitle')}</Text>
        <View style={styles.proBadge}>
          <Icon name="lock" size={12} color="gold" />
          <Text variant="caption" weight={700} style={styles.proText}>{t('settings:proBadge')}</Text>
        </View>
      </View>

      <View style={styles.ownerRow}>
        <Avatar name={ownerName} size={40} />
        <View style={styles.ownerText}>
          <Text variant="body" weight={600}>{ownerName}</Text>
          <Text variant="caption" color="muted">{t('settings:ownerBadge')}</Text>
        </View>
      </View>

      <Button
        label={t('settings:addTeamMember')}
        variant="outline"
        icon="lock"
        disabled
        onPress={() => {}}
      />

      <Text variant="caption" color="muted" style={styles.hint}>
        {t('settings:teamProHint')}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.colors.goldSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  proText: { color: t.colors.gold },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerText: { flex: 1, gap: 2 },
  hint: { lineHeight: 18 },
}));
