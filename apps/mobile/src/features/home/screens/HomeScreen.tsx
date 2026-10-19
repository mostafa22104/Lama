import React from 'react';
import { RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Screen, Skeleton } from '../../../shared/components';
import { useHomeDashboard } from '../api/use-home-dashboard';
import { CollectionProgressCard } from '../components/CollectionProgressCard';
import { HomeGreeting } from '../components/HomeGreeting';
import { HomeStatCards } from '../components/HomeStatCards';
import { OverdueSection } from '../components/OverdueSection';
import { TodayRemindersCard } from '../components/TodayRemindersCard';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, isLoading, refetch, isRefetching } = useHomeDashboard();

  if (isLoading || !data) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={140} radius={18} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width="48%" height={90} radius={18} />
          <Skeleton width="48%" height={90} radius={18} />
        </View>
        <Skeleton width="100%" height={120} radius={18} />
      </Screen>
    );
  }

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
      <HomeGreeting
        businessName={data.businessName}
        onOpenSettings={() => navigation.navigate('Settings')}
      />

      <CollectionProgressCard
        period={data.period}
        expected={data.expected}
        collected={data.collected}
        remaining={data.remaining}
        collectedPercent={data.collectedPercent}
        onOpenReport={() => navigation.navigate('Tabs', { screen: 'Reports' } as never)}
      />

      <HomeStatCards
        overdueAmount={data.overdue.amount}
        overdueCustomerCount={data.overdue.customerCount}
        awaitingCount={data.awaitingConfirmationCount}
        onOverduePress={() => navigation.navigate('Tabs', { screen: 'Customers' } as never)}
        onAwaitingPress={() => navigation.navigate('Tabs', { screen: 'Confirmations' } as never)}
      />

      <TodayRemindersCard
        total={data.todayReminders.total}
        preview={data.todayReminders.preview}
        onOpenReminders={() => navigation.navigate('Reminders')}
        onSendAll={() => navigation.navigate('Reminders')}
      />

      <OverdueSection
        customers={data.overdueCustomers}
        onSeeAllCustomers={() => navigation.navigate('Tabs', { screen: 'Customers' } as never)}
        onSelectCustomer={(customerId) => navigation.navigate('CustomerProfile', { customerId })}
      />
    </Screen>
  );
}
