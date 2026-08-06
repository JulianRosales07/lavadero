'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Estado de error para listados. Nunca hay que mostrar "no hay datos"
 * cuando en realidad la petición falló: son situaciones distintas y el
 * usuario necesita saber cuál es.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Ocurrió un error inesperado';

  const isServer = error instanceof ApiError && error.status >= 500;
  const isOffline = error instanceof ApiError && error.status === 0;

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </span>

      <div className="space-y-1">
        <p className="font-medium">
          {isOffline ? 'Sin conexión con el servidor' : 'No se pudieron cargar los datos'}
        </p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>
      </div>

      {isServer ? (
        <p className="mx-auto max-w-md rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Si el error menciona una columna o función que no existe, faltan migraciones por
          aplicar. Ejecuta <code className="font-mono">pnpm db:probe</code> en el backend para
          ver qué falta.
        </p>
      ) : null}

      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
