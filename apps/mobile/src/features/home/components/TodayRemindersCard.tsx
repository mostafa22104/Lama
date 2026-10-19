import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface TodayRemindersCardProps {
  total: number;
  preview: { customerName: string }[];
  onOpenReminders: () => void;
  onSendAll: () => void;
}

export function TodayRemindersCard({ total, preview, onOpenReminders, onSendAll }: TodayRemindersCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  if (total === 0) return null;

  return (
    <Card style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onOpenReminders} style={styles.header}>
        <View style={styles.iconTile}>
          <Icon name="bell" color="whatsapp" size={22} />
        </View>
        <Text variant="section" weight={700} style={styles.title}>
          {t('home:remindersToday', { count: total })}
        </Text>
        <Icon name="chevronForward" color="muted" size={22} />
      </Pressable>

      <View style={styles.avatarStack}>
        {preview.slice(0, 4).map((p, idx) => (
          <View key={idx} style={[styles.avatarWrap, idx > 0 ? styles.avatarOverlap : null]}>
            <Avatar name={p.customerName} size={34} />
          </View>
        ))}
        {total > 4 ? (
          <Text variant="caption" color="muted" style={styles.plusCount}>
            {t('home:plusMore', { count: total - 4 })}
          </Text>
        ) : null}
      </View>

      <Button
        label={t('home:sendAll')}
        variant="whatsapp"
        icon="whatsapp"
        onPress={onSendAll}
      />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: t.colors.whatsappSoft, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  avatarStack: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  avatarWrap: { borderWidth: 2, borderColor: t.colors.surface, borderRadius: 19 },
  avatarOverlap: { marginStart: -8 },
  plusCount: { marginStart: 8 },
}));
