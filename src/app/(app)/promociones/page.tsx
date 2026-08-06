'use client';

import * as React from 'react';
import { BadgePercent, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDeletePromotion, usePromotions, useSavePromotion } from '@/hooks/use-catalog';
import { formatDate, money } from '@/lib/format';
import type { DiscountType, Promotion } from '@/lib/types';

export default function PromotionsPage() {
  const { data: promotions, isLoading, isError, error, refetch } = usePromotions(false);
  const deletePromotion = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Promotion | null>(null);
  const [toDelete, setToDelete] = React.useState<Promotion | null>(null);

  return (
    <>
      <PageHeader
        title="Promociones"
        description="Descuentos que puedes aplicar al crear la orden o al momento del cobro."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Nueva promoción
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (promotions ?? []).length === 0 ? (
            <EmptyState
              icon={BadgePercent}
              title="Sin promociones"
              description="Crea promociones por porcentaje o monto fijo, con o sin fecha de vigencia."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus />
                  Crear promoción
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoción</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead className="hidden sm:table-cell">Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions?.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <p className="font-medium">{promotion.name}</p>
                      {promotion.description ? (
                        <p className="max-w-md truncate text-xs text-muted-foreground">
                          {promotion.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {promotion.type === 'PERCENT'
                          ? `${promotion.value}%`
                          : money(promotion.value)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {promotion.startsAt || promotion.endsAt
                          ? `${promotion.startsAt ? formatDate(promotion.startsAt) : 'Desde siempre'} → ${
                              promotion.endsAt ? formatDate(promotion.endsAt) : 'Sin fin'
                            }`
                          : 'Permanente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {promotion.active ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="muted">Inactiva</Badge>
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
                              setEditing(promotion);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setToDelete(promotion)}>
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
          )}
        </CardContent>
      </Card>

      <PromotionDialog open={dialogOpen} onOpenChange={setDialogOpen} promotion={editing} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar promoción?"
        description="Si ya se aplicó en órdenes se desactivará para conservar el historial."
        confirmLabel="Eliminar"
        destructive
        loading={deletePromotion.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deletePromotion.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}

function PromotionDialog({
  open,
  onOpenChange,
  promotion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
}) {
  const savePromotion = useSavePromotion();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<DiscountType>('PERCENT');
  const [value, setValue] = React.useState(0);
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(promotion?.name ?? '');
    setDescription(promotion?.description ?? '');
    setType(promotion?.type ?? 'PERCENT');
    setValue(promotion?.value ?? 0);
    setStartsAt(promotion?.startsAt?.slice(0, 10) ?? '');
    setEndsAt(promotion?.endsAt?.slice(0, 10) ?? '');
    setActive(promotion?.active ?? true);
  }, [open, promotion]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Escribe el nombre de la promoción');
      return;
    }
    if (value <= 0) {
      toast.error('Indica el valor del descuento');
      return;
    }
    if (type === 'PERCENT' && value > 100) {
      toast.error('Un porcentaje no puede superar 100');
      return;
    }

    await savePromotion.mutateAsync({
      id: promotion?.id,
      name: name.trim(),
      description: description.trim() || null,
      type,
      value,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      active,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{promotion ? 'Editar promoción' : 'Nueva promoción'}</DialogTitle>
          <DialogDescription>
            El descuento se aplica sobre el subtotal ya rebajado por el descuento manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-name">Nombre *</Label>
            <Input
              id="promo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Martes de lavado"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de descuento</Label>
            <div className="flex gap-2">
              <Tabs value={type} onValueChange={(next) => setType(next as DiscountType)}>
                <TabsList className="h-10">
                  <TabsTrigger value="PERCENT">Porcentaje</TabsTrigger>
                  <TabsTrigger value="AMOUNT">Monto fijo</TabsTrigger>
                </TabsList>
              </Tabs>
              {type === 'PERCENT' ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={value || ''}
                  onChange={(event) => setValue(Number(event.target.value) || 0)}
                  className="flex-1 tabular-nums"
                  placeholder="10"
                  aria-label="Porcentaje"
                />
              ) : (
                <MoneyInput value={value} onValueChange={setValue} className="flex-1" />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promo-start">Inicio (opcional)</Label>
              <Input
                id="promo-start"
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-end">Fin (opcional)</Label>
              <Input
                id="promo-end"
                type="date"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-description">Descripción</Label>
            <Textarea
              id="promo-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Condiciones de la promoción"
              className="min-h-[70px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
            <div>
              <p className="text-sm font-medium">Promoción activa</p>
              <p className="text-xs text-muted-foreground">Solo las activas y vigentes se ofrecen.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Promoción activa" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={savePromotion.isPending}>
              {promotion ? 'Guardar cambios' : 'Crear promoción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
