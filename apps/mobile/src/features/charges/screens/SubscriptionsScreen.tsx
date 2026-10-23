import React from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Button, Card, EmptyState, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useCharges } from '../api/use-charges';

export function SubscriptionsScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: charges, isLoading, refetch, isRefetching } = useCharges();

  const list = charges ?? [];

  const handleAddNew = () => {
    navigation.navigate('AddCharge', { returnTo: 'Subscriptions' });
  };

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />}
    >
      <View style={styles.topBar}>
        {navigation.canGoBack() ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrowBack" size={22} color="ink" />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text variant="screenTitle" weight={700}>الاشتراكات والرسوم</Text>
          <Text variant="caption" color="muted">{`${list.length} اشتراك متاح`}</Text>
        </View>
        <Button label="+ اشتراك جديد" onPress={handleAddNew} />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton width="100%" height={90} radius={18} />
          <Skeleton width="100%" height={90} radius={18} />
          <Skeleton width="100%" height={90} radius={18} />
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="مفيش اشتراكات متسجلة"
          message="ضيف أول اشتراك أو رسم مالي عشان تسجل عليه العملاء وتتابع التحصيل"
          action={<Button label="+ إضافة اشتراك" onPress={handleAddNew} />}
        />
      ) : (
        <View style={styles.list}>
          {list.map((c) => {
            const isMonthly = c.kind === 'monthly';
            const schedule = isMonthly ? `يوم ${c.dayOfMonth} شهرياً` : `الاستحقاق: ${c.dueDate ?? 'فوري'}`;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('SubscriptionDetail', { chargeId: c.id })}
              >
                <Card style={styles.card}>
                  <View style={styles.cardMain}>
                    <View style={styles.infoCol}>
                      <View style={styles.headerRow}>
                        <Text variant="section">{c.title}</Text>
                        <View style={styles.badge}>
                          <Text variant="caption" weight={600} color="primary">
                            {isMonthly ? 'شهري' : 'مرة واحدة'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.metaRow}>
                        <Icon name="calendar" size={14} color="muted" />
                        <Text variant="caption" color="muted">{schedule}</Text>
                        <Text variant="caption" color="muted">•</Text>
                        <Icon name="users" size={14} color="muted" />
                        <Text variant="caption" color="muted">{`${c.customerCount} عميل`}</Text>
                      </View>
                    </View>
                    <View style={styles.amountCol}>
                      <Text variant="body" weight={700} color="primary">{`${c.amount} ج.م`}</Text>
                      <Icon name="chevronForward" size={18} color="muted" />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, marginBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 2 },
  list: { gap: 12 },
  card: { padding: 16 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flex: 1, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: t.colors.chatBg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amountCol: { alignItems: 'flex-end', gap: 8, paddingLeft: 8 },
}));
