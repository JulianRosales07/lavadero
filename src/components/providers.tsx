'use client';

import * as React from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/components/auth-provider';
import { ApiError } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        // Un fallo de lectura nunca debe pasar desapercibido: sin este aviso
        // una consulta rota se ve igual que una lista vacía.
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401) return;
            toast.error(error instanceof Error ? error.message : 'Error al cargar datos');
          },
        }),
        defaultOptions: {
          queries: {
            // Un minuto de frescura: volver a una pantalla ya visitada se pinta
            // al instante desde caché en vez de esperar otra ida al backend.
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // No reintentar errores de validación ni de sesión.
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{ className: 'rounded-lg' }}
            />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
