'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { FormlyConfig, OrderSurvey } from '@/lib/types';

export function useFormlyConfig() {
  return useQuery({
    queryKey: ['formly-config'],
    queryFn: () => api.get<FormlyConfig>('/api/formly/config'),
    staleTime: 60_000,
  });
}

export function useRequestFormlyAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      companyName?: string;
      applicantName?: string;
      applicantEmail?: string;
      systemType?: string;
      intendedUse?: string;
      webhookUrl?: string;
      baseUrl?: string;
    }) => api.post('/api/formly/request-access', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['formly-config'] });
      void queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Solicitud enviada a Formly exitosamente. En espera de aprobación.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useOrderSurvey(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ['order-survey', orderId],
    queryFn: () => api.get<OrderSurvey | null>(`/api/formly/orders/${orderId}/survey`),
    enabled: enabled && Boolean(orderId),
    refetchInterval: (query) => {
      const survey = query.state.data as OrderSurvey | null | undefined;
      // Si la encuesta aún no tiene respuestas, consultar cada 10s
      return survey && survey.totalResponses === 0 ? 10_000 : false;
    },
  });
}

export function useCreateOrderSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<OrderSurvey>(`/api/formly/orders/${orderId}/survey`),
    onSuccess: (survey, orderId) => {
      void queryClient.invalidateQueries({ queryKey: ['order-survey', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Encuesta Formly generada exitosamente');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSurveyAnalytics(surveyId: string, enabled = true) {
  return useQuery({
    queryKey: ['survey-analytics', surveyId],
    queryFn: () => api.get<any>(`/api/formly/surveys/${surveyId}/analytics`),
    enabled: enabled && Boolean(surveyId),
  });
}
