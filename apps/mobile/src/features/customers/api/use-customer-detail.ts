import { useQuery } from '@tanstack/react-query';
import type { CustomerDetailDto, HistoryEventDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useCustomerDetail(customerId: string) {
  return useQuery<CustomerDetailDto>({
    queryKey: ['customers', customerId],
    queryFn: async () => (await api.get<CustomerDetailDto>(`/customers/${customerId}`)).data,
    enabled: Boolean(customerId),
  });
}

export function useCustomerHistory(customerId: string) {
  return useQuery<HistoryEventDto[]>({
    queryKey: ['customers', customerId, 'history'],
    queryFn: async () => (await api.get<HistoryEventDto[]>(`/customers/${customerId}/history`)).data,
    enabled: Boolean(customerId),
  });
}
