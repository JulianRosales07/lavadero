'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type {
  Customer,
  IdentificationDocumentCode,
  Paginated,
  Vehicle,
  VehicleType,
} from '@/lib/types';

export interface VehicleInput {
  plate: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  type: VehicleType;
  photoUrl?: string | null;
  notes?: string | null;
}

export interface CustomerInput {
  firstName: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  identificationDocumentCode?: IdentificationDocumentCode | null;
  identification?: string | null;
  address?: string | null;
  municipalityCode?: string | null;
  legalOrganizationCode?: '1' | '2' | null;
  tributeCode?: string | null;
  vehicles?: VehicleInput[];
}

export function useCustomers(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => api.get<Paginated<Customer>>('/api/customers', params),
  });
}

/** Buscador rápido usado al crear una orden. */
export function useCustomerSearch(q: string, enabled = true) {
  return useQuery({
    queryKey: ['customers', 'search', q],
    queryFn: () => api.get<Customer[]>('/api/customers/search', { q }),
    enabled,
    staleTime: 10_000,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get<Customer>(`/api/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerInput) => api.post<Customer>('/api/customers', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CustomerInput & { id: string }) =>
      api.patch<Customer>(`/api/customers/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast.success('Cliente actualizado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * `force` elimina también las órdenes del cliente (y sus pagos/evidencias),
 * por lo que esas ventas dejan de aparecer en los reportes.
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      api.del(`/api/customers/${id}`, force ? { force: 'true' } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Cliente eliminado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: VehicleInput & { customerId: string }) =>
      api.post<Vehicle>('/api/vehicles', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast.success('Vehículo agregado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<VehicleInput> & { id: string }) =>
      api.patch<Vehicle>(`/api/vehicles/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast.success('Vehículo actualizado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      api.del(`/api/vehicles/${id}`, force ? { force: 'true' } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      void queryClient.invalidateQueries({ queryKey: ['customer'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Vehículo eliminado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
