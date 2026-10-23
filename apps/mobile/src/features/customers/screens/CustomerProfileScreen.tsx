import React, { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useCustomerDetail, useCustomerHistory } from '../api/use-customer-detail';
import { useRecordCash } from '../api/use-record-cash';
import { useUpdateCustomer } from '../api/use-update-customer';
import { CustomerBalanceCard } from '../components/CustomerBalanceCard';
import { CustomerProfileHeader } from '../components/CustomerProfileHeader';
import { CustomerTimeline } from '../components/CustomerTimeline';
import { EditCustomerModal } from '../components/EditCustomerModal';
import { RecordCashModal } from '../components/RecordCashModal';

export function CustomerProfileScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, 'CustomerProfile'>>();
  const { customerId } = route.params;

  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { data: customer, isLoading } = useCustomerDetail(customerId);
  const { data: history } = useCustomerHistory(customerId);
  const recordCashMutation = useRecordCash(customerId);
  const updateCustomerMutation = useUpdateCustomer(customerId);

  if (isLoading || !customer) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={80} radius={16} />
        <Skeleton width="100%" height={180} radius={18} />
      </Screen>
    );
  }

  const openInvoices = customer.openInvoices ?? [];
  const hasOpenInvoices = openInvoices.length > 0;

  const handleSendReminder = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    void Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const handleRecordCashSubmit = (invoiceId: string, amount: number) => {
    recordCashMutation.mutate(
      { invoiceId, amount },
      {
        onSuccess: () => {
          setCashModalOpen(false);
          Alert.alert('✅', 'تم تسجيل الدفع كاش بنجاح');
        },
        onError: () => {
          Alert.alert('❌', 'حدث خطأ أثناء تسجيل الدفع');
        },
      },
    );
  };

  const handleEditSubmit = (patch: { name: string; phone: string; note?: string }) => {
    updateCustomerMutation.mutate(patch, {
      onSuccess: () => {
        setEditModalOpen(false);
        Alert.alert('✅', 'تم تعديل بيانات العميل بنجاح');
      },
      onError: () => {
        Alert.alert('❌', 'فشل تعديل بيانات العميل');
      },
    });
  };

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowBack" size={22} color="ink" />
        </Pressable>
        <Text variant="screenTitle" weight={700} style={styles.title} numberOfLines={1}>
          {customer.name}
        </Text>
      </View>

      <CustomerProfileHeader name={customer.name} phone={customer.phone} note={customer.note} />

      <CustomerBalanceCard
        balance={customer.balance}
        status={customer.status}
        nextDue={customer.nextDue}
        onSendReminder={handleSendReminder}
        onEdit={() => setEditModalOpen(true)}
        onRecordCash={hasOpenInvoices ? () => setCashModalOpen(true) : undefined}
        isRecordingCash={recordCashMutation.isPending}
      />

      {history && history.length > 0 ? <CustomerTimeline events={history} /> : null}

      <RecordCashModal
        visible={cashModalOpen}
        invoices={openInvoices}
        isPending={recordCashMutation.isPending}
        onClose={() => setCashModalOpen(false)}
        onSubmit={handleRecordCashSubmit}
      />

      <EditCustomerModal
        visible={editModalOpen}
        customer={customer}
        isPending={updateCustomerMutation.isPending}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />
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
  title: { flex: 1 },
}));
