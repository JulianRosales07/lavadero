'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type {
  DamageType,
  DiscountType,
  EvidenceStage,
  Order,
  OrderListItem,
  OrderStatus,
  Paginated,
  PaymentMethod,
} from '@/lib/types';

export interface OrderItemInput {
  serviceId?: string | null;
  name?: string;
  price?: number;
  quantity: number;
  durationMin?: number;
  employeeId?: string | null;
  notes?: string | null;
}

export interface CreateOrderInput {
  customerId: string;
  vehicleId: string;
  employeeId?: string | null;
  promotionId?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string | null;
  items: OrderItemInput[];
  evidences?: {
    url: string;
    path?: string | null;
    stage: EvidenceStage;
    damageType: DamageType;
    note?: string | null;
  }[];
}

// Se declara como `type` (no `interface`) para que TypeScript le asigne
// una firma de índice implícita y sea compatible con los query params.
export type OrdersFilters = {
  status?: string;
  q?: string;
  employeeId?: string;
  preset?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

/** Invalida todo lo que depende de las órdenes (listados, tablero, KPIs). */
function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return (orderId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['orders-board'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['reports'] });
    void queryClient.invalidateQueries({ queryKey: ['employees'] });
    if (orderId) void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  };
}

export function useOrders(filters: OrdersFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => api.get<Paginated<OrderListItem>>('/api/orders', filters),
  });
}

export function useOrdersBoard(refetchMs = 30_000) {
  return useQuery({
    queryKey: ['orders-board'],
    queryFn: () =>
      api.get<Record<'PENDING' | 'IN_PROGRESS' | 'READY', OrderListItem[]>>('/api/orders/board'),
    refetchInterval: refetchMs,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/api/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (body: CreateOrderInput) => api.post<Order>('/api/orders', body),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success(`Orden ${order.number} creada`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      employeeId?: string | null;
      promotionId?: string | null;
      discountType?: DiscountType;
      discountValue?: number;
      notes?: string | null;
    }) => api.patch<Order>(`/api/orders/${id}`, body),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Orden actualizada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddOrderItems() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: OrderItemInput[] }) =>
      api.post<Order>(`/api/orders/${id}/items`, { items }),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Servicios agregados, el total se recalculó');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveOrderItem() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      api.del<Order>(`/api/orders/${id}/items/${itemId}`),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Servicio quitado de la orden');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useChangeOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      api.patch<Order>(`/api/orders/${id}/status`, { status, reason }),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Estado actualizado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddEvidences() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      items,
    }: {
      id: string;
      stage: EvidenceStage;
      items: { url: string; path?: string | null; damageType: DamageType; note?: string | null }[];
    }) => api.post<Order>(`/api/orders/${id}/evidences`, { stage, items }),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Evidencias guardadas');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveEvidence() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, evidenceId }: { id: string; evidenceId: string }) =>
      api.del(`/api/orders/${id}/evidences/${evidenceId}`),
    onSuccess: (_data, variables) => {
      invalidate(variables.id);
      toast.success('Evidencia eliminada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface CheckoutInput {
  id: string;
  tip: number;
  discountType?: DiscountType;
  discountValue?: number;
  promotionId?: string | null;
  requiresInvoice?: boolean;
  payments: { method: PaymentMethod; amount: number; reference?: string | null }[];
  finalEvidences?: { url: string; path?: string | null; note?: string | null }[];
}

export function useCheckoutOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, ...body }: CheckoutInput) => api.post<Order>(`/api/orders/${id}/checkout`, body),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success(`Orden ${order.number} cobrada y finalizada`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<Order>(`/api/orders/${id}/cancel`, { reason }),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success('Orden cancelada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
