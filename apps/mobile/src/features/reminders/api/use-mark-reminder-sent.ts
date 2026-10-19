import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReminderKind } from '@lamma/shared';
import { api } from '../../../core/api/instances';
import { TODAY_REMINDERS_QUERY_KEY } from './use-today-reminders';

interface MarkSentParams {
  invoiceId: string;
  kind: ReminderKind;
}

export function useMarkReminderSent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, MarkSentParams>({
    mutationFn: async ({ invoiceId, kind }) => {
      await api.post(`/reminders/${invoiceId}/sent`, { kind });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TODAY_REMINDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}
