import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerListItemDto } from '@lamma/shared';
import type { MainStackParamList } from '../../../app/navigation/types';
import { api } from '../../../core/api/instances';
import { Button, Screen, StepHeader, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { ChargeTypeSelector } from '../components/ChargeTypeSelector';
import { DueDaySelector } from '../components/DueDaySelector';

export function AddChargeScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<'monthly' | 'one_time'>('monthly');
  const [amount, setAmount] = useState('450');
  const [dueDay, setDueDay] = useState(20);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<CustomerListItemDto[]>('/customers');
      return data;
    },
  });

  const list = customers ?? [];

  const createChargeMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseInt(amount, 10) || 450;
      const { data } = await api.post('/charges', {
        title: kind === 'monthly' ? 'اشتراك شهري' : 'رسوم إضافية',
        amount: parsedAmount,
        kind: kind === 'monthly' ? 'recurring_monthly' : 'one_time',
        dueDay: kind === 'monthly' ? dueDay : undefined,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
      navigation.navigate('ReminderSettings');
    },
  });

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('onboarding:saveForCount', { count: list.length || 1 })}
          loading={createChargeMutation.isPending}
          onPress={() => createChargeMutation.mutate()}
        />
      }
    >
      <StepHeader
        title={t('onboarding:addChargeTitle')}
        step={3}
        total={4}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <View style={styles.section}>
        <Text variant="body" weight={600}>{t('onboarding:typeQuestion')}</Text>
        <ChargeTypeSelector value={kind} onChange={setKind} />
      </View>

      <View style={styles.section}>
        <Text variant="body" weight={600}>{t('onboarding:amountLabel')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            style={styles.input}
          />
          <View style={styles.currencyBadge}>
            <Text variant="body" weight={600} color="muted">ج.م</Text>
          </View>
        </View>
      </View>

      {kind === 'monthly' ? (
        <View style={styles.section}>
          <Text variant="body" weight={600}>{t('onboarding:dayQuestion')}</Text>
          <DueDaySelector value={dueDay} onChange={setDueDay} />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: 8, marginVertical: 8 },
  inputWrap: {
    flexDirection: 'row',
    height: 52,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 18, color: t.colors.ink, textAlign: 'right' },
  currencyBadge: { paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: t.colors.line },
}));
