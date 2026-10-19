import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomerListItemDto } from '@lamma/shared';
import { CustomerRow, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface OverdueSectionProps {
  customers: CustomerListItemDto[];
  onSeeAllCustomers: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export function OverdueSection({ customers, onSeeAllCustomers, onSelectCustomer }: OverdueSectionProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  if (customers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color="muted">{t('home:emptyOverdue')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="section" weight={700}>{t('home:overdueSectionTitle')}</Text>
        <Pressable accessibilityRole="link" onPress={onSeeAllCustomers}>
          <Text variant="caption" weight={600} color="primaryInk">
            {t('home:allCustomersLink')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {customers.map((c) => (
          <CustomerRow
            key={c.id}
            name={c.name}
            subtitle={c.headline ? `${c.headline.title} · ${c.note ?? ''}` : (c.note ?? '')}
            amount={c.balance}
            status={c.status ?? 'overdue'}
            onPress={() => onSelectCustomer(c.id)}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: 8 },
  emptyContainer: { paddingVertical: 16, alignItems: 'center' },
}));
