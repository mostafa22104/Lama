import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChargeDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useCharges() {
  return useQuery({
    queryKey: ['charges'],
    queryFn: async () => {
      const { data } = await api.get<ChargeDto[]>('/charges');
      return data;
    },
  });
}

export function useChargeAssignedCustomers(chargeId: string) {
  return useQuery({
    queryKey: ['charges', chargeId, 'customers'],
    queryFn: async () => {
      const { data } = await api.get<{ customerIds: string[] }>(`/charges/${chargeId}/customers`);
      return data.customerIds;
    },
    enabled: Boolean(chargeId),
  });
}

export function useAssignCustomers(chargeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerIds: string[]) => {
      const { data } = await api.post<ChargeDto>(`/charges/${chargeId}/customers`, { customerIds });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
      void queryClient.invalidateQueries({ queryKey: ['charges', chargeId] });
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export { useUpdateCharge } from './use-update-charge';

