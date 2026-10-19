import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentClaimItemDto } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useClaims() {
  return useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const { data } = await api.get<PaymentClaimItemDto[]>('/payments/claims');
      return data;
    },
  });
}

export function useConfirmClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data } = await api.post<{ success: true }>(`/payments/claims/${claimId}/confirm`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}

export function useRejectClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data } = await api.post<{ success: true }>(`/payments/claims/${claimId}/reject`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}

export function useUndoClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data } = await api.post<{ success: true }>(`/payments/claims/${claimId}/undo`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] });
    },
  });
}
