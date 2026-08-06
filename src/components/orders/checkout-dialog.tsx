'use client';

import * as React from 'react';
import { Banknote, Camera, Check, FileCheck2, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  EvidenceUploader,
  type DraftEvidence,
} from '@/components/orders/evidence-uploader';
import { MoneyInput } from '@/components/shared/money-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBusiness, usePromotions } from '@/hooks/use-catalog';
import { useCheckoutOrder } from '@/hooks/use-orders';
import { PAYMENT_METHODS, PAYMENT_METHOD_META, TIP_SUGGESTIONS } from '@/lib/constants';
import { money } from '@/lib/format';
import { computeTotals } from '@/lib/totals';
import type { DiscountType, Order, PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';

const NONE = '__none__';

interface PaymentLine {
  method: PaymentMethod;
  amount: number;
  reference: string;
}

export function CheckoutDialog({
  order,
  open,
  onOpenChange,
  onFinished,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished?: (order: Order) => void;
}) {
  const checkout = useCheckoutOrder();
  const { data: promotions } = usePromotions(true);

  const [tip, setTip] = React.useState(0);
  const [discountType, setDiscountType] = React.useState<DiscountType>('AMOUNT');
  const [discountValue, setDiscountValue] = React.useState(0);
  const [promotionId, setPromotionId] = React.useState<string>(NONE);
  const [requiresInvoice, setRequiresInvoice] = React.useState(false);
  const [payments, setPayments] = React.useState<PaymentLine[]>([
    { method: 'CASH', amount: 0, reference: '' },
  ]);
  const [finalEvidences, setFinalEvidences] = React.useState<DraftEvidence[]>([]);

  // Reinicia el formulario con los valores actuales de la orden.
  React.useEffect(() => {
    if (!open) return;
    setTip(order.tip ?? 0);
    setDiscountType(order.discountType);
    setDiscountValue(order.discountValue);
    setPromotionId(order.promotionId ?? NONE);
    setRequiresInvoice(false);
    setFinalEvidences([]);
    setPayments([{ method: 'CASH', amount: 0, reference: '' }]);
  }, [open, order]);

  const promotion = promotions?.find((item) => item.id === promotionId) ?? null;

  const totals = computeTotals({
    items: order.items.map((item) => ({
      price: item.price,
      quantity: item.quantity,
      durationMin: item.durationMin,
    })),
    discountType,
    discountValue,
    promotion: promotion ? { type: promotion.type, value: promotion.value } : null,
    tip,
  });

  const paid = payments.reduce((acc, payment) => acc + payment.amount, 0);
  const pending = totals.total - paid;
  const change = paid - totals.total;
  const singlePayment = payments.length === 1;

  const updatePayment = (index: number, patch: Partial<PaymentLine>) => {
    setPayments((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  /** Un solo método: se autocompleta con el total pendiente. */
  const fillFirstPayment = () => {
    if (singlePayment) updatePayment(0, { amount: totals.total });
  };

  React.useEffect(() => {
    if (singlePayment && payments[0].amount === 0) fillFirstPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.total, singlePayment]);

  const onSubmit = async () => {
    if (paid < totals.total) {
      toast.error(`Falta cubrir ${money(pending)}`);
      return;
    }

    const result = await checkout.mutateAsync({
      id: order.id,
      tip,
      discountType,
      discountValue,
      promotionId: promotionId === NONE ? null : promotionId,
      requiresInvoice,
      payments: payments
        .filter((payment) => payment.amount > 0)
        .map((payment) => ({
          method: payment.method,
          amount: payment.amount,
          reference: payment.reference.trim() || null,
        })),
      finalEvidences: finalEvidences.map((evidence) => ({
        url: evidence.url,
        path: evidence.path,
        note: evidence.note || null,
      })),
    });

    onOpenChange(false);
    onFinished?.(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden />
            Cobrar orden {order.number}
          </DialogTitle>
          <DialogDescription>
            {order.customer.firstName} {order.customer.lastName} · {order.vehicle.plate}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cobro">
          <TabsList>
            <TabsTrigger value="cobro">
              <Banknote className="size-4" />
              Cobro
            </TabsTrigger>
            <TabsTrigger value="evidencias">
              <Camera className="size-4" />
              Evidencias finales
              {finalEvidences.length > 0 ? (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {finalEvidences.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cobro">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* Métodos de pago */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Métodos de pago</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPayments((prev) => [
                          ...prev,
                          { method: 'CASH', amount: Math.max(0, pending), reference: '' },
                        ])
                      }
                    >
                      <Plus />
                      Dividir pago
                    </Button>
                  </div>

                  {payments.map((payment, index) => (
                    <div key={index} className="space-y-2 rounded-xl border border-border/70 p-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {PAYMENT_METHODS.map((method) => {
                          const active = payment.method === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => updatePayment(index, { method })}
                              className={cn(
                                'flex flex-col items-center gap-0.5 rounded-lg border p-2.5 text-center transition-all',
                                active
                                  ? 'border-primary bg-primary/5 shadow-soft'
                                  : 'border-border/70 hover:border-primary/50',
                              )}
                            >
                              <span
                                className={cn(
                                  'text-[13px] font-medium',
                                  active && PAYMENT_METHOD_META[method].className,
                                )}
                              >
                                {PAYMENT_METHOD_META[method].label}
                              </span>
                              {active ? (
                                <Check className="size-3 text-primary" aria-hidden />
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  {PAYMENT_METHOD_META[method].hint}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Monto recibido</Label>
                          <MoneyInput
                            value={payment.amount}
                            onValueChange={(amount) => updatePayment(index, { amount })}
                            aria-label="Monto recibido"
                          />
                        </div>
                        {payment.method !== 'CASH' ? (
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs">Referencia / operación</Label>
                            <Input
                              value={payment.reference}
                              onChange={(event) =>
                                updatePayment(index, { reference: event.target.value })
                              }
                              placeholder="Nº de operación"
                            />
                          </div>
                        ) : null}
                        {payments.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="self-end text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setPayments((prev) => prev.filter((_, i) => i !== index))
                            }
                            aria-label="Quitar método de pago"
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Propina */}
                <div className="space-y-2">
                  <Label>Propina</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {TIP_SUGGESTIONS.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant={tip === amount ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTip(tip === amount ? 0 : amount)}
                      >
                        {money(amount)}
                      </Button>
                    ))}
                    <MoneyInput
                      value={tip}
                      onValueChange={setTip}
                      className="w-32"
                      aria-label="Propina"
                    />
                  </div>
                </div>

                {/* Ajustes de precio */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Descuento</Label>
                    <div className="flex gap-2">
                      <Tabs
                        value={discountType}
                        onValueChange={(value) => setDiscountType(value as DiscountType)}
                      >
                        <TabsList className="h-10">
                          <TabsTrigger value="AMOUNT">Monto</TabsTrigger>
                          <TabsTrigger value="PERCENT">%</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      {discountType === 'AMOUNT' ? (
                        <MoneyInput
                          value={discountValue}
                          onValueChange={setDiscountValue}
                          className="flex-1"
                          aria-label="Descuento"
                        />
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={discountValue || ''}
                          onChange={(event) => setDiscountValue(Number(event.target.value) || 0)}
                          className="flex-1 tabular-nums"
                          placeholder="0"
                          aria-label="Descuento porcentual"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkout-promotion">Promoción</Label>
                    <Select value={promotionId} onValueChange={setPromotionId}>
                      <SelectTrigger id="checkout-promotion">
                        <SelectValue placeholder="Sin promoción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sin promoción</SelectItem>
                        {promotions?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ·{' '}
                            {item.type === 'PERCENT' ? `${item.value}%` : money(item.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Factura electrónica */}
                <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <Checkbox
                    id="requires-invoice"
                    checked={requiresInvoice}
                    onCheckedChange={(checked) => setRequiresInvoice(checked === true)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="requires-invoice"
                      className="flex cursor-pointer items-center gap-1.5 font-medium"
                    >
                      <FileCheck2 className="size-4" />
                      ¿Requiere factura electrónica?
                    </Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Si se marca, se emitirá factura electrónica automáticamente al finalizar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                <dl className="space-y-1.5 text-sm">
                  <Row label="Subtotal" value={money(totals.subtotal)} />
                  {totals.discountTotal > 0 ? (
                    <Row
                      label="Descuento"
                      value={`- ${money(totals.discountTotal)}`}
                      className="text-destructive"
                    />
                  ) : null}
                  {totals.promotionTotal > 0 ? (
                    <Row
                      label={`Promoción · ${promotion?.name ?? ''}`}
                      value={`- ${money(totals.promotionTotal)}`}
                      className="text-destructive"
                    />
                  ) : null}
                  {totals.tip > 0 ? (
                    <Row label="Propina" value={money(totals.tip)} />
                  ) : null}
                </dl>

                <Separator />

                <div className="flex items-baseline justify-between">
                  <span className="font-medium">Total a cobrar</span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {money(totals.total)}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  <Row label="Recibido" value={money(paid)} />
                  {pending > 0 ? (
                    <Row
                      label="Falta"
                      value={money(pending)}
                      className="font-semibold text-destructive"
                    />
                  ) : change > 0 ? (
                    <Row
                      label="Vuelto"
                      value={money(change)}
                      className="font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                  ) : (
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4" aria-hidden />
                      Monto exacto
                    </p>
                  )}
                </div>

                {singlePayment ? (
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={fillFirstPayment}>
                    Usar monto exacto
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidencias">
            <EvidenceUploader stage="FINAL" items={finalEvidences} onChange={setFinalEvidences} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="lg"
            variant="success"
            loading={checkout.isPending}
            disabled={pending > 0}
            onClick={() => void onSubmit()}
          >
            <Banknote />
            Cobrar y finalizar · {money(totals.total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
