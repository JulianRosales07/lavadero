'use client';

import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Banknote,
  CalendarRange,
  Car,
  CircleDollarSign,
  Clock,
  HandCoins,
  Hourglass,
  PackageCheck,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboard } from '@/hooks/use-reports';
import { VEHICLE_TYPE_META } from '@/lib/constants';
import { formatMinutes, formatSmart, money } from '@/lib/format';
import { cn, fullName, initials } from '@/lib/utils';

import { useAuth } from '@/components/auth-provider';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const kpis = data?.kpis as (typeof data & { kpis: Record<string, number> })['kpis'];

  return (
    <>
      <PageHeader
        title={isOperator ? 'Mi Dashboard' : 'Dashboard'}
        description={
          isOperator
            ? 'Tus órdenes asignadas, servicios realizados y comisiones del día.'
            : 'Resumen de la operación de hoy en tiempo real.'
        }
        actions={
          isOperator ? (
            <Button variant="outline" asChild>
              <Link to="/reportes">
                <BarChart3 />
                Mis Ganancias
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/clientes?nuevo=1">
                  <UserPlus />
                  Nuevo cliente
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ordenes?status=READY">
                  <Banknote />
                  Cobrar
                </Link>
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link to="/reportes">
                  <BarChart3 />
                  Reportes
                </Link>
              </Button>
              <Button className="hidden sm:inline-flex" asChild>
                <Link to="/ordenes/nueva">
                  <Plus />
                  Nueva orden
                </Link>
              </Button>
            </>
          )
        }
      />

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="p-0">
            <ErrorState error={error} onRetry={() => void refetch()} />
          </CardContent>
        </Card>
      ) : null}

      {/* Estado de la operación */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isOperator ? 'Mis órdenes en espera' : 'Vehículos en espera'}
          value={kpis?.waiting ?? 0}
          icon={Hourglass}
          tone="amber"
          loading={isLoading}
          hint="Órdenes pendientes de iniciar"
          onClick={() => navigate('/ordenes?status=PENDING')}
        />
        <StatCard
          label={isOperator ? 'Mis órdenes en proceso' : 'Vehículos en proceso'}
          value={kpis?.inProgress ?? 0}
          icon={Car}
          tone="sky"
          loading={isLoading}
          hint="Servicio en ejecución"
          onClick={() => navigate('/ordenes?status=IN_PROGRESS')}
        />
        <StatCard
          label={isOperator ? 'Listas para entregar' : 'Listos para entregar'}
          value={kpis?.ready ?? 0}
          icon={PackageCheck}
          tone="violet"
          loading={isLoading}
          hint="Esperan cobro y entrega"
          onClick={() => navigate('/ordenes?status=READY')}
        />
        <StatCard
          label={isOperator ? 'Mis servicios hoy' : 'Finalizados hoy'}
          value={isOperator ? (kpis?.servicesToday ?? 0) : (kpis?.finishedToday ?? 0)}
          icon={Sparkles}
          tone="emerald"
          loading={isLoading}
          hint={isOperator ? `${kpis?.finishedToday ?? 0} órdenes finalizadas` : `${kpis?.servicesToday ?? 0} servicios realizados`}
          onClick={() => navigate('/ordenes?status=FINISHED')}
        />
      </section>

      {/* Dinero y Ganancias */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isOperator ? 'Mis Ganancias hoy (50%)' : 'Ventas del día'}
          value={money(isOperator ? kpis?.earningsToday : kpis?.salesToday)}
          icon={CircleDollarSign}
          tone="primary"
          loading={isLoading}
          hint={isOperator ? 'Comisión (50%) + Propinas hoy' : 'Sin incluir propinas'}
        />
        <StatCard
          label="Propinas del día"
          value={money(kpis?.tipsToday)}
          icon={HandCoins}
          tone="amber"
          loading={isLoading}
          hint={isOperator ? 'Tus propinas recibidas hoy' : 'Para reparto al equipo'}
        />
        <StatCard
          label={isOperator ? 'Mis comisiones este mes' : 'Ingresos del mes'}
          value={money(isOperator ? kpis?.earningsMonth : kpis?.revenueMonth)}
          icon={CalendarRange}
          tone="emerald"
          loading={isLoading}
          hint="Órdenes finalizadas"
        />
        {isOperator ? (
          <StatCard
            label="Servicios completados hoy"
            value={kpis?.servicesToday ?? 0}
            icon={Sparkles}
            loading={isLoading}
            hint="Total ítems de servicio procesados"
            onClick={() => navigate('/reportes')}
          />
        ) : (
          <StatCard
            label="Clientes registrados"
            value={kpis?.customersTotal ?? 0}
            icon={Users}
            loading={isLoading}
            hint={`${kpis?.customersToday ?? 0} nuevos hoy`}
            onClick={() => navigate('/clientes')}
          />
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Estado de cada vehículo */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Estado de cada vehículo</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ordenes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : (data?.activeVehicles.length ?? 0) === 0 ? (
              <EmptyState
                icon={Car}
                title="No hay vehículos en el lavadero"
                description="Cuando registres una orden aparecerá aquí con su tiempo de espera."
                action={
                  <Button asChild size="sm">
                    <Link to="/ordenes/nueva">
                      <Plus />
                      Crear orden
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2.5">
                {data?.activeVehicles.map((vehicle) => {
                  const late = vehicle.elapsedMin > vehicle.estimatedMin && vehicle.estimatedMin > 0;
                  return (
                    <li key={vehicle.id}>
                      <Link
                        to={`/ordenes/${vehicle.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/60"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-lg">
                          {VEHICLE_TYPE_META[vehicle.vehicleType].icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold tracking-tight">{vehicle.plate}</span>
                            <StatusBadge status={vehicle.status} />
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Vehículo'} ·{' '}
                            {fullName(vehicle.firstName, vehicle.lastName)}
                            {vehicle.employeeName ? ` · ${vehicle.employeeName}` : ''}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              'flex items-center justify-end gap-1 text-sm font-medium tabular-nums',
                              late && 'text-destructive',
                            )}
                          >
                            <Clock className="size-3.5" aria-hidden />
                            {formatMinutes(vehicle.elapsedMin)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            est. {formatMinutes(vehicle.estimatedMin)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Empleados trabajando */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Empleados trabajando</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/empleados">Equipo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : (data?.workingEmployees.length ?? 0) === 0 ? (
              <EmptyState
                icon={Users}
                title="Sin empleados registrados"
                description="Registra a tu equipo para asignar responsables a cada orden."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/empleados">Registrar empleado</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {data?.workingEmployees.map((employee) => (
                  <li
                    key={employee.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(employee.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-medium">
                        {employee.activeOrders > 0 ? (
                          <span className="text-sky-600 dark:text-sky-400">
                            {employee.activeOrders} activa{employee.activeOrders === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Disponible</span>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {employee.finishedToday} hoy · {money(employee.tipsToday)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas órdenes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Últimas órdenes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ordenes">Ver historial</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="space-y-2 px-5 pb-5">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (data?.latestOrders.length ?? 0) === 0 ? (
            <EmptyState
              icon={Car}
              title="Todavía no hay órdenes"
              description="Crea la primera orden para empezar a registrar la operación."
              action={
                <Button asChild size="sm">
                  <Link to="/ordenes/nueva">
                    <Plus />
                    Nueva orden
                  </Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Servicios</TableHead>
                  <TableHead className="hidden lg:table-cell">Empleado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.latestOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/ordenes/${order.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{order.plate}</p>
                      <p className="font-mono text-xs text-muted-foreground">{order.number}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{fullName(order.firstName, order.lastName)}</p>
                      <p className="text-xs text-muted-foreground">{formatSmart(order.createdAt)}</p>
                    </TableCell>
                    <TableCell className="hidden max-w-[18rem] md:table-cell">
                      <p className="truncate text-sm text-muted-foreground">
                        {order.services ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {order.employeeName ?? 'Sin asignar'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium tabular-nums">{money(order.total)}</p>
                      {order.tip > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          propina {money(order.tip)}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
