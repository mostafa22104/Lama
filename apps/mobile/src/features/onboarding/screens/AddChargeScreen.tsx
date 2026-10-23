import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChargeCollectionTiming, ChargeDto, CustomerListItemDto } from '@lamma/shared';
import type { MainStackParamList } from '../../../app/navigation/types';
import { api } from '../../../core/api/instances';
import { Button, DatePickerField, Screen, StepHeader, Text, TextField } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { ChargeCustomerPicker } from '../components/ChargeCustomerPicker';
import { ChargeTypeSelector } from '../components/ChargeTypeSelector';
import { CollectionTimingSelector } from '../components/CollectionTimingSelector';

const saveLabel = (n: number, isSub: boolean) =>
  n === 0 ? (isSub ? 'حفظ وإضافة عملاء لاحقاً' : 'اختار عميل على الأقل') : n === 1 ? 'احفظ لـ عميل واحد' : n === 2 ? 'احفظ لـ عميلين' : n <= 10 ? `احفظ لـ ${n} عملاء` : `احفظ لـ ${n} عميل`;

export function AddChargeScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isSubFlow = (() => {
    try { return useRoute<RouteProp<MainStackParamList, 'AddCharge'>>()?.params?.returnTo === 'Subscriptions'; } catch { return false; }
  })();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<'monthly' | 'one_time'>('monthly');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('450');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [collectionTiming, setCollectionTiming] = useState<ChargeCollectionTiming>('beginning');
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get<CustomerListItemDto[]>('/customers')).data,
  });

  const list = customers ?? [];
  const activeSelected = selectedIds ?? (isSubFlow ? [] : list.map((c) => c.id));
  const allSelected = list.length > 0 && activeSelected.length === list.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const cur = prev ?? (isSubFlow ? [] : list.map((c) => c.id));
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    });
  };

  const createChargeMutation = useMutation({
    mutationFn: async () => {
      const isAll = list.length > 0 && activeSelected.length === list.length;
      const startDay = Number(startDate.slice(8, 10)) || 1;
      const calculatedDayOfMonth = collectionTiming === 'end' ? 31 : startDay;
      return (await api.post<ChargeDto>('/charges', {
        kind,
        title: title.trim() || (kind === 'monthly' ? 'اشتراك شهري' : 'رسوم إضافية'),
        amount: parseInt(amount, 10) || 450,
        dayOfMonth: kind === 'monthly' ? calculatedDayOfMonth : undefined,
        dueDate: kind === 'one_time' ? startDate : undefined,
        startDate,
        collectionTiming,
        assignTo: isAll ? 'all' : 'selected',
        customerIds: isAll ? undefined : activeSelected,
      })).data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (isSubFlow) navigation.replace('SubscriptionDetail', { chargeId: data.id });
      else navigation.navigate('ReminderSettings');
    },
  });

  return (
    <Screen
      scroll
      footer={
        <Button
          label={list.length === 0 ? 'حفظ الاشتراك' : saveLabel(activeSelected.length, isSubFlow)}
          disabled={!isSubFlow && list.length > 0 && activeSelected.length === 0}
          loading={createChargeMutation.isPending}
          onPress={() => createChargeMutation.mutate()}
        />
      }
    >
      <StepHeader
        title={isSubFlow ? 'إضافة اشتراك جديد' : t('onboarding:addChargeTitle')}
        step={isSubFlow ? undefined : 3}
        total={isSubFlow ? undefined : 4}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />
      <View style={styles.section}>
        <TextField
          label="اسم الاشتراك / الرسم"
          value={title}
          onChangeText={setTitle}
          placeholder={kind === 'monthly' ? 'مثلاً: اشتراك شهري، باقة الجيم' : 'مثلاً: كامب الصيف أو تيشيرت'}
        />
      </View>
      <View style={styles.section}>
        <Text variant="body" weight={600}>{t('onboarding:typeQuestion')}</Text>
        <ChargeTypeSelector value={kind} onChange={setKind} />
      </View>
      <View style={styles.section}>
        <TextField label={kind === 'monthly' ? t('onboarding:amountLabel') : 'المبلغ'} value={amount} onChangeText={setAmount} keyboardType="number-pad" suffix="ج.م" />
      </View>
      <View style={styles.section}>
        <DatePickerField label="تاريخ بداية الاشتراك" value={startDate} onChange={setStartDate} />
      </View>
      <View style={styles.section}>
        <Text variant="body" weight={600}>ميعاد التحصيل المطلوب</Text>
        <CollectionTimingSelector value={collectionTiming} onChange={setCollectionTiming} />
      </View>
      {list.length > 0 ? (
        <ChargeCustomerPicker
          customers={list}
          selectedIds={activeSelected}
          onToggle={toggleSelect}
          onToggleAll={() => setSelectedIds(allSelected ? [] : list.map((c) => c.id))}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  section: { gap: 8, marginVertical: 8 },
}));
