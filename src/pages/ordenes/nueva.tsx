'use client';

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { CustomerVehiclePicker } from '@/components/orders/customer-vehicle-picker';
import {
  EvidenceUploader,
  type DraftEvidence,
} from '@/components/orders/evidence-uploader';
import { ServicePicker, type PickedService } from '@/components/orders/service-picker';
import { MoneyInput } from '@/components/shared/money-input';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployees, usePromotions } from '@/hooks/use-catalog';
import { useCustomer } from '@/hooks/use-customers';
import { useCreateOrder } from '@/hooks/use-orders';
import { formatMinutes, money } from '@/lib/format';
import { computeTotals } from '@/lib/totals';
import type { Customer, DiscountType, Vehicle } from '@/lib/types';
import { cn, fullName } from '@/lib/utils';

const NONE = '__none__';

const STEPS = [
  { id: 1, label: 'Cliente', icon: UserRound },
  { id: 2, label: 'Servicios', icon: Sparkles },
  { id: 3, label: 'Evidencias', icon: Camera },
  { id: 4, label: 'Resumen', icon: ClipboardList },
];

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileStep, setMobileStep] = React.useState(1);

  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [services, setServices] = React.useState<PickedService[]>([]);
  const [promotionId, setPromotionId] = React.useState<string>(NONE);
  const [discountType, setDiscountType] = React.useState<DiscountType>('AMOUNT');
  const [discountValue, setDiscountValue] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [evidences, setEvidences] = React.useState<DraftEvidence[]>([]);
  const [customerDialog, setCustomerDialog] = React.useState(false);

  const { data: employees } = useEmployees(true);
  const { data: promotions } = usePromotions(true);
  const createOrder = useCreateOrder();

  const presetCustomerId = searchParams.get('clienteId');
  const presetVehicleId = searchParams.get('vehiculoId');
  const { data: presetCustomer } = useCustomer(customer ? null : presetCustomerId);

  React.useEffect(() => {
    if (!presetCustomer || customer) return;
    setCustomer(presetCustomer);
    const target =
      presetCustomer.vehicles.find((item) => item.id === presetVehicleId) ??
      presetCustomer.vehicles[0] ??
      null;
    setVehicle(target);
  }, [presetCustomer, presetVehicleId, customer]);

  const promotion = promotions?.find((item) => item.id === promotionId) ?? null;

  const totals = computeTotals({
    items: services,
    discountType,
    discountValue,
    promotion: promotion ? { type: promotion.type, value: promotion.value } : null,
  });

  const canSubmit = Boolean(customer && vehicle && services.length > 0);

  const onSubmit = async () => {
    if (!customer || !vehicle) {
      toast.error('Selecciona el cliente y el vehículo');
      return;
    }
    if (services.length === 0) {
      toast.error('Agrega al menos un servicio');
      return;
    }

    const order = await createOrder.mutateAsync({
      customerId: customer.id,
      vehicleId: vehicle.id,
      employeeId: null,
      promotionId: promotionId === NONE ? null : promotionId,
      discountType,
      discountValue,
      notes: notes.trim() || null,
      items: services.map((service) => ({
        serviceId: service.serviceId,
        quantity: service.quantity,
        employeeId: service.employeeId && service.employeeId !== NONE ? service.employeeId : null,
      })),
      evidences: evidences.map((evidence) => ({
        url: evidence.url,
        path: evidence.path,
        stage: 'INITIAL' as const,
        damageType: evidence.damageType,
        note: evidence.note || null,
      })),
    });

    navigate(`/ordenes/${order.id}`);
  };

  const stepOk = (step: number) => {
    if (step === 1) return Boolean(customer && vehicle);
    if (step === 2) return services.length > 0;
    return true;
  };

  const canGoNext = (step: number) => {
    if (step === 1) return Boolean(customer && vehicle);
    if (step === 2) return services.length > 0;
    return true;
  };

  // ── SHARED PANELS ────────────────────────────────────────────
  const panel1 = (
    <CustomerVehiclePicker
      customer={customer}
      vehicle={vehicle}
      onSelectCustomer={setCustomer}
      onSelectVehicle={setVehicle}
      onNewCustomer={() => setCustomerDialog(true)}
    />
  );

  const panel2 = <ServicePicker selected={services} onChange={setServices} />;

  const panel3 = (
    <EvidenceUploader stage="INITIAL" items={evidences} onChange={setEvidences} />
  );

  const panel4 = (
    <div className="space-y-4">
      {/* Servicios elegidos */}
      {services.length === 0 ? (
        <p className="rounded-lg bg-muted/40 py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste servicios.
        </p>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.serviceId} className="space-y-1.5 rounded-xl border border-border/60 p-3">
              <div className="flex items-start gap-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{service.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {service.quantity} × {money(service.price)} ·{' '}
                    {formatMinutes(service.durationMin * service.quantity)}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {money(service.price * service.quantity)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setServices((prev) =>
                      prev.filter((item) => item.serviceId !== service.serviceId),
                    )
                  }
                  aria-label={`Quitar ${service.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-muted-foreground shrink-0">Atendido por:</span>
                <Select
                  value={service.employeeId || NONE}
                  onValueChange={(val) => {
                    setServices((prev) =>
                      prev.map((item) =>
                        item.serviceId === service.serviceId
                          ? { ...item, employeeId: val === NONE ? undefined : val }
                          : item,
                      ),
                    );
                  }}
                >
                  <SelectTrigger className="h-7 text-xs py-0">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin asignar</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {/* Promoción */}
      <div className="space-y-2">
        <Label htmlFor="promotion">Promoción</Label>
        <Select value={promotionId} onValueChange={setPromotionId}>
          <SelectTrigger id="promotion">
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

      {/* Descuento */}
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
              aria-label="Monto de descuento"
            />
          ) : (
            <Input
              type="number"
              min={0}
              max={100}
              value={discountValue || ''}
              onChange={(event) => setDiscountValue(Number(event.target.value) || 0)}
              placeholder="0"
              className="flex-1 tabular-nums"
              aria-label="Porcentaje de descuento"
            />
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-2">
        <Label htmlFor="order-notes">Observaciones</Label>
        <Textarea
          id="order-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Indicaciones del cliente, detalles a cuidar..."
          className="min-h-[70px]"
        />
      </div>

      <Separator />

      {/* Totales */}
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
        <Row
          label="Tiempo estimado"
          value={formatMinutes(totals.estimatedMin)}
          className="text-muted-foreground"
        />
        <Separator className="my-2" />
        <div className="flex items-baseline justify-between">
          <dt className="font-medium">Total</dt>
          <dd className="text-2xl font-semibold tabular-nums">{money(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );

  const PANELS = [panel1, panel2, panel3, panel4];

  // ── MOBILE VIEW ───────────────────────────────────────────────
  const mobileView = (
    <div className="flex flex-col xl:hidden">
      {/* Step progress bar */}
      <div className="mb-4 flex items-center gap-1.5">
        {STEPS.map((step) => {
          const done = stepOk(step.id);
          const active = step.id === mobileStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setMobileStep(step.id)}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  'flex h-1 w-full rounded-full transition-colors',
                  active ? 'bg-primary' : done ? 'bg-primary/40' : 'bg-border',
                )}
              />
              <span className="flex items-center gap-1">
                {done && !active ? (
                  <CheckCircle2 className="size-3 text-primary" />
                ) : null}
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <StepBadge step={mobileStep} />
            {React.createElement(STEPS[mobileStep - 1].icon, {
              className: 'size-4 text-muted-foreground',
              'aria-hidden': true,
            })}
            {STEPS[mobileStep - 1].label}
            {mobileStep === 3 && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">{PANELS[mobileStep - 1]}</CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="mt-4 flex gap-3">
        {mobileStep > 1 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setMobileStep((s) => s - 1)}
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>
        )}
        {mobileStep < 4 ? (
          <Button
            className="flex-1"
            disabled={!canGoNext(mobileStep)}
            onClick={() => setMobileStep((s) => s + 1)}
          >
            Siguiente
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            disabled={!canSubmit}
            loading={createOrder.isPending}
            onClick={() => void onSubmit()}
          >
            Crear orden
          </Button>
        )}
      </div>

      {/* Mini summary bar when services selected */}
      {services.length > 0 && mobileStep !== 4 && (
        <button
          type="button"
          onClick={() => setMobileStep(4)}
          className="mt-3 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">
            {services.length} servicio{services.length !== 1 ? 's' : ''}
          </span>
          <span className="text-lg font-semibold tabular-nums text-primary">
            {money(totals.total)}
          </span>
        </button>
      )}
    </div>
  );

  // ── DESKTOP VIEW (xl+) ───────────────────────────────────────
  const desktopView = (
    <div className="hidden xl:grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge step={1} />
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
              Cliente y vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>{panel1}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge step={2} />
              <Sparkles className="size-4 text-muted-foreground" aria-hidden />
              Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>{panel2}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge step={3} />
              <Camera className="size-4 text-muted-foreground" aria-hidden />
              Evidencias iniciales
              <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>{panel3}</CardContent>
        </Card>
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
              Resumen de la orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {panel4}
            <Button
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              loading={createOrder.isPending}
              onClick={() => void onSubmit()}
            >
              Crear orden
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Se generará número, fecha, hora y estado Pendiente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Nueva orden"
        description="Cliente, servicios y evidencias en una sola pantalla."
        actions={
          <Button variant="outline" className="hidden sm:inline-flex" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Volver
          </Button>
        }
      />

      {mobileView}
      {desktopView}

      <CustomerDialog
        open={customerDialog}
        onOpenChange={setCustomerDialog}
        onCreated={(created) => {
          setCustomer(created);
          setVehicle(created.vehicles?.[0] ?? null);
        }}
      />
    </>
  );
}

function StepBadge({ step }: { step: number }) {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {step}
    </span>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
