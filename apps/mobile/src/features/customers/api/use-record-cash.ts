import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useRecordCash(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation<InvoiceSummaryDto, Error, string>({
    mutationFn: async (invoiceId: string) =>
      (await api.post<InvoiceSummaryDto>(`/invoices/${invoiceId}/cash-payment`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}
