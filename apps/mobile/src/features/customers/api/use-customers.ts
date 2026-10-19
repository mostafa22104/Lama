import { useQuery } from '@tanstack/react-query';
import type { CustomerListItemDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useCustomers(filter?: { search?: string; status?: string }) {
  return useQuery<CustomerListItemDto[]>({
    queryKey: ['customers', filter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter?.search) params['search'] = filter.search;
      if (filter?.status && filter.status !== 'all') params['status'] = filter.status;
      return (await api.get<CustomerListItemDto[]>('/customers', { params })).data;
    },
  });
}
