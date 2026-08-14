'use client';

import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, ClipboardList, Clock, Plus, Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { RangeFilter, type RangeValue } from '@/components/shared/range-filter';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders } from '@/hooks/use-orders';
import { ORDER_STATUS_META, VEHICLE_TYPE_META } from '@/lib/constants';
import { formatMinutes, formatSmart, money } from '@/lib/format';
import { fullName } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'PENDING', label: ORDER_STATUS_META.PENDING.label },
  { value: 'IN_PROGRESS', label: ORDER_STATUS_META.IN_PROGRESS.label },
  { value: 'READY', label: 'Listas' },
  { value: 'FINISHED', label: ORDER_STATUS_META.FINISHED.label },
  { value: 'CANCELLED', label: ORDER_STATUS_META.CANCELLED.label },
  { value: 'ALL', label: 'Todas' },
];

/** Traduce la pestaña activa al parámetro `status` del backend. */
const statusParam = (tab: string) =>
  tab === 'ACTIVE' ? 'PENDING,IN_PROGRESS,READY' : tab === 'ALL' ? undefined : tab;

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('status') ?? 'ACTIVE';
  const query = searchParams.get('q') ?? '';

  const [term, setTerm] = React.useState(query);
  const [range, setRange] = React.useState<RangeValue>({ preset: 'today' });
  const [page, setPage] = React.useState(1);

  // Si el usuario escribe una búsqueda, desactivamos el filtro de fecha
  const searching = term.trim().length >= 2;

  const { data, isLoading, isError, error, refetch } = useOrders({
    status: statusParam(tab),
    q: query || undefined,
    preset: searching ? 'all' : range.preset,
    from: range.preset === 'custom' ? range.from : undefined,
    to: range.preset === 'custom' ? range.to : undefined,
    page,
    pageSize: 25,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (term.trim()) params.set('q', term.trim());
      else params.delete('q');
      setSearchParams(params);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, searchParams, setSearchParams]);

  const orders = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)));

  return (
    <>
      <PageHeader
        title="Órdenes"
        description="Historial y seguimiento de todas las órdenes de servicio."
        actions={
          user?.role === 'ADMIN' ? (
            <Button className="hidden sm:inline-flex" onClick={() => navigate('/ordenes/nueva')}>
              <Plus />
              Nueva orden
            </Button>
          ) : null
        }
      />

      <Card className="max-w-full overflow-hidden">
        <CardContent className="flex flex-col gap-3.5 p-3.5 sm:p-4">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              params.set('status', value);
              setSearchParams(params);
              setPage(1);
            }}
            className="w-full max-w-full"
          >
            <div className="w-full max-w-full overflow-x-auto no-scrollbar pb-1">
              <TabsList className="inline-flex w-max h-9 sm:h-10 justify-start gap-1 p-1">
                {STATUS_TABS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1.5"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full min-w-0">
            <div className="relative w-full lg:max-w-sm min-w-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar por número, placa o cliente..."
                className="pl-9 w-full"
                aria-label="Buscar órdenes"
              />
            </div>

            {!searching ? (
              <div className="w-full sm:w-auto min-w-0">
                <RangeFilter
                  value={range}
                  onChange={(value) => {
                    setRange(value);
                    setPage(1);
                  }}
                />
              </div>
            ) : (
              <Badge variant="muted" className="w-fit">Buscando en todo el historial</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totales del filtro */}
      {!isLoading && orders.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">{data?.total}</strong> órdenes
          </span>
          <span>
            Suma:{' '}
            <strong className="font-semibold text-foreground tabular-nums">
              {money(data?.totalAmount)}
            </strong>
          </span>
        </div>
      ) : null}

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin órdenes para este filtro"
              description="Cambia el estado o el rango de fechas, o crea una nueva orden."
              action={
                user?.role === 'ADMIN' ? (
                  <Button size="sm" onClick={() => navigate('/ordenes/nueva')}>
                    <Plus />
                    Nueva orden
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Móvil: tarjetas en vez de tabla */}
              <ul className="divide-y divide-border/60 md:hidden">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/ordenes/${order.id}`}
                      className="flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-accent/60"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-lg">
                        {VEHICLE_TYPE_META[order.vehicleType].icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold tracking-tight">
                            {order.plate}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {money(order.total)}
                          </span>
                        </div>

                        <p className="truncate text-[13px] text-muted-foreground">
                          {fullName(order.firstName, order.lastName)}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {order.items.map((item) => item.name).join(', ')}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={order.status} />
                          <span className="text-[11px] text-muted-foreground">
                            {formatSmart(order.checkInAt)}
                          </span>
                          {order.tip > 0 ? (
                            <span className="text-[11px] text-muted-foreground">
                              propina {money(order.tip)}
                            </span>
                          ) : null}
                        </div>

                        {order.status === 'READY' || order.status === 'IN_PROGRESS' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2.5 w-full"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              navigate(`/ordenes/${order.id}?cobrar=1`);
                            }}
                          >
                            <Banknote />
                            Cobrar {money(order.total)}
                          </Button>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Servicios</TableHead>
                      <TableHead className="hidden xl:table-cell">Empleado</TableHead>
                      <TableHead className="hidden sm:table-cell">Ingreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[110px]" />
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const services = order.items.map((item) =>
                    item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name,
                  );

                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/ordenes/${order.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-base">
                            {VEHICLE_TYPE_META[order.vehicleType].icon}
                          </span>
                          <div>
                            <p className="font-semibold tracking-tight">{order.plate}</p>
                            <p className="font-mono text-xs text-muted-foreground">{order.number}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="text-sm">{fullName(order.firstName, order.lastName)}</p>
                        <p className="text-xs text-muted-foreground">
                          {[order.brand, order.model].filter(Boolean).join(' ') || '—'}
                        </p>
                      </TableCell>

                      <TableCell className="hidden max-w-[16rem] md:table-cell">
                        <p className="truncate text-sm text-muted-foreground">
                          {services.join(', ')}
                        </p>
                        {order.estimatedMin > 0 ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" aria-hidden />
                            {formatMinutes(order.estimatedMin)}
                          </p>
                        ) : null}
                      </TableCell>

                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {order.employeeName ?? 'Sin asignar'}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatSmart(order.checkInAt)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <p className="font-medium tabular-nums">{money(order.total)}</p>
                        {order.tip > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            +{money(order.tip)} propina
                          </p>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        {order.status === 'READY' || order.status === 'IN_PROGRESS' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/ordenes/${order.id}?cobrar=1`);
                            }}
                          >
                            <Banknote />
                            Cobrar
                          </Button>
                        ) : null}
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
