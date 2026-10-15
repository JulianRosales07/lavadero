'use client';

import * as React from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HandCoins,
  History,
  Layers,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useEmployees } from '@/hooks/use-catalog';
import {
  useEmployeePayouts,
  useEmployeePayoutsSummary,
  useSaveEmployeePayout,
  useDeleteEmployeePayout,
} from '@/hooks/use-employee-payouts';
import { formatDate, formatSmart, money, parseMoney } from '@/lib/format';
import type { EmployeePayout, EmployeePayoutSummary, PaymentMethod, PayoutType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/hooks/use-catalog';

export default function PagosEmpleadosPage() {
  const [range, setRange] = React.useState<RangeValue>({ preset: 'month' });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedEmpForPayout, setSelectedEmpForPayout] = React.useState<string | undefined>();
  const [selectedPendingAmount, setSelectedPendingAmount] = React.useState<number | undefined>();
  const [receiptPayout, setReceiptPayout] = React.useState<EmployeePayout | null>(null);
  const [toDelete, setToDelete] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const { data: summaryData, isLoading: loadingSummary } = useEmployeePayoutsSummary(range);
  const { data: payoutsData, isLoading: loadingPayouts } = useEmployeePayouts(range);
  const deleteMutation = useDeleteEmployeePayout();

  const summaries = summaryData?.data ?? [];
  const payouts = payoutsData?.data ?? [];

  const filteredPayouts = payouts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.employeeName && p.employeeName.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.payoutTypeLabel && p.payoutTypeLabel.toLowerCase().includes(q))
    );
  });

  const handleOpenPayout = (empId?: string, pendingAmt?: number) => {
    setSelectedEmpForPayout(empId);
    setSelectedPendingAmount(pendingAmt && pendingAmt > 0 ? pendingAmt : undefined);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Pagos y Liquidaciones a Empleados"
        description="Módulo de control del administrador para registrar los pagos de comisiones (50%), propinas y adelantos al personal."
        actions={
          <Button onClick={() => handleOpenPayout()}>
            <Plus />
            Registrar pago
          </Button>
        }
      />

      {/* Banner explicativo */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm text-foreground">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <HandCoins className="size-4" />
        </span>
        <p className="text-xs sm:text-sm">
          <strong>Control de comisiones (50%):</strong> Registra las entregas de dinero a los operarios.
          Si marcas la opción <em>Descontar de la caja</em>, el pago se restará automáticamente del efectivo de la caja del administrador.
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
          label="Total pagado al personal"
          value={money(summaryData?.totalPaid ?? 0)}
          icon={HandCoins}
          tone="amber"
          loading={loadingSummary}
          hint="Liquidaciones y adelantos entregados"
        />
        <StatCard
          label="Comisiones y propinas ganadas"
          value={money(summaryData?.totalEarned ?? 0)}
          icon={TrendingUp}
          tone="emerald"
          loading={loadingSummary}
          hint="50% de servicios + propinas según órdenes"
        />
        <StatCard
          label="Saldo pendiente por pagar"
          value={money(summaryData?.totalPending ?? 0)}
          icon={Wallet}
          tone={(summaryData?.totalPending ?? 0) > 0 ? 'rose' : 'emerald'}
          loading={loadingSummary}
          hint="Generado menos total pagado"
        />
        <StatCard
          label="Pagos realizados"
          value={payoutsData?.count ?? 0}
          icon={Receipt}
          loading={loadingPayouts}
          hint="En el período seleccionado"
        />
      </section>

      {/* Pestañas: Cuentas por Empleado vs Historial de Pagos */}
      <Tabs defaultValue="cuentas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="cuentas" className="gap-2 text-xs sm:text-sm">
            <Users className="size-4" />
            Cuentas por empleado
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2 text-xs sm:text-sm">
            <History className="size-4" />
            Historial de pagos ({payouts.length})
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Cuentas y Saldos por Empleado */}
        <TabsContent value="cuentas" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Liquidación y balance por empleado</CardTitle>
              <p className="text-xs text-muted-foreground">
                Compara lo que cada operario ha producido en comisiones (50%) contra lo que ya se le ha pagado.
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {loadingSummary ? (
                <div className="space-y-2 px-5 pb-5">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : summaries.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Sin empleados registrados"
                  description="Registra empleados en el sistema para calcular sus comisiones."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="text-center">Órdenes</TableHead>
                      <TableHead className="text-right">Comisión 50%</TableHead>
                      <TableHead className="text-right">Propinas</TableHead>
                      <TableHead className="text-right font-medium">Total Ganado</TableHead>
                      <TableHead className="text-right text-amber-600 dark:text-amber-400 font-medium">
                        Total Pagado
                      </TableHead>
                      <TableHead className="text-right font-bold">Saldo Pendiente</TableHead>
                      <TableHead className="text-center w-32">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map((emp) => {
                      const isPaidUp = emp.pendingBalance <= 0;
                      return (
                        <TableRow key={emp.employeeId}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-foreground">{emp.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{emp.position || 'Operario'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">{emp.ordersCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                            {money(emp.commissionTotal)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {money(emp.tipsTotal)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {money(emp.totalEarned)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                            {money(emp.totalPaid)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {isPaidUp ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" /> Al día
                              </span>
                            ) : (
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                {money(emp.pendingBalance)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant={isPaidUp ? 'outline' : 'default'}
                              className="h-8 text-xs gap-1"
                              onClick={() => handleOpenPayout(emp.employeeId, emp.pendingBalance)}
                            >
                              <HandCoins className="size-3.5" />
                              {isPaidUp ? 'Abonar' : 'Liquidar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: Historial Detallado de Pagos */}
        <TabsContent value="historial" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Historial de pagos realizados</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registro de recibos y entregas de dinero a los operarios.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empleado, notas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {loadingPayouts ? (
                <div className="space-y-2 px-5 pb-5">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPayouts.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Sin pagos registrados en este período"
                  description="Pulsa el botón 'Registrar pago' para asentar una entrega de dinero a un empleado."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Concepto / Tipo</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                      <TableHead className="hidden md:table-cell">Observaciones</TableHead>
                      <TableHead className="text-right">Monto Pagado</TableHead>
                      <TableHead className="text-center w-24">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatSmart(item.paidAt)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {item.employeeName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted" className="text-xs">
                            {item.payoutTypeLabel || item.payoutType}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {item.method === 'CASH'
                            ? '💵 Efectivo (Caja)'
                            : item.method === 'TRANSFER'
                              ? '📱 Transferencia'
                              : item.method}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                          {item.notes || '—'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {money(item.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Ver comprobante de pago"
                              onClick={() => setReceiptPayout(item)}
                            >
                              <FileText className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              title="Anular pago"
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
        </TabsContent>
      </Tabs>

      {/* Modal Registrar Pago */}
      <NewPayoutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialEmployeeId={selectedEmpForPayout}
        initialAmount={selectedPendingAmount}
        summaries={summaries}
      />

      {/* Modal Comprobante / Recibo de Pago */}
      {receiptPayout && (
        <PayoutReceiptModal
          payout={receiptPayout}
          open={Boolean(receiptPayout)}
          onOpenChange={(open) => !open && setReceiptPayout(null)}
        />
      )}

      {/* Confirmar anulación */}
      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Anular este pago?</DialogTitle>
            <DialogDescription>
              El registro de pago se eliminará y el monto volverá a aparecer como saldo pendiente para el empleado.
              Si se descontó de la caja, el dinero se restituirá al balance.
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
              Anular pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------
// Modal Registrar Pago
// ---------------------------------------------------------------------

function NewPayoutDialog({
  open,
  onOpenChange,
  initialEmployeeId,
  initialAmount,
  summaries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmployeeId?: string;
  initialAmount?: number;
  summaries: EmployeePayoutSummary[];
}) {
  const { data: employees = [] } = useEmployees(true);
  const saveMutation = useSaveEmployeePayout();

  const [employeeId, setEmployeeId] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');
  const [payoutType, setPayoutType] = React.useState<PayoutType>('COMMISSION');
  const [method, setMethod] = React.useState<PaymentMethod>('CASH');
  const [deductFromCash, setDeductFromCash] = React.useState<boolean>(true);
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (open) {
      const targetEmp = initialEmployeeId || (employees[0]?.id ?? '');
      setEmployeeId(targetEmp);
      if (initialAmount && initialAmount > 0) {
        setAmount(String(initialAmount));
      } else {
        setAmount('');
      }
      setPayoutType('COMMISSION');
      setMethod('CASH');
      setDeductFromCash(true);
      setPaidAt(new Date().toISOString().slice(0, 16));
      setNotes('');
    }
  }, [open, initialEmployeeId, initialAmount, employees]);

  const selectedSummary = summaries.find((s) => s.employeeId === employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseMoney(amount);
    if (!employeeId) return;
    if (parsedAmount <= 0) return;

    await saveMutation.mutateAsync({
      employeeId,
      amount: parsedAmount,
      payoutType,
      method,
      deductFromCash,
      paidAt: new Date(paidAt).toISOString(),
      notes: notes.trim() || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pago a Empleado</DialogTitle>
          <DialogDescription>
            Asienta una entrega de comisiones, adelanto o propinas a un operario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Selección de empleado */}
          <div className="space-y-2">
            <Label htmlFor="payout-emp">
              Empleado a pagar <span className="text-destructive">*</span>
            </Label>
            <Select value={employeeId} onValueChange={(val) => setEmployeeId(val)}>
              <SelectTrigger id="payout-emp">
                <SelectValue placeholder="Seleccionar operario..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} {emp.position ? `(${emp.position})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tarjeta de estado de cuenta en vivo del empleado seleccionado */}
          {selectedSummary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-medium">
                <span>Cuenta de {selectedSummary.employeeName}:</span>
                <span className="text-muted-foreground">{selectedSummary.ordersCount} órdenes atendidas</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="rounded-lg bg-card p-1.5 border border-border">
                  <p className="text-[10px] text-muted-foreground">Comisión (50%)</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {money(selectedSummary.commissionTotal)}
                  </p>
                </div>
                <div className="rounded-lg bg-card p-1.5 border border-border">
                  <p className="text-[10px] text-muted-foreground">Ya Pagado</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    {money(selectedSummary.totalPaid)}
                  </p>
                </div>
                <div className="rounded-lg bg-card p-1.5 border border-border">
                  <p className="text-[10px] text-muted-foreground">Saldo Pendiente</p>
                  <p className="font-bold text-foreground">
                    {money(selectedSummary.pendingBalance)}
                  </p>
                </div>
              </div>
              {selectedSummary.pendingBalance > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedSummary.pendingBalance))}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Rellenar con saldo pendiente ({money(selectedSummary.pendingBalance)})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Monto y Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">
                Monto a pagar ($ COP) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payout-amount"
                type="text"
                inputMode="numeric"
                placeholder="$ 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-type">Concepto del pago</Label>
              <Select value={payoutType} onValueChange={(val) => setPayoutType(val as PayoutType)}>
                <SelectTrigger id="payout-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMISSION">Liquidación 50%</SelectItem>
                  <SelectItem value="ADVANCE">Adelanto / Anticipo</SelectItem>
                  <SelectItem value="TIP">Entrega de propinas</SelectItem>
                  <SelectItem value="SALARY">Sueldo / Jornal</SelectItem>
                  <SelectItem value="BONUS">Bonificación</SelectItem>
                  <SelectItem value="OTHER">Otro concepto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Método y Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payout-method">Método de entrega</Label>
              <Select value={method} onValueChange={(val) => setMethod(val as PaymentMethod)}>
                <SelectTrigger id="payout-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">💵 Efectivo (Caja)</SelectItem>
                  <SelectItem value="TRANSFER">📱 Transferencia (Nequi/Banco)</SelectItem>
                  <SelectItem value="CARD">💳 Tarjeta / Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-date">Fecha y hora</Label>
              <Input
                id="payout-date"
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>

          {/* Descontar de la caja del administrador */}
          <div className="rounded-lg border border-border p-3 flex items-start gap-3 bg-muted/30">
            <input
              type="checkbox"
              id="deduct-cash"
              checked={deductFromCash}
              onChange={(e) => setDeductFromCash(e.target.checked)}
              className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="deduct-cash" className="text-xs cursor-pointer select-none space-y-0.5">
              <p className="font-medium text-foreground">Descontar de la Caja del Administrador</p>
              <p className="text-muted-foreground">
                Registra automáticamente una salida de dinero en Caja (categoría Personal/Salarios)
                para que el saldo de caja física cuadre perfectamente.
              </p>
            </label>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="payout-notes">Notas / Comentarios (Opcional)</Label>
            <Input
              id="payout-notes"
              placeholder="Ej: Pago de turno tarde, liquidación semana 42"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saveMutation.isPending}
              disabled={!employeeId || parseMoney(amount) <= 0}
            >
              Confirmar y Registrar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Comprobante / Recibo de Pago Imprimible
// ---------------------------------------------------------------------

function PayoutReceiptModal({
  payout,
  open,
  onOpenChange,
}: {
  payout: EmployeePayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: business } = useBusiness();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="print:hidden">
          <DialogTitle>Comprobante de Liquidación</DialogTitle>
          <DialogDescription>
            Recibo de entrega de dinero al empleado.
          </DialogDescription>
        </DialogHeader>

        {/* Voucher imprimible */}
        <div id="payout-receipt" className="space-y-4 rounded-xl border border-dashed border-border p-5 bg-card text-foreground">
          <div className="text-center space-y-1 border-b pb-3 border-border">
            <h3 className="font-bold text-base tracking-tight">{business?.name || 'LAVADERO DE VEHÍCULOS'}</h3>
            <p className="text-xs text-muted-foreground">COMPROBANTE DE PAGO A EMPLEADO</p>
            <p className="font-mono text-xs text-muted-foreground">N° {payout.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha y hora:</span>
              <span className="font-medium">{formatSmart(payout.paidAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empleado / Beneficiario:</span>
              <span className="font-bold text-foreground">{payout.employeeName || 'Empleado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concepto:</span>
              <span className="font-medium">{payout.payoutTypeLabel || payout.payoutType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método de pago:</span>
              <span className="font-medium">
                {payout.method === 'CASH' ? 'Efectivo (Caja)' : payout.method}
              </span>
            </div>
            {payout.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Detalles:</span>
                <span className="font-medium">{payout.notes}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground">VALOR PAGADO</p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums mt-0.5">
              {money(payout.amount)}
            </p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-4 text-center text-xs">
            <div className="border-t border-muted-foreground/40 pt-1">
              <p className="font-medium">Firma Administrador</p>
              <p className="text-[10px] text-muted-foreground">Entregado</p>
            </div>
            <div className="border-t border-muted-foreground/40 pt-1">
              <p className="font-medium">Firma Empleado</p>
              <p className="text-[10px] text-muted-foreground">Recibí conforme</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 print:hidden pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="size-4" />
            Imprimir Comprobante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
