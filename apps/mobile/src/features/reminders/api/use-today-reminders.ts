import { useQuery } from '@tanstack/react-query';
import type { TodayRemindersDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export const TODAY_REMINDERS_QUERY_KEY = ['reminders', 'today'] as const;

export function useTodayReminders() {
  return useQuery<TodayRemindersDto>({
    queryKey: TODAY_REMINDERS_QUERY_KEY,
    queryFn: async () => (await api.get<TodayRemindersDto>('/reminders/today')).data,
  });
}
