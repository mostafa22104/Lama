import React, { useState } from 'react';
import { Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MainStackParamList } from '../../../app/navigation/types';
import { CustomerRow, EmptyState, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { useCustomers } from '../api/use-customers';
import { CustomerFilterPills, type CustomerFilterKey } from '../components/CustomerFilterPills';

export function CustomersScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilterKey>('all');

  const { data, isLoading, refetch, isRefetching } = useCustomers({
    search: search.trim() || undefined,
    status: filter === 'all' ? undefined : filter,
  });

  const customers = data ?? [];

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <View style={styles.topHeader}>
        <View style={styles.titleWrap}>
          <Text variant="screenTitle" weight={700}>{t('customers:title')}</Text>
          <Text variant="caption" color="muted">
            {t('customers:customerCount', { count: customers.length })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddCustomers' as never)}
          style={styles.addBtn}
        >
          <Icon name="plus" color="surface" size={18} />
          <Text variant="caption" weight={700} style={styles.addBtnText}>
            {t('customers:addCustomer')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" color="muted" size={20} />
        <TextInput
          accessibilityLabel={t('customers:searchA11y')}
          placeholder={t('customers:searchPlaceholder')}
          placeholderTextColor="#9E988D"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Icon name="close" color="muted" size={18} />
          </Pressable>
        ) : null}
      </View>

      <CustomerFilterPills selected={filter} onSelect={setFilter} />

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton width="100%" height={68} radius={16} />
          <Skeleton width="100%" height={68} radius={16} />
          <Skeleton width="100%" height={68} radius={16} />
        </View>
      ) : customers.length === 0 ? (
        <EmptyState
          icon="users"
          title={search ? t('customers:emptySearch') : t('customers:emptyList')}
        />
      ) : (
        <View style={styles.list}>
          {customers.map((c) => (
            <CustomerRow
              key={c.id}
              name={c.name}
              subtitle={c.headline ? `${c.headline.title} · ${c.note ?? ''}` : (c.note ?? '')}
              amount={c.balance}
              status={c.status ?? 'paid'}
              onPress={() => navigation.navigate('CustomerProfile', { customerId: c.id })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  titleWrap: { gap: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: t.colors.primary,
  },
  addBtnText: { color: '#FFFFFF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    backgroundColor: t.colors.surface,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 16, color: t.colors.ink, textAlign: 'right' },
  list: { gap: 8 },
}));
