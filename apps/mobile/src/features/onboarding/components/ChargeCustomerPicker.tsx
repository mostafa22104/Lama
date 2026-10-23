import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomerListItemDto } from '@lamma/shared';
import { Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  customers: CustomerListItemDto[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export function ChargeCustomerPicker({ customers, selectedIds, onToggle, onToggleAll }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const allSelected = customers.length > 0 && selectedIds.length === customers.length;

  return (
    <View style={styles.section}>
      <View style={styles.whoHeader}>
        <Text variant="body" weight={600}>{t('onboarding:forWho')}</Text>
        <Pressable accessibilityRole="button" onPress={onToggleAll}>
          <Text variant="caption" weight={700} color="primary">
            {allSelected ? t('onboarding:deselectAll') : t('onboarding:selectAll')}
          </Text>
        </Pressable>
      </View>
      <Card style={styles.listCard}>
        {customers.map((cust) => {
          const isSel = selectedIds.includes(cust.id);
          return (
            <Pressable key={cust.id} accessibilityRole="checkbox" onPress={() => onToggle(cust.id)} style={styles.row}>
              <View style={[styles.checkbox, isSel ? styles.checkboxChecked : undefined]}>
                {isSel ? <Icon name="check" size={16} color="onPrimary" /> : null}
              </View>
              <View style={styles.rowInfo}>
                <Text variant="body" weight={600}>{cust.name}</Text>
                {cust.phone ? <Text variant="caption" color="muted">{cust.phone}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: 8, marginVertical: 8 },
  whoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: t.colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  rowInfo: { flex: 1, gap: 2 },
}));
