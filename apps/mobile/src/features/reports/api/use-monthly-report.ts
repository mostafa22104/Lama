import { useQuery } from '@tanstack/react-query';
import type { MonthlyReportDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useMonthlyReport(period?: string) {
  return useQuery<MonthlyReportDto>({
    queryKey: ['reports', 'monthly', period],
    queryFn: async () => {
      const params = period ? { period } : {};
      return (await api.get<MonthlyReportDto>('/reports/monthly', { params })).data;
    },
  });
}
