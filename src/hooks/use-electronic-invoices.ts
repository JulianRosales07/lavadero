'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { ElectronicInvoice, FactusNumberingRange } from '@/lib/types';

export function useElectronicInvoices(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ['electronic-invoices', orderId],
    queryFn: () =>
      api.get<ElectronicInvoice[]>('/api/electronic-invoices', { orderId }),
    enabled: enabled && Boolean(orderId),
    refetchInterval: (query) => {
      const invoices = query.state.data as ElectronicInvoice[] | undefined;
      return invoices?.some((invoice) =>
        invoice.status === 'PENDING' || invoice.status === 'SUBMITTING')
        ? 2500
        : false;
    },
  });
}

export function useFactusNumberingRanges() {
  return useQuery({
    queryKey: ['factus-numbering-ranges'],
    queryFn: () =>
      api.get<FactusNumberingRange[]>('/api/electronic-invoices/numbering-ranges'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useIssueElectronicInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<ElectronicInvoice>(`/api/electronic-invoices/orders/${orderId}`),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({
        queryKey: ['electronic-invoices', invoice.orderId],
      });
      toast.success(
        invoice.status === 'VALIDATED'
          ? `Factura ${invoice.number ?? ''} validada`.trim()
          : 'Factura enviada a Factus',
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
