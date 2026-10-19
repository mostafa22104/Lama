import React, { useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Screen, Skeleton } from '../../../shared/components';
import { useMonthlyReport } from '../api/use-monthly-report';
import { MonthComparisonCard } from '../components/MonthComparisonCard';
import { MonthSelector } from '../components/MonthSelector';
import { ReportHeroCard } from '../components/ReportHeroCard';
import { ReportOverdueList } from '../components/ReportOverdueList';
import { ReportSummaryCards } from '../components/ReportSummaryCards';

export function ReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [period, setPeriod] = useState('2026-10');
  const { data, isLoading, refetch, isRefetching } = useMonthlyReport(period);

  const handlePrev = () => {
    const [y, m] = period.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = String(prevDate.getMonth() + 1).padStart(2, '0');
    setPeriod(`${newY}-${newM}`);
  };

  const handleNext = () => {
    const [y, m] = period.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = String(nextDate.getMonth() + 1).padStart(2, '0');
    setPeriod(`${newY}-${newM}`);
  };

  if (isLoading || !data) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={160} radius={22} />
        <Skeleton width="100%" height={140} radius={18} />
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
      <MonthSelector period={period} onPrev={handlePrev} onNext={handleNext} />
      <ReportHeroCard collected={data.collected} expected={data.expected} />
      <MonthComparisonCard currentCollected={data.collected} previousCollected={data.previousCollected} />
      <ReportSummaryCards
        paidCount={data.paidInvoiceCount}
        totalCount={data.invoiceCount}
        lateCount={data.stillLate.length}
      />
      <ReportOverdueList
        customers={data.stillLate}
        onRemindPress={() => navigation.navigate('Reminders')}
        onDownloadExcel={() => Alert.alert('Excel', 'تم تجهيز التقرير وجاري التحميل')}
        onSelectCustomer={(customerId) => navigation.navigate('CustomerProfile', { customerId })}
      />
    </Screen>
  );
}
