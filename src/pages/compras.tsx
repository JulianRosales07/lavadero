'use client';

import * as React from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  Edit2,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { RangeFilter, type RangeValue } from '@/components/shared/range-filter';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExpenses, useSaveExpense, useDeleteExpense } from '@/hooks/use-reports';
import { formatDate, formatSmart, money, parseMoney } from '@/lib/format';
import type { Expense } from '@/lib/types';

const COMMON_SUPPLIES = [
  { label: 'Jabón neutro / Champú', qty: '1 caneca' },
  { label: 'Cera líquida carnauba', qty: '1 galón' },
  { label: 'Desengrasante de motor', qty: '1 galón' },
  { label: 'Silicona / Brilla llantas', qty: '1 galón' },
  { label: 'Ambientador para autos', qty: '1 litro' },
  { label: 'Paños de microfibra', qty: '12 unidades' },
  { label: 'Esponjas de lavado', qty: '6 unidades' },
  { label: 'Bolsas para basura de autos', qty: '1 paquete' },
  { label: 'Repuestos de hidrolavadora', qty: '1 unidad' },
  { label: 'Cepillos y escobas de lavado', qty: '2 unidades' },
];

export default function ComprasPage() {
  const [range, setRange] = React.useState<RangeValue>({ preset: 'month' });
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const { data, isLoading } = useExpenses(range, 'SUPPLIES');
  const deleteMutation = useDeleteExpense();

  const allPurchases = data?.data ?? [];

  const filtered = allPurchases.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.concept.toLowerCase().includes(q) ||
      (p.supplier && p.supplier.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  const totalSpent = allPurchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const avgPurchase = allPurchases.length > 0 ? Math.round(totalSpent / allPurchases.length) : 0;

  return (
    <>
      <PageHeader
        title="Compras e Insumos"
        description="Registra la compra de jabón, ceras y cualquier implemento de lavado. Se restan automáticamente de la caja del administrador y de las ganancias."
        actions={
          <Button
            onClick={() => {
              setEditingExpense(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Registrar compra
          </Button>
        }
      />

      {/* Banner explicativo */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm text-foreground">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Wallet className="size-4" />
        </span>
        <p className="text-xs sm:text-sm">
          <strong>Impacto en caja:</strong> Todo implemento o compra que registres aquí se descuenta en tiempo real
          del balance de la <strong>Caja del Administrador</strong> y reduce las ganancias operativas del período.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <RangeFilter value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {/* Métricas */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total gastado en insumos"
          value={money(totalSpent)}
          icon={ShoppingBag}
          tone="rose"
          loading={isLoading}
          hint="Restado de la caja del administrador"
        />
        <StatCard
          label="Compras registradas"
          value={allPurchases.length}
          icon={Receipt}
          loading={isLoading}
          hint="En el período seleccionado"
        />
        <StatCard
          label="Promedio por compra"
          value={money(avgPurchase)}
          icon={TrendingUp}
          tone="sky"
          loading={isLoading}
          hint="Ticket promedio de insumos"
        />
        <StatCard
          label="Insumos frecuentes"
          value={allPurchases[0]?.concept ?? 'Sin registros'}
          icon={Sparkles}
          tone="emerald"
          loading={isLoading}
          hint={allPurchases[0] ? `Última: ${money(allPurchases[0].amount)}` : 'Registra tus compras'}
        />
      </section>

      {/* Tabla de compras */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Historial de compras e implementos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lista detallada de compras de insumos para la operación.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por insumo, proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="space-y-2 px-5 pb-5">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No hay compras registradas en este período"
              description="Pulsa el botón 'Registrar compra' para ingresar jabón, ceras o implementos."
              action={
                <Button
                  onClick={() => {
                    setEditingExpense(null);
                    setDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus /> Registrar primera compra
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Insumo / Implemento</TableHead>
                  <TableHead className="hidden sm:table-cell">Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">Proveedor / Notas</TableHead>
                  <TableHead className="text-right">Valor Gastado</TableHead>
                  <TableHead className="text-center w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatSmart(item.spentAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Package className="size-3.5" />
                        </span>
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.concept}</p>
                          {item.quantity ? (
                            <p className="text-xs text-muted-foreground sm:hidden">
                              Cant: {item.quantity}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {item.quantity ? (
                        <Badge variant="muted" className="text-xs">
                          {item.quantity}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {item.supplier ? (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground mr-1.5">
                          <Building className="size-3 text-muted-foreground" /> {item.supplier}
                        </span>
                      ) : null}
                      {item.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      - {money(item.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingExpense(item);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setToDelete(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para Crear / Editar Compra */}
      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}
        initialData={editingExpense}
      />

      {/* Confirmar eliminación */}
      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta compra?</DialogTitle>
            <DialogDescription>
              El valor de esta compra volverá a sumarse a la caja del administrador y se restaurará el balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={async () => {
                if (!toDelete) return;
                await deleteMutation.mutateAsync(toDelete);
                setToDelete(null);
              }}
            >
              Eliminar compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------
// Modal de Registro / Edición de Compra
// ---------------------------------------------------------------------

function PurchaseDialog({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Expense | null;
}) {
  const saveMutation = useSaveExpense();

  const [concept, setConcept] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [spentAt, setSpentAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (initialData) {
      setConcept(initialData.concept);
      setAmount(String(initialData.amount));
      setQuantity(initialData.quantity || '');
      setSupplier(initialData.supplier || '');
      setSpentAt(initialData.spentAt.slice(0, 10));
      setNotes(initialData.notes || '');
    } else {
      setConcept('');
      setAmount('');
      setQuantity('');
      setSupplier('');
      setSpentAt(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseMoney(amount);
    if (!concept.trim()) return;
    if (parsedAmount <= 0) return;

    await saveMutation.mutateAsync({
      id: initialData?.id,
      concept: concept.trim(),
      category: 'SUPPLIES',
      amount: parsedAmount,
      quantity: quantity.trim() || null,
      supplier: supplier.trim() || null,
      notes: notes.trim() || null,
      spentAt: new Date(`${spentAt}T12:00:00Z`).toISOString(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Compra de Insumo' : 'Registrar Compra / Insumo'}</DialogTitle>
          <DialogDescription>
            Ingresa cualquier implemento o gasto del lavadero (jabón, cera, etc.). Se restará de la caja del administrador.
          </DialogDescription>
        </DialogHeader>

        {/* Sugerencias rápidas */}
        {!initialData && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sugerencias rápidas:</Label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
              {COMMON_SUPPLIES.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    setConcept(item.label);
                    if (!quantity) setQuantity(item.qty);
                  }}
                  className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                >
                  + {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="purchase-concept">
              Insumo o Implemento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="purchase-concept"
              placeholder="Ej: Jabón espumoso concentrado, Cera, etc."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchase-amount">
                Valor gastado ($ COP) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="purchase-amount"
                type="text"
                inputMode="numeric"
                placeholder="$ 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-quantity">Cantidad / Presentación</Label>
              <Input
                id="purchase-quantity"
                placeholder="Ej: 2 galones, 5 unidades"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchase-supplier">Proveedor / Local (Opcional)</Label>
              <Input
                id="purchase-supplier"
                placeholder="Ej: Distribuidora Química"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-date">Fecha de compra</Label>
              <Input
                id="purchase-date"
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-notes">Notas / Comentarios (Opcional)</Label>
            <Input
              id="purchase-notes"
              placeholder="Nro. de factura, observaciones o detalles"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-400">
            <strong>Confirmación de caja:</strong> Esta compra quedará registrada con categoría <em>Insumos</em> y se
            restará del efectivo de la caja del administrador.
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saveMutation.isPending}
              disabled={!concept.trim() || parseMoney(amount) <= 0}
            >
              {initialData ? 'Guardar cambios' : 'Registrar compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
