import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

export type CustomerFilterKey = 'all' | 'overdue' | 'due_soon' | 'awaiting_confirmation' | 'paid';

interface CustomerFilterPillsProps {
  selected: CustomerFilterKey;
  onSelect: (key: CustomerFilterKey) => void;
}

const FILTERS: { key: CustomerFilterKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'customers:filters.all' },
  { key: 'overdue', labelKey: 'customers:filters.overdue' },
  { key: 'due_soon', labelKey: 'customers:filters.dueSoon' },
  { key: 'awaiting_confirmation', labelKey: 'customers:filters.awaiting' },
  { key: 'paid', labelKey: 'customers:filters.paid' },
];

export function CustomerFilterPills({ selected, onSelect }: CustomerFilterPillsProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((f) => {
          const isActive = selected === f.key;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onSelect(f.key)}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
            >
              <Text
                variant="caption"
                weight={600}
                style={isActive ? styles.textActive : styles.textInactive}
              >
                {t(f.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { marginHorizontal: -t.spacing.screenPaddingX },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: t.spacing.screenPaddingX },
  pill: { height: 38, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: t.colors.ink, borderWidth: 1.5, borderColor: t.colors.ink },
  pillInactive: { backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.inputBorder },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: t.colors.ink },
}));
