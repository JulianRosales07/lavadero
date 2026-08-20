import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CreateEstablishmentInput,
  Establishment,
  PlatformUser,
  SuperAdminStats,
} from '@/lib/types';

export const superAdminKeys = {
  all: ['superadmin'] as const,
  stats: () => [...superAdminKeys.all, 'stats'] as const,
  establishments: (filters?: { q?: string; status?: string }) =>
    [...superAdminKeys.all, 'establishments', filters] as const,
  establishment: (id: string) => [...superAdminKeys.all, 'establishment', id] as const,
  admins: (id: string) => [...superAdminKeys.all, 'admins', id] as const,
  users: (filters?: { q?: string; role?: string; businessId?: string }) =>
    [...superAdminKeys.all, 'users', filters] as const,
};

export function useSuperAdminStats() {
  return useQuery({
    queryKey: superAdminKeys.stats(),
    queryFn: () => api.get<SuperAdminStats>('/api/superadmin/stats'),
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useEstablishments(filters?: { q?: string; status?: 'all' | 'active' | 'inactive' }) {
  const queryParams = new URLSearchParams();
  if (filters?.q) queryParams.set('q', filters.q);
  if (filters?.status) queryParams.set('status', filters.status);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return useQuery({
    queryKey: superAdminKeys.establishments(filters),
    queryFn: () => api.get<Establishment[]>(`/api/superadmin/establishments${queryStr}`),
  });
}

export function useEstablishment(id: string | undefined) {
  return useQuery({
    queryKey: superAdminKeys.establishment(id || ''),
    queryFn: () => api.get<Establishment>(`/api/superadmin/establishments/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEstablishmentInput) =>
      api.post<{ establishment: Establishment; admin: any | null }>('/api/superadmin/establishments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.establishments() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.users() });
    },
  });
}

export function useUpdateEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEstablishmentInput> }) =>
      api.patch<Establishment>(`/api/superadmin/establishments/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.establishments() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.establishment(variables.id) });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats() });
    },
  });
}

export function useEstablishmentAdmins(businessId: string | undefined) {
  return useQuery({
    queryKey: superAdminKeys.admins(businessId || ''),
    queryFn: () => api.get<PlatformUser[]>(`/api/superadmin/establishments/${businessId}/admins`),
    enabled: Boolean(businessId),
  });
}

export function useCreateEstablishmentAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string;
      data: { name: string; email: string; password: string; role?: string };
    }) => api.post<PlatformUser>(`/api/superadmin/establishments/${businessId}/admins`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.admins(variables.businessId) });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.establishments() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.users() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats() });
    },
  });
}

export function usePlatformUsers(filters?: { q?: string; role?: string; businessId?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.q) queryParams.set('q', filters.q);
  if (filters?.role) queryParams.set('role', filters.role);
  if (filters?.businessId) queryParams.set('businessId', filters.businessId);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return useQuery({
    queryKey: superAdminKeys.users(filters),
    queryFn: () => api.get<PlatformUser[]>(`/api/superadmin/users${queryStr}`),
  });
}

export function useUpdatePlatformUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlatformUser> & { password?: string } }) =>
      api.patch<PlatformUser>(`/api/superadmin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.users() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.establishments() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.stats() });
    },
  });
}
