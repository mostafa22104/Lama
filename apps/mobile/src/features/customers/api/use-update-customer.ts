import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CustomerDto, CustomerUpdate } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: CustomerUpdate) => {
      const { data } = await api.patch<CustomerDto>(`/customers/${customerId}`, patch);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
