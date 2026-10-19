import React from 'react';
import { Linking, Pressable, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useMarkReminderSent } from '../api/use-mark-reminder-sent';
import { useTodayReminders } from '../api/use-today-reminders';
import { ReminderRow } from '../components/ReminderRow';
import { RemindersProgressCard } from '../components/RemindersProgressCard';

export function RemindersScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useTodayReminders();
  const markSentMutation = useMarkReminderSent();

  if (isLoading || !data) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={120} radius={18} />
        <Skeleton width="100%" height={68} radius={16} />
        <Skeleton width="100%" height={68} radius={16} />
      </Screen>
    );
  }

  const handleSendOne = (item: (typeof data.items)[number]) => {
    void Linking.openURL(item.waUrl);
    markSentMutation.mutate({ invoiceId: item.invoiceId, kind: item.kind });
  };

  const handleSendAll = () => {
    data.items
      .filter((i) => !i.sent)
      .forEach((item) => {
        markSentMutation.mutate({ invoiceId: item.invoiceId, kind: item.kind });
      });
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowBack" size={22} color="ink" />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text variant="screenTitle" weight={700}>{t('reminders:screenTitle')}</Text>
          <Text variant="caption" color="muted">{data.date}</Text>
        </View>
      </View>

      <RemindersProgressCard
        sentCount={data.sentCount}
        total={data.total}
        onSendAll={handleSendAll}
        disabled={markSentMutation.isPending}
      />

      {data.items.length === 0 ? (
        <EmptyState icon="bell" title={t('reminders:emptyReminders')} />
      ) : (
        <View style={styles.list}>
          {data.items.map((item) => (
            <ReminderRow
              key={item.invoiceId}
              item={item}
              onSend={() => handleSendOne(item)}
              isSending={markSentMutation.isPending}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 2 },
  list: { gap: 8 },
}));
