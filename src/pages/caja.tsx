'use client';

import * as React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  HandCoins,
  Plus,
  Receipt,
  Scale,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { MoneyInput } from '@/components/shared/money-input';
import { PageHeader } from '@/components/shared/page-header';
import { RangeFilter, type RangeValue } from '@/components/shared/range-filter';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/shared/error-state';
import { useCashReport, useDeleteExpense, useExpenses, useSaveExpense } from '@/hooks/use-reports';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_META,
  PAYMENT_METHOD_META,
} from '@/lib/constants';
import { formatSmart, money, toInputDate } from '@/lib/format';
import type { ExpenseCategory, PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function CashPage() {
  const [range, setRange] = React.useState<RangeValue>({ preset: 'today' });
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const { data: cash, isLoading, isError, error, refetch } = useCashReport(range);
  const { data: expenses } = useExpenses(range);
  const deleteExpense = useDeleteExpense();

  const summary = cash?.summary;

  const methodRows: { method: PaymentMethod; amount: number; icon: typeof Banknote }[] = [
    { method: 'CASH', amount: summary?.cash ?? 0, icon: Banknote },
    { method: 'CARD', amount: summary?.card ?? 0, icon: CreditCard },
    { method: 'TRANSFER', amount: summary?.transfer ?? 0, icon: ArrowUpRight },
    { method: 'YAPE', amount: summary?.yape ?? 0, icon: Smartphone },
    { method: 'PLIN', amount: summary?.plin ?? 0, icon: Smartphone },
  ];

  const total = summary?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Caja"
        description="Movimientos de dinero, gastos y balance del período."
        actions={
          <Button onClick={() => setExpenseOpen(true)}>
            <Plus />
            Registrar gasto
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <RangeFilter value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {/* Resumen */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total vendido"
          value={money(total)}
          icon={Wallet}
          tone="primary"
          loading={isLoading}
        />
        <StatCard
          label="Total propinas"
          value={money(summary?.tips)}
          icon={HandCoins}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          label="Total gastos"
          value={money(summary?.expenses)}
          icon={Receipt}
          tone="rose"
          loading={isLoading}
          hint={`${summary?.expensesCount ?? 0} movimientos`}
        />
        <StatCard
          label="Balance final"
          value={money(summary?.balance)}
          icon={Scale}
          tone={(summary?.balance ?? 0) >= 0 ? 'emerald' : 'rose'}
          loading={isLoading}
          hint="Ingresos menos gastos"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Desglose por método */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              methodRows.map(({ method, amount, icon: Icon }) => {
                const share = total > 0 ? Math.round((amount / total) * 100) : 0;
                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1 font-medium">{PAYMENT_METHOD_META[method].label}</span>
                      <span className="tabular-nums">{money(amount)}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                        {share}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Total ingresos" value={money(total)} />
              <Row
                label="Total gastos"
                value={`- ${money(summary?.expenses)}`}
                className="text-destructive"
              />
              <div className="flex items-baseline justify-between pt-1.5">
                <span className="font-medium">Balance</span>
                <span className="text-xl font-semibold tabular-nums">
                  {money(summary?.balance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {isLoading ? (
              <div className="space-y-2 px-5 pb-5">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : (cash?.movements.length ?? 0) === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Sin movimientos en el período"
                description="Los cobros y gastos registrados aparecerán aquí."
              />
            ) : (
              <>
                {/* Móvil: lista de movimientos */}
                <ul className="divide-y divide-border/60 md:hidden">
                  {cash?.movements.map((movement) => {
                    const income = movement.kind === 'INCOME';
                    return (
                      <li key={`${movement.kind}-${movement.id}`} className="p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              'grid size-7 shrink-0 place-items-center rounded-md',
                              income ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
                            )}>
                              {income ? (
                                <ArrowUpRight className="size-4" aria-hidden />
                              ) : (
                                <ArrowDownRight className="size-4" aria-hidden />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{movement.description}</p>
                              {movement.reference ? (
                                <p className="font-mono text-[11px] text-muted-foreground">{movement.reference}</p>
                              ) : null}
                            </div>
                          </div>

                          <span className={cn(
                            'font-bold text-sm tabular-nums shrink-0',
                            income ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                          )}>
                            {income ? '+' : '−'} {money(Math.abs(movement.amount))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={income ? 'muted' : 'destructive'} className="text-[10px] px-1.5 py-0">
                              {income
                                ? PAYMENT_METHOD_META[movement.method as PaymentMethod]?.label ?? movement.method
                                : EXPENSE_CATEGORY_META[movement.method as ExpenseCategory]?.label ?? 'Gasto'}
                            </Badge>
                            {movement.tip > 0 ? (
                              <span className="text-[11px] text-muted-foreground">propina {money(movement.tip)}</span>
                            ) : null}
                          </div>
                          <span>{formatSmart(movement.at)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Escritorio: tabla de movimientos */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="hidden sm:table-cell">Detalle</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cash?.movements.map((movement) => {
                        const income = movement.kind === 'INCOME';
                        return (
                          <TableRow key={`${movement.kind}-${movement.id}`}>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatSmart(movement.at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {income ? (
                                  <ArrowUpRight
                                    className="size-4 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden
                                  />
                                ) : (
                                  <ArrowDownRight className="size-4 text-destructive" aria-hidden />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{movement.description}</p>
                                  {movement.reference ? (
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {movement.reference}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant={income ? 'muted' : 'destructive'}>
                                {income
                                  ? PAYMENT_METHOD_META[movement.method as PaymentMethod]?.label ??
                                    movement.method
                                  : EXPENSE_CATEGORY_META[movement.method as ExpenseCategory]?.label ??
                                    'Gasto'}
                              </Badge>
                              {movement.tip > 0 ? (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  propina {money(movement.tip)}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell
                              className={cn(
                                'text-right font-medium tabular-nums',
                                income ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                              )}
                            >
                              {income ? '+' : '−'} {money(Math.abs(movement.amount))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gastos del período */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Gastos del período</CardTitle>
          <span className="text-sm text-muted-foreground">
            Total: <strong className="text-foreground">{money(expenses?.total)}</strong>
          </span>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {(expenses?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin gastos registrados"
              description="Registra insumos, pagos al personal o servicios para tener el balance real."
              action={
                <Button size="sm" variant="outline" onClick={() => setExpenseOpen(true)}>
                  <Plus />
                  Registrar gasto
                </Button>
              }
            />
          ) : (
            <>
              {/* Móvil: lista de gastos */}
              <ul className="divide-y divide-border/60 md:hidden">
                {expenses?.data.map((expense) => (
                  <li key={expense.id} className="p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{expense.concept}</p>
                          <Badge variant="muted" className="text-[10px] px-1.5 py-0 shrink-0">
                            {EXPENSE_CATEGORY_META[expense.category].label}
                          </Badge>
                        </div>
                        {expense.notes ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{expense.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-sm tabular-nums text-destructive">
                          − {money(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => setToDelete(expense.id)}
                          aria-label="Eliminar gasto"
                        >
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      {formatSmart(expense.spentAt)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla de gastos */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.data.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatSmart(expense.spentAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{expense.concept}</p>
                          {expense.notes ? (
                            <p className="text-xs text-muted-foreground">{expense.notes}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted">{EXPENSE_CATEGORY_META[expense.category].label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-destructive">
                          − {money(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setToDelete(expense.id)}
                            aria-label="Eliminar gasto"
                          >
                            <Trash2 />
                          </Button>
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

      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar gasto?"
        description="El balance de caja se recalculará."
        confirmLabel="Eliminar"
        destructive
        loading={deleteExpense.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteExpense.mutateAsync(toDelete);
          setToDelete(null);
        }}
      />
    </>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const saveExpense = useSaveExpense();

  const [concept, setConcept] = React.useState('');
  const [category, setCategory] = React.useState<ExpenseCategory>('SUPPLIES');
  const [amount, setAmount] = React.useState(0);
  const [spentAt, setSpentAt] = React.useState(toInputDate(new Date()));
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setConcept('');
    setCategory('SUPPLIES');
    setAmount(0);
    setSpentAt(toInputDate(new Date()));
    setNotes('');
  }, [open]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (concept.trim().length < 2) {
      toast.error('Describe el gasto');
      return;
    }
    if (amount <= 0) {
      toast.error('Indica el monto del gasto');
      return;
    }

    await saveExpense.mutateAsync({
      concept: concept.trim(),
      category,
      amount,
      notes: notes.trim() || null,
      spentAt,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
          <DialogDescription>
            Los gastos se descuentan del balance final de la caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-concept">Concepto *</Label>
            <Input
              id="expense-concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="Compra de shampoo para autos"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Monto *</Label>
              <MoneyInput
                id="expense-amount"
                value={amount}
                onValueChange={setAmount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Fecha</Label>
              <Input
                id="expense-date"
                type="date"
                value={spentAt}
                onChange={(event) => setSpentAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoría</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
              <SelectTrigger id="expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {EXPENSE_CATEGORY_META[item].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-notes">Notas</Label>
            <Textarea
              id="expense-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Proveedor, número de factura..."
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saveExpense.isPending}>
              Registrar gasto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
