import * as React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Banknote,
  Camera,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  History,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  Receipt,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { AddServicesDialog } from '@/components/orders/add-services-dialog';
import { CheckoutDialog } from '@/components/orders/checkout-dialog';
import {
  EvidenceUploader,
  type DraftEvidence,
} from '@/components/orders/evidence-uploader';
import { TicketDialog } from '@/components/orders/ticket-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness, useEmployees } from '@/hooks/use-catalog';
import { useCustomer } from '@/hooks/use-customers';
import {
  useElectronicInvoices,
  useIssueElectronicInvoice,
} from '@/hooks/use-electronic-invoices';
import {
  useAddEvidences,
  useCancelOrder,
  useChangeOrderStatus,
  useOrder,
  useRemoveEvidence,
  useRemoveOrderItem,
  useUpdateOrder,
} from '@/hooks/use-orders';
import {
  DAMAGE_TYPE_META,
  NEXT_STATUS,
  PAYMENT_METHOD_META,
  VEHICLE_TYPE_META,
} from '@/lib/constants';
import { formatDateTime, formatMinutes, formatSmart, money } from '@/lib/format';
import type { Customer, EvidenceStage, Order } from '@/lib/types';
import { cn, digitsOnly, fullName } from '@/lib/utils';

const NONE = '__none__';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';

  const { data: order, isLoading } = useOrder(id ?? null);
  const { data: employees } = useEmployees(true);
  const { data: business } = useBusiness();
  const issueInvoice = useIssueElectronicInvoice();

  const changeStatus = useChangeOrderStatus();
  const updateOrder = useUpdateOrder();
  const removeItem = useRemoveOrderItem();
  const cancelOrder = useCancelOrder();

  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [ticketOpen, setTicketOpen] = React.useState(false);
  const [addServicesOpen, setAddServicesOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [itemToRemove, setItemToRemove] = React.useState<string | null>(null);

  // Abre el cobro directo con ?cobrar=1 (solo para admin/cajero)
  React.useEffect(() => {
    if (!isOperator && searchParams.get('cobrar') === '1' && order && order.status !== 'FINISHED') {
      setCheckoutOpen(true);
      navigate(`/ordenes/${id}`, { replace: true });
    }
  }, [isOperator, searchParams, order, id, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <p className="font-medium">No encontramos esta orden</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/ordenes')}>
            <ArrowLeft />
            Volver a órdenes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const editable = order.status !== 'FINISHED' && order.status !== 'CANCELLED';
  const next = NEXT_STATUS[order.status];
  const initialEvidences = order.evidences.filter((item) => item.stage === 'INITIAL');
  const finalEvidences = order.evidences.filter((item) => item.stage === 'FINAL');

  const onWhatsApp = () => {
    const phone = digitsOnly(order.customer.phone);
    if (!phone) {
      toast.error('El cliente no tiene teléfono registrado');
      return;
    }
    const text = `Hola ${order.customer.firstName}, tu vehículo ${order.vehicle.plate} está ${
      order.status === 'READY' ? 'listo para entregar' : 'en proceso'
    }. Orden ${order.number}.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <>
      <PageHeader
        title={`Orden ${order.number}`}
        description={`Ingreso ${formatDateTime(order.checkInAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => navigate('/ordenes')}>
              <ArrowLeft />
              Volver
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setTicketOpen(true)}>
              <Printer className="size-4" />
              <span>Ticket</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onWhatsApp}>
              <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </Button>
            {editable ? (
              <>
                {!isOperator && (
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setAddServicesOpen(true)}>
                    <Plus className="size-4" />
                    <span>Servicio</span>
                  </Button>
                )}
                {next ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    loading={changeStatus.isPending}
                    onClick={() =>
                      void changeStatus.mutateAsync({ id: order.id, status: next.status })
                    }
                  >
                    {next.label}
                  </Button>
                ) : null}
                {!isOperator && (
                  <Button variant="success" size="sm" className="w-full sm:w-auto font-semibold" onClick={() => setCheckoutOpen(true)}>
                    <Banknote className="size-4" />
                    <span>Cobrar</span>
                  </Button>
                )}
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Cabecera con estado */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted text-2xl">
                {VEHICLE_TYPE_META[order.vehicle.type].icon}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{order.vehicle.plate}</h2>
                  <StatusBadge status={order.status} />
                  {order.evidences.length > 0 ? (
                    <Badge variant="muted">
                      <Camera className="size-3" />
                      {order.evidences.length} evidencia{order.evidences.length === 1 ? '' : 's'}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[order.vehicle.brand, order.vehicle.model, order.vehicle.color]
                    .filter(Boolean)
                    .join(' · ') || VEHICLE_TYPE_META[order.vehicle.type].label}
                </p>
              </div>

              {order.vehicle.photoUrl ? (
                <div className="relative size-20 overflow-hidden rounded-lg border border-border">
                  <img
                    src={order.vehicle.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {order.status === 'CANCELLED' && order.cancelReason ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Ban className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <div>
                  <p className="font-medium text-destructive">Orden cancelada</p>
                  <p className="text-muted-foreground">{order.cancelReason}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Servicios */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Servicios</CardTitle>
              {editable ? (
                <Button variant="ghost" size="sm" onClick={() => setAddServicesOpen(true)}>
                  <Plus />
                  Agregar
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/60">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {item.name}
                        {item.quantity > 1 ? (
                          <span className="ml-1.5 text-sm text-muted-foreground">
                            ×{item.quantity}
                          </span>
                        ) : null}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span>{money(item.price)} c/u</span>
                        {item.durationMin > 0 ? (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" aria-hidden />
                            {formatMinutes(item.durationMin * item.quantity)}
                          </span>
                        ) : null}
                        {item.employeeName ? <span>{item.employeeName}</span> : null}
                      </p>
                    </div>

                    <span className="shrink-0 font-medium tabular-nums">
                      {money(item.price * item.quantity)}
                    </span>

                    {editable && !isOperator && order.items.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setItemToRemove(item.id)}
                        aria-label={`Quitar ${item.name}`}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Evidencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-4 text-muted-foreground" aria-hidden />
                Evidencias fotográficas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="INITIAL">
                <TabsList>
                  <TabsTrigger value="INITIAL">Iniciales ({initialEvidences.length})</TabsTrigger>
                  <TabsTrigger value="FINAL">Finales ({finalEvidences.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="INITIAL">
                  <EvidenceSection
                    order={order}
                    stage="INITIAL"
                    items={initialEvidences}
                    editable={order.status !== 'CANCELLED'}
                  />
                </TabsContent>
                <TabsContent value="FINAL">
                  <EvidenceSection
                    order={order}
                    stage="FINAL"
                    items={finalEvidences}
                    editable={order.status !== 'CANCELLED'}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Bitácora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" aria-hidden />
                Historial de la orden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {order.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSmart(event.createdAt)}
                        {event.userName ? ` · ${event.userName}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-muted-foreground" aria-hidden />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-medium">
                {fullName(order.customer.firstName, order.customer.lastName)}
              </p>
              {order.customer.phone ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" aria-hidden />
                  {order.customer.phone}
                </p>
              ) : null}
              {order.customer.notes ? (
                <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                  {order.customer.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {order.status === 'FINISHED' ? (
            <ElectronicInvoiceCard orderId={order.id} customerId={order.customer.id} />
          ) : null}

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-4 text-muted-foreground" aria-hidden />
                Importes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={money(order.subtotal)} />
                {order.discountTotal > 0 ? (
                  <Row
                    label={`Descuento${order.discountType === 'PERCENT' ? ` (${order.discountValue}%)` : ''}`}
                    value={`- ${money(order.discountTotal)}`}
                    className="text-destructive"
                  />
                ) : null}
                {order.promotionTotal > 0 ? (
                  <Row
                    label={`Promoción · ${order.promotion?.name ?? ''}`}
                    value={`- ${money(order.promotionTotal)}`}
                    className="text-destructive"
                  />
                ) : null}
                {order.tip > 0 ? <Row label="Propina" value={money(order.tip)} /> : null}
                <Row
                  label="Tiempo estimado"
                  value={formatMinutes(order.estimatedMin)}
                  className="text-muted-foreground"
                />
              </dl>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {money(order.total)}
                </span>
              </div>

              {order.payments.length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-1.5 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pagos registrados
                    </p>
                    {order.payments.map((payment) => (
                      <Row
                        key={payment.id}
                        label={PAYMENT_METHOD_META[payment.method].label}
                        value={money(payment.amount)}
                      />
                    ))}
                    {order.finishedAt ? (
                      <p className="pt-1 text-xs text-muted-foreground">
                        Cobrada {formatDateTime(order.finishedAt)}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Asignación y notas */}
          <Card>
            <CardHeader>
              <CardTitle>Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-employee">Empleado responsable</Label>
                <Select
                  value={order.employeeId ?? NONE}
                  disabled={!editable || updateOrder.isPending}
                  onValueChange={(value) =>
                    void updateOrder.mutateAsync({
                      id: order.id,
                      employeeId: value === NONE ? null : value,
                    })
                  }
                >
                  <SelectTrigger id="order-employee">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin asignar</SelectItem>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} · {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <NotesEditor order={order} editable={editable && !isOperator} />

              {editable && !isOperator ? (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <Ban />
                  Cancelar orden
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogos */}
      <CheckoutDialog
        order={order}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onFinished={(finishedOrder) => {
          setTicketOpen(true);
          // Emitir factura automáticamente si el cliente la solicitó
          if (business?.factusEnabled && finishedOrder.requiresInvoice) {
            void issueInvoice.mutateAsync(finishedOrder.id).catch(() => {
              // Error ya mostrado por el hook, solo evitamos propagación
            });
          }
        }}
      />
      <TicketDialog order={order} open={ticketOpen} onOpenChange={setTicketOpen} />
      <AddServicesDialog order={order} open={addServicesOpen} onOpenChange={setAddServicesOpen} />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason('');
        }}
        title="¿Cancelar la orden?"
        description="La orden quedará registrada como cancelada. Indica el motivo."
        confirmLabel="Cancelar orden"
        cancelLabel="Volver"
        destructive
        loading={cancelOrder.isPending}
        onConfirm={async () => {
          if (cancelReason.trim().length < 3) {
            toast.error('Indica el motivo de la cancelación');
            return;
          }
          await cancelOrder.mutateAsync({ id: order.id, reason: cancelReason.trim() });
          setCancelOpen(false);
          setCancelReason('');
        }}
      >
        <Textarea
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Motivo de la cancelación"
          className="min-h-[70px]"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(itemToRemove)}
        onOpenChange={(open) => !open && setItemToRemove(null)}
        title="¿Quitar este servicio?"
        description="El total de la orden se recalculará automáticamente."
        confirmLabel="Quitar"
        destructive
        loading={removeItem.isPending}
        onConfirm={async () => {
          if (!itemToRemove) return;
          await removeItem.mutateAsync({ id: order.id, itemId: itemToRemove });
          setItemToRemove(null);
        }}
      />
    </>
  );
}

/** Estado y acciones de la factura electrónica asociada a la orden. */
function ElectronicInvoiceCard({ orderId, customerId }: { orderId: string; customerId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: business, isLoading: businessLoading } = useBusiness();
  const {
    data: invoices,
    isLoading: invoicesLoading,
    isError: invoicesError,
    error: invoicesQueryError,
  } = useElectronicInvoices(orderId);
  const issueInvoice = useIssueElectronicInvoice();
  const invoice = invoices?.[0];
  const canIssue = user?.role === 'ADMIN' || user?.role === 'CASHIER';
  const missing = customer ? missingFiscalFields(customer) : [];
  const missingConfiguration = business?.factusDefaultMunicipalityCode
    ? []
    : ['municipio DANE predeterminado'];

  const statusMeta = invoice
    ? {
        PENDING: { label: 'Pendiente', variant: 'warning' as const },
        SUBMITTING: { label: 'Procesando', variant: 'warning' as const },
        VALIDATED: { label: 'Validada', variant: 'success' as const },
        FAILED: { label: 'Fallida', variant: 'destructive' as const },
      }[invoice.status]
    : null;

  const copyCufe = async () => {
    if (!invoice?.cufe) return;
    try {
      await navigator.clipboard.writeText(invoice.cufe);
      toast.success('CUFE copiado');
    } catch {
      toast.error('No se pudo copiar el CUFE');
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="size-4 text-muted-foreground" aria-hidden />
          Factura electrónica
        </CardTitle>
        {statusMeta ? <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge> : null}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {customerLoading || businessLoading || invoicesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : invoicesError ? (
          <p className="text-sm text-destructive">
            {invoicesQueryError instanceof Error
              ? invoicesQueryError.message
              : 'No se pudo consultar la factura'}
          </p>
        ) : invoice?.status === 'VALIDATED' ? (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Número Factus</p>
              <p className="font-semibold">{invoice.number ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">CUFE</p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {invoice.cufe ?? '—'}
              </p>
            </div>
            {invoice.validatedAt ? (
              <p className="text-xs text-muted-foreground">
                Validada {formatDateTime(invoice.validatedAt)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {invoice.cufe ? (
                <Button variant="outline" size="sm" onClick={() => void copyCufe()}>
                  <Copy />
                  Copiar CUFE
                </Button>
              ) : null}
              {invoice.qrUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={invoice.qrUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Ver QR
                  </a>
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {missing.length > 0 ? (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="font-medium">Faltan datos fiscales del cliente</p>
                <p className="mt-1 text-xs">{missing.join(', ')}.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate(`/clientes?editar=${customerId}`)}
                >
                  Completar datos
                </Button>
              </div>
            ) : null}

            {missingConfiguration.length > 0 ? (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="font-medium">Falta configuración del negocio</p>
                <p className="mt-1 text-xs">{missingConfiguration.join(', ')}.</p>
                {user?.role === 'ADMIN' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/configuracion?tab=factus')}
                  >
                    Configurar Factus
                  </Button>
                ) : null}
              </div>
            ) : null}

            {invoice?.status === 'FAILED' ? (
              <div>
                <p className="font-medium text-destructive">Factus no validó la factura.</p>
                <p className="text-xs text-muted-foreground">
                  Intentos realizados: {invoice.attemptCount}. Puedes reintentar con la misma referencia.
                </p>
              </div>
            ) : invoice?.status === 'PENDING' || invoice?.status === 'SUBMITTING' ? (
              <p className="text-muted-foreground">Factus está procesando la factura…</p>
            ) : (
              <p className="text-muted-foreground">
                La orden ya está cobrada y lista para facturación electrónica.
              </p>
            )}

            {canIssue && missing.length === 0 && missingConfiguration.length === 0 ? (
              <Button
                className="w-full"
                loading={
                  issueInvoice.isPending ||
                  invoice?.status === 'PENDING' ||
                  invoice?.status === 'SUBMITTING'
                }
                onClick={() => issueInvoice.mutate(orderId)}
              >
                {invoice?.status === 'FAILED' ? 'Reintentar factura' : 'Emitir factura electrónica'}
              </Button>
            ) : !canIssue ? (
              <p className="text-xs text-muted-foreground">
                Solo un administrador o cajero puede emitirla.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function missingFiscalFields(customer: Customer): string[] {
  const fields: Array<[string, string | null]> = [
    ['nombres', customer.firstName],
    ['tipo de documento', customer.identificationDocumentCode],
    ['número de documento', customer.identification],
    ['correo', customer.email],
    ['teléfono', customer.phone],
  ];
  return fields.filter(([, value]) => !value?.trim()).map(([label]) => label);
}

/** Galería + carga de evidencias por etapa. */
function EvidenceSection({
  order,
  stage,
  items,
  editable,
}: {
  order: Order;
  stage: EvidenceStage;
  items: Order['evidences'];
  editable: boolean;
}) {
  const addEvidences = useAddEvidences();
  const removeEvidence = useRemoveEvidence();
  const [drafts, setDrafts] = React.useState<DraftEvidence[]>([]);

  const onSave = async () => {
    if (drafts.length === 0) return;
    await addEvidences.mutateAsync({
      id: order.id,
      stage,
      items: drafts.map((draft) => ({
        url: draft.url,
        path: draft.path,
        damageType: draft.damageType,
        note: draft.note || null,
      })),
    });
    setDrafts([]);
  };

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((evidence) => (
            <li key={evidence.id} className="group relative">
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-border"
              >
                <span className="relative block aspect-square bg-muted">
                  <img
                    src={evidence.url}
                    alt={evidence.note ?? DAMAGE_TYPE_META[evidence.damageType].label}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </span>
              </a>

              {evidence.damageType !== 'NONE' ? (
                <Badge variant="warning" className="absolute left-1.5 top-1.5 text-[10px]">
                  {DAMAGE_TYPE_META[evidence.damageType].label}
                </Badge>
              ) : null}

              {editable ? (
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="absolute right-1.5 top-1.5 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    void removeEvidence.mutateAsync({ id: order.id, evidenceId: evidence.id })
                  }
                  aria-label="Eliminar evidencia"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}

              {evidence.note ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{evidence.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {editable ? (
        <>
          <EvidenceUploader stage={stage} items={drafts} onChange={setDrafts} compact />
          {drafts.length > 0 ? (
            <Button className="w-full" loading={addEvidences.isPending} onClick={() => void onSave()}>
              Guardar {drafts.length} evidencia{drafts.length === 1 ? '' : 's'}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Observaciones con guardado explícito. */
function NotesEditor({ order, editable }: { order: Order; editable: boolean }) {
  const updateOrder = useUpdateOrder();
  const [value, setValue] = React.useState(order.notes ?? '');

  React.useEffect(() => setValue(order.notes ?? ''), [order.notes]);

  const dirty = value !== (order.notes ?? '');

  return (
    <div className="space-y-2">
      <Label htmlFor="order-observations">Observaciones</Label>
      <Textarea
        id="order-observations"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={!editable}
        placeholder="Indicaciones, detalles a cuidar..."
        className="min-h-[70px]"
      />
      {dirty && editable ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            loading={updateOrder.isPending}
            onClick={() => void updateOrder.mutateAsync({ id: order.id, notes: value.trim() || null })}
          >
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setValue(order.notes ?? '')}>
            Descartar
          </Button>
        </div>
      ) : null}
    </div>
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
