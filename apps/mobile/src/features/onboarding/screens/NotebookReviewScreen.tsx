import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MainStackParamList } from '../../../app/navigation/types';
import { api } from '../../../core/api/instances';
import { Button, Card, Icon, Screen, StepHeader, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ExtractedCustomer {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
}

const DEFAULT_EXTRACTED: ExtractedCustomer[] = [
  { id: '1', name: 'محمود حسن', phone: '+201011112222', selected: true },
  { id: '2', name: 'سارة عادل', phone: '+201022223333', selected: true },
  { id: '3', name: 'كريم فتحي', phone: '+201033334444', selected: true },
  { id: '4', name: 'منى إبراهيم', phone: '+201044445555', selected: true },
  { id: '5', name: 'أحمد السيد', phone: '+201055556666', selected: true },
];

export function NotebookReviewScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ExtractedCustomer[]>(DEFAULT_EXTRACTED);

  const saveBatchMutation = useMutation({
    mutationFn: async (customers: { name: string; phone: string }[]) => {
      const { data } = await api.post('/customers/batch', { customers });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
      navigation.navigate('AddCharge');
    },
  });

  const toggleSelect = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const handleSave = () => {
    const toSave = items.filter((i) => i.selected).map((i) => ({ name: i.name, phone: i.phone }));
    if (toSave.length === 0) {
      navigation.navigate('AddCharge');
      return;
    }
    saveBatchMutation.mutate(toSave);
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={`احفظ وكمّل (${selectedCount} عملاء)`}
          loading={saveBatchMutation.isPending}
          onPress={handleSave}
        />
      }
    >
      <StepHeader
        title="راجع أسماء الكشكول"
        step={2}
        total={4}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <Text variant="body" color="muted" style={styles.subtitle}>
        قرينا {items.length} أسماء من الكشكول، راجعهم واضغط حفظ
      </Text>

      <Card style={styles.listCard}>
        {items.map((cust) => (
          <Pressable
            key={cust.id}
            accessibilityRole="checkbox"
            onPress={() => toggleSelect(cust.id)}
            style={styles.row}
          >
            <View style={[styles.checkbox, cust.selected ? styles.checkboxChecked : undefined]}>
              {cust.selected ? <Icon name="check" size={16} color="onPrimary" /> : null}
            </View>
            <View style={styles.rowInfo}>
              <Text variant="body" weight={600}>{cust.name}</Text>
              <Text variant="caption" color="muted">{cust.phone}</Text>
            </View>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  subtitle: { marginBottom: 12 },
  listCard: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.line,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: t.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
  },
  rowInfo: { flex: 1, gap: 2 },
}));
