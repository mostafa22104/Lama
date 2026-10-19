import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessDto, BusinessUsageDto, BusinessUpdate } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useBusiness() {
  return useQuery<BusinessDto>({
    queryKey: ['business'],
    queryFn: async () => (await api.get<BusinessDto>('/business')).data,
  });
}

export function useBusinessUsage() {
  return useQuery<BusinessUsageDto>({
    queryKey: ['business', 'usage'],
    queryFn: async () => (await api.get<BusinessUsageDto>('/business/usage')).data,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation<BusinessDto, Error, BusinessUpdate>({
    mutationFn: async (body) => (await api.patch<BusinessDto>('/business', body)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['business'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}

export function useRequestUpgrade() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post('/business/upgrade-request');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });
}
