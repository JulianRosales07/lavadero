import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { EmployeePayout, EmployeePayoutSummary, PayoutType, PaymentMethod } from '@/lib/types';
import type { RangeValue } from '@/components/shared/range-filter';

const rangeParams = (range: RangeValue) => ({
  preset: range.preset,
  from: range.preset === 'custom' ? range.from : undefined,
  to: range.preset === 'custom' ? range.to : undefined,
});

export function useEmployeePayouts(range: RangeValue, employeeId?: string) {
  return useQuery({
    queryKey: ['employee-payouts', range, employeeId],
    queryFn: () =>
      api.get<{ range: any; total: number; count: number; data: EmployeePayout[] }>(
        '/api/employee-payouts',
        {
          ...rangeParams(range),
          employeeId: employeeId || undefined,
        },
      ),
  });
}

export function useEmployeePayoutsSummary(range: RangeValue) {
  return useQuery({
    queryKey: ['employee-payouts-summary', range],
    queryFn: () =>
      api.get<{
        range: any;
        data: EmployeePayoutSummary[];
        totalEarned: number;
        totalPaid: number;
        totalPending: number;
      }>('/api/employee-payouts/summary', rangeParams(range)),
  });
}

export function useSaveEmployeePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      employeeId: string;
      amount: number;
      payoutType: PayoutType;
      method: PaymentMethod;
      paidAt?: string;
      periodFrom?: string | null;
      periodTo?: string | null;
      notes?: string | null;
      deductFromCash?: boolean;
    }) => api.post<EmployeePayout>('/api/employee-payouts', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employee-payouts'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-payouts-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Pago al empleado registrado exitosamente');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteEmployeePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/employee-payouts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employee-payouts'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-payouts-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Pago eliminado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
