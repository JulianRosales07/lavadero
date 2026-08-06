'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { RangeValue } from '@/components/shared/range-filter';
import type {
  CashReport,
  CustomersReport,
  DashboardData,
  EmployeeEarningsReport,
  EmployeesReport,
  Expense,
  ExpenseCategory,
  PaymentMethodsReport,
  SalesReport,
  ServicesReport,
  TipsReport,
} from '@/lib/types';

const rangeParams = (range: RangeValue) => ({
  preset: range.preset,
  from: range.preset === 'custom' ? range.from : undefined,
  to: range.preset === 'custom' ? range.to : undefined,
});

export function useDashboard(refetchMs = 60_000) {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/reports/dashboard'),
    refetchInterval: refetchMs,
  });
}

export function useSalesReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'sales', range],
    queryFn: () => api.get<SalesReport>('/api/reports/sales', rangeParams(range)),
  });
}

export function useServicesReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'services', range],
    queryFn: () => api.get<ServicesReport>('/api/reports/services', rangeParams(range)),
  });
}

export function useCustomersReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'customers', range],
    queryFn: () => api.get<CustomersReport>('/api/reports/customers', rangeParams(range)),
  });
}

export function useTipsReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'tips', range],
    queryFn: () => api.get<TipsReport>('/api/reports/tips', rangeParams(range)),
  });
}

export function usePaymentMethodsReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'payment-methods', range],
    queryFn: () => api.get<PaymentMethodsReport>('/api/reports/payment-methods', rangeParams(range)),
  });
}

export function useEmployeesReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'employees', range],
    queryFn: () => api.get<EmployeesReport>('/api/reports/employees', rangeParams(range)),
  });
}

export function useEmployeeEarningsReport(range: RangeValue, employeeId?: string) {
  return useQuery({
    queryKey: ['reports', 'employee-earnings', range, employeeId],
    queryFn: () =>
      api.get<EmployeeEarningsReport>('/api/reports/employee-earnings', {
        ...rangeParams(range),
        employeeId,
      }),
  });
}

export function useCashReport(range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'cash', range],
    queryFn: () => api.get<CashReport>('/api/reports/cash', rangeParams(range)),
  });
}

export function useEmployeeOrdersReport(employeeId: string, range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'employee-orders', employeeId, range],
    queryFn: () =>
      api.get<{
        range: { from: string; to: string; preset: string };
        data: Array<{
          orderId: string;
          orderNumber: string;
          finishedAt: string;
          customerName: string;
          vehiclePlate: string;
          vehicleType: string;
          servicesCount: number;
          durationMin: number;
          tip: number;
          total: number;
        }>;
      }>(`/api/reports/employee/${employeeId}/orders`, rangeParams(range)),
    enabled: Boolean(employeeId),
  });
}

export function useCustomerOrdersReport(customerId: string, range: RangeValue) {
  return useQuery({
    queryKey: ['reports', 'customer-orders', customerId, range],
    queryFn: () =>
      api.get<{
        range: { from: string; to: string; preset: string };
        data: Array<{
          orderId: string;
          orderNumber: string;
          finishedAt: string;
          employeeName: string;
          vehiclePlate: string;
          vehicleType: string;
          services: Array<{ name: string; quantity: number; price: number }>;
          tip: number;
          total: number;
        }>;
      }>(`/api/reports/customer/${customerId}/orders`, rangeParams(range)),
    enabled: Boolean(customerId),
  });
}

// ---------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------

export function useExpenses(range: RangeValue) {
  return useQuery({
    queryKey: ['expenses', range],
    queryFn: () =>
      api.get<{ total: number; data: Expense[] }>('/api/expenses', rangeParams(range)),
  });
}

export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: {
        id?: string;
        concept: string;
        category: ExpenseCategory;
        amount: number;
        notes?: string | null;
        spentAt?: string;
      },
    ) => {
      const { id, ...body } = input;
      return id ? api.patch<Expense>(`/api/expenses/${id}`, body) : api.post<Expense>('/api/expenses', body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(variables.id ? 'Gasto actualizado' : 'Gasto registrado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/expenses/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Gasto eliminado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
