import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../../core/api/instances';
import { Button, Card, Icon, Screen, Text, TextField } from '../../../shared/components';
import { makeStyles } from '../../../theme';

export function AddManualCustomerScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('تنبيه', 'تأكد من كتابة الاسم ورقم الموبايل بشكل صحيح');
    },
  });

  const canSave = name.trim().length >= 2 && phone.trim().length >= 10;

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('customers:saveCustomer')}
          disabled={!canSave}
          loading={addMutation.isPending}
          onPress={() => addMutation.mutate()}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowBack" size={22} color="ink" />
        </Pressable>
        <Text variant="screenTitle" weight={700} style={styles.title}>
          {t('customers:addManualTitle')}
        </Text>
      </View>

      <Card style={styles.card}>
        <TextField
          label={t('customers:nameLabel')}
          value={name}
          onChangeText={setName}
          placeholder={t('customers:namePlaceholder')}
        />

        <TextField
          label={t('customers:phoneLabel')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('customers:phonePlaceholder')}
          keyboardType="phone-pad"
        />

        <TextField
          label={t('customers:noteLabel')}
          value={note}
          onChangeText={setNote}
          placeholder={t('customers:notePlaceholder')}
        />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, marginBottom: 8 },
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
  card: { gap: 16, padding: 18 },
}));
