'use client';

import * as React from 'react';
import { Clock, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { MoneyInput } from '@/components/shared/money-input';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteService, useSaveService, useServices } from '@/hooks/use-catalog';
import { formatMinutes, money } from '@/lib/format';
import type { Service } from '@/lib/types';

export default function ServicesPage() {
  const { data: services, isLoading, isError, error, refetch } = useServices(false);
  const deleteService = useDeleteService();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [toDelete, setToDelete] = React.useState<Service | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Define tu catálogo con precio y tiempo estimado. Tú decides qué ofrece tu lavadero."
        actions={
          <Button onClick={openNew}>
            <Plus />
            Nuevo servicio
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (services ?? []).length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Tu catálogo está vacío"
              description="Crea los servicios que ofreces: lavado básico, lavado de salón, premium, motor, aspirado, encerado, pulido... con el precio y la duración que manejes."
              action={
                <Button size="sm" onClick={openNew}>
                  <Plus />
                  Crear primer servicio
                </Button>
              }
            />
          ) : (
            <>
              {/* Móvil: tarjetas */}
              <ul className="divide-y divide-border/60 md:hidden">
                {services?.map((service) => (
                  <li key={service.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm tracking-tight truncate">{service.name}</p>
                          <span className="shrink-0 font-bold text-base tabular-nums text-foreground">
                            {money(service.price)}
                          </span>
                        </div>

                        {service.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {service.description}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="muted" className="text-[11px] px-2 py-0.5">
                            {service.category ?? 'Sin categoría'}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" aria-hidden />
                            {formatMinutes(service.durationMin)}
                          </span>
                          {service.active ? (
                            <Badge variant="success" className="text-[11px] px-1.5 py-0">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="muted" className="text-[11px] px-1.5 py-0">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(service);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setToDelete(service)}>
                            <Trash2 />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="hidden sm:table-cell">Duración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <p className="font-medium">{service.name}</p>
                          {service.description ? (
                            <p className="max-w-md truncate text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="muted">{service.category ?? 'Sin categoría'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {money(service.price)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden />
                            {formatMinutes(service.durationMin)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {service.active ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="muted">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(service);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onClick={() => setToDelete(service)}>
                                <Trash2 />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ServiceDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar servicio?"
        description={
          toDelete
            ? `Si "${toDelete.name}" ya se usó en órdenes se desactivará para conservar el historial.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteService.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteService.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}

function ServiceDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}) {
  const saveService = useSaveService();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Lavado');
  const [price, setPrice] = React.useState(0);
  const [durationMin, setDurationMin] = React.useState(30);
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(service?.name ?? '');
    setDescription(service?.description ?? '');
    setCategory(service?.category ?? 'Lavado');
    setPrice(service?.price ?? 0);
    setDurationMin(service?.durationMin ?? 30);
    setActive(service?.active ?? true);
  }, [open, service]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Escribe el nombre del servicio');
      return;
    }
    if (price <= 0) {
      toast.error('Indica el precio del servicio');
      return;
    }

    await saveService.mutateAsync({
      id: service?.id,
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || 'Lavado',
      price,
      durationMin,
      active,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>
            El precio y la duración se usan al armar las órdenes y calcular tiempos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Nombre *</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Lavado premium"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-price">Precio *</Label>
              <MoneyInput
                id="service-price"
                value={price}
                onValueChange={setPrice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-duration">Tiempo estimado (min)</Label>
              <Input
                id="service-duration"
                type="number"
                min={0}
                max={1440}
                value={durationMin}
                onChange={(event) => setDurationMin(Number(event.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-category">Categoría</Label>
            <Input
              id="service-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Lavado, Interior, Detailing..."
            />
            <p className="text-xs text-muted-foreground">
              Sirve para agrupar los servicios al crear una orden.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Descripción</Label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Qué incluye el servicio"
              className="min-h-[70px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
            <div>
              <p className="text-sm font-medium">Servicio activo</p>
              <p className="text-xs text-muted-foreground">
                Los inactivos no aparecen al crear órdenes.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Servicio activo" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saveService.isPending}>
              {service ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
