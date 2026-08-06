'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Business, Employee, Promotion, Service } from '@/lib/types';

// ---------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------

export const servicesKey = (onlyActive = true) => ['services', onlyActive] as const;

export function useServices(onlyActive = true) {
  return useQuery({
    queryKey: servicesKey(onlyActive),
    queryFn: () => api.get<Service[]>('/api/services', { onlyActive }),
  });
}

export function useSaveService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Service> & { id?: string }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<Service>(`/api/services/${id}`, body)
        : api.post<Service>('/api/services', body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(variables.id ? 'Servicio actualizado' : 'Servicio creado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ archived?: boolean }>(`/api/services/${id}`),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(
        result?.archived
          ? 'El servicio tiene historial, se desactivó en lugar de borrarse'
          : 'Servicio eliminado',
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---------------------------------------------------------------------
// Promociones
// ---------------------------------------------------------------------

export function usePromotions(onlyActive = true) {
  return useQuery({
    queryKey: ['promotions', onlyActive],
    queryFn: () => api.get<Promotion[]>('/api/promotions', { onlyActive }),
  });
}

export function useSavePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Promotion> & { id?: string }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<Promotion>(`/api/promotions/${id}`, body)
        : api.post<Promotion>('/api/promotions', body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(variables.id ? 'Promoción actualizada' : 'Promoción creada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ archived?: boolean }>(`/api/promotions/${id}`),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(result?.archived ? 'Promoción desactivada' : 'Promoción eliminada');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---------------------------------------------------------------------
// Empleados
// ---------------------------------------------------------------------

export function useEmployees(onlyActive = false) {
  return useQuery({
    queryKey: ['employees', onlyActive],
    queryFn: () => api.get<Employee[]>('/api/employees', { onlyActive }),
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Employee> & { id?: string }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<Employee>(`/api/employees/${id}`, body)
        : api.post<Employee>('/api/employees', body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(variables.id ? 'Empleado actualizado' : 'Empleado registrado');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ archived?: boolean }>(`/api/employees/${id}`),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(
        result?.archived ? 'El empleado tiene órdenes, se marcó como inactivo' : 'Empleado eliminado',
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---------------------------------------------------------------------
// Negocio (datos del ticket)
// ---------------------------------------------------------------------

export function useBusiness() {
  return useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<Business>('/api/settings/business'),
    staleTime: 5 * 60_000,
  });
}

export function useSaveBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Business>) => api.patch<Business>('/api/settings/business', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Datos del negocio actualizados');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
