import { useQuery } from '@tanstack/react-query';
import type { HomeDashboardDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export const HOME_DASHBOARD_QUERY_KEY = ['dashboard', 'home'] as const;

export function useHomeDashboard() {
  return useQuery<HomeDashboardDto>({
    queryKey: HOME_DASHBOARD_QUERY_KEY,
    queryFn: async () => (await api.get<HomeDashboardDto>('/dashboard/home')).data,
  });
}
