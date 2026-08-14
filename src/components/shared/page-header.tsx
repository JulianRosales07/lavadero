import { cn } from '@/lib/utils';

/**
 * Encabezado de página.
 * En móvil el título se omite porque la cabecera de la app ya lo muestra;
 * solo se conservan las acciones, que ahí ocupan todo el ancho.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0 max-w-full',
        className,
      )}
    >
      <div className="hidden space-y-1 sm:block min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
