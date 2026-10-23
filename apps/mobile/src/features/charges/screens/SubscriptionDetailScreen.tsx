import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChargeUpdate } from '@lamma/shared';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Button, Card, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useCustomers } from '../../customers';
import { useChargeAssignedCustomers, useCharges, useUpdateCharge } from '../api/use-charges';
import { AssignCustomersModal } from '../components/AssignCustomersModal';
import { EditChargeModal } from '../components/EditChargeModal';

type DetailRouteProp = RouteProp<MainStackParamList, 'SubscriptionDetail'>;

export function SubscriptionDetailScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<DetailRouteProp>();
  const { chargeId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const { data: charges, isLoading: loadingCharges } = useCharges();
  const { data: assignedIds, isLoading: loadingAssigned } = useChargeAssignedCustomers(chargeId);
  const { data: allCustomers } = useCustomers();
  const updateChargeMutation = useUpdateCharge(chargeId);

  const charge = (charges ?? []).find((c) => c.id === chargeId);
  const currentAssignedIds = assignedIds ?? [];
  const assignedCustomers = (allCustomers ?? []).filter((c) => currentAssignedIds.includes(c.id));

  if (loadingCharges || loadingAssigned || !charge) {
    return <Screen><Skeleton width="100%" height={50} radius={12} /><Skeleton width="100%" height={120} radius={18} /><Skeleton width="100%" height={200} radius={18} /></Screen>;
  }

  const isMonthly = charge.kind === 'monthly';
  const scheduleText = isMonthly ? `يوم ${charge.dayOfMonth} من كل شهر` : `الاستحقاق: ${charge.dueDate ?? 'فوري'}`;

  const handleEditSubmit = (patch: ChargeUpdate) => {
    updateChargeMutation.mutate(patch, {
      onSuccess: () => {
        setEditVisible(false);
        Alert.alert('✅', 'تم تعديل بيانات الاشتراك بنجاح');
      },
      onError: () => Alert.alert('❌', 'فشل تعديل الاشتراك'),
    });
  };

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowBack" size={22} color="ink" />
        </Pressable>
        <Text variant="screenTitle" weight={700} style={styles.title}>{charge.title}</Text>
        <Pressable accessibilityRole="button" onPress={() => setEditVisible(true)} style={styles.backBtn}>
          <Icon name="pencil" size={20} color="ink" />
        </Pressable>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Text variant="caption" weight={700} color="primary">{isMonthly ? 'اشتراك شهري' : 'رسوم إضافية'}</Text>
          </View>
          <Text variant="screenTitle" weight={700} color="primary">{`${charge.amount} ج.م`}</Text>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color="muted" />
            <Text variant="body" color="muted">{scheduleText}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="users" size={16} color="muted" />
            <Text variant="body" color="muted">{`${assignedCustomers.length} عميل مشترك`}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text variant="section">العملاء المشتركين</Text>
        <Button variant="outline" icon="plus" label="إضافة عملاء" onPress={() => setModalVisible(true)} />
      </View>

      {assignedCustomers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Icon name="users" size={32} color="muted" />
          <Text variant="body" weight={600} style={styles.centerText}>مفيش عملاء متسجلين في الاشتراك ده</Text>
          <Text variant="caption" color="muted" style={styles.centerText}>تقدر تضيف عملاء للاشتراك ده في أي وقت</Text>
          <Button label="ضيف عملاء للاشتراك" icon="plus" onPress={() => setModalVisible(true)} />
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {assignedCustomers.map((cust) => (
            <Pressable
              key={cust.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate('CustomerProfile', { customerId: cust.id })}
              style={styles.customerRow}
            >
              <View style={styles.avatar}>
                <Text variant="body" weight={700} color="primary">{cust.name.slice(0, 1)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text variant="body" weight={600}>{cust.name}</Text>
                {cust.phone ? <Text variant="caption" color="muted">{cust.phone}</Text> : null}
              </View>
              <Icon name="chevronForward" size={18} color="muted" />
            </Pressable>
          ))}
        </Card>
      )}

      <AssignCustomersModal
        visible={modalVisible}
        chargeId={charge.id}
        alreadyAssignedIds={currentAssignedIds}
        onClose={() => setModalVisible(false)}
      />
      <EditChargeModal
        visible={editVisible}
        charge={charge}
        isPending={updateChargeMutation.isPending}
        onClose={() => setEditVisible(false)}
        onSubmit={handleEditSubmit}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  summaryCard: { gap: 14, marginVertical: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.colors.chatBg },
  cardDetails: { gap: 8, paddingTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  emptyCard: { alignItems: 'center', padding: 24, gap: 10 },
  centerText: { textAlign: 'center' },
  listCard: { padding: 0, overflow: 'hidden' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.chatBg, alignItems: 'center', justifyContent: 'center' },
  customerInfo: { flex: 1, gap: 2 },
}));
