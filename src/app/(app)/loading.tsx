import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto que Next muestra en cuanto empieza la navegación, sin esperar a
 * que la pantalla destino esté lista. Da respuesta inmediata al toque.
 */
export default function AppLoading() {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-live="polite">
      <div className="hidden items-center justify-between sm:flex">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>

      <span className="sr-only">Cargando pantalla</span>
    </div>
  );
}
