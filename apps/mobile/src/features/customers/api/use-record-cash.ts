import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export interface RecordCashInput {
  invoiceId: string;
  amount?: number;
}

export function useRecordCash(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation<InvoiceSummaryDto, Error, RecordCashInput | string>({
    mutationFn: async (input) => {
      const invoiceId = typeof input === 'string' ? input : input.invoiceId;
      const body = typeof input === 'string' || input.amount === undefined ? {} : { amount: input.amount };
      return (await api.post<InvoiceSummaryDto>(`/invoices/${invoiceId}/cash-payment`, body)).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}
