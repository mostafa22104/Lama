import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChargeDto, ChargeUpdate } from '@lamma/shared';
import { api } from '../../../core/api/instances';

export function useUpdateCharge(chargeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ChargeUpdate) => {
      const { data } = await api.patch<ChargeDto>(`/charges/${chargeId}`, patch);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['charges'] });
      void queryClient.invalidateQueries({ queryKey: ['charges', chargeId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
