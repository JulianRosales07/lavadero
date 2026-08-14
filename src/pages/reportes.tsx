'use client';

import * as React from 'react';
import {
  BarChart3,
  CircleDollarSign,
  HandCoins,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { RangeFilter, type RangeValue } from '@/components/shared/range-filter';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import {
  useCustomersReport,
  useEmployeeEarningsReport,
  useEmployeesReport,
  usePaymentMethodsReport,
  useSalesReport,
  useServicesReport,
  useTipsReport,
} from '@/hooks/use-reports';
import { PAYMENT_METHOD_META, VEHICLE_TYPE_META } from '@/lib/constants';
import { formatDate, formatMinutes, formatSmart, money, percent } from '@/lib/format';
import type { PaymentMethod, VehicleType } from '@/lib/types';
import { fullName } from '@/lib/utils';
import {
  SalesTrendChart,
  TopServicesChart,
  PaymentMethodsChart,
} from '@/components/reports/charts';

export default function ReportsPage() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';
  const [range, setRange] = React.useState<RangeValue>({ preset: 'month' });

  return (
    <>
      <PageHeader
        title={isOperator ? 'Mis Servicios y Ganancias' : 'Reportes'}
        description={
          isOperator
            ? 'Resumen de servicios realizados, propinas y comisión del 50%.'
            : 'Ventas, servicios, clientes, propinas y desempeño del equipo.'
        }
      />

      <Card>
        <CardContent className="p-4">
          <RangeFilter value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {isOperator ? (
        <EmployeeEarningsTab range={range} />
      ) : (
        <Tabs defaultValue="ventas">
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto h-auto flex-nowrap sm:flex-wrap justify-start gap-1 p-1">
              <TabsTrigger value="ventas" className="text-xs sm:text-sm">
                <CircleDollarSign className="size-4" />
                Ventas
              </TabsTrigger>
              <TabsTrigger value="servicios" className="text-xs sm:text-sm">
                <Sparkles className="size-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="clientes" className="text-xs sm:text-sm">
                <Users className="size-4" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="propinas" className="text-xs sm:text-sm">
                <HandCoins className="size-4" />
                Propinas
              </TabsTrigger>
              <TabsTrigger value="pagos" className="text-xs sm:text-sm">
                <Wallet className="size-4" />
                Métodos de pago
              </TabsTrigger>
              <TabsTrigger value="empleados" className="text-xs sm:text-sm">
                <BarChart3 className="size-4" />
                Empleados
              </TabsTrigger>
              <TabsTrigger value="comisiones" className="text-xs sm:text-sm">
                <TrendingUp className="size-4" />
                Comisiones 50%
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ventas">
            <SalesTab range={range} />
          </TabsContent>
          <TabsContent value="servicios">
            <ServicesTab range={range} />
          </TabsContent>
          <TabsContent value="clientes">
            <CustomersTab range={range} />
          </TabsContent>
          <TabsContent value="propinas">
            <TipsTab range={range} />
          </TabsContent>
          <TabsContent value="pagos">
            <PaymentsTab range={range} />
          </TabsContent>
          <TabsContent value="empleados">
            <EmployeesTab range={range} />
          </TabsContent>
          <TabsContent value="comisiones">
            <EmployeeEarningsTab range={range} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

// ---------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------

function SalesTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = useSalesReport(range);
  const summary = data?.summary;

  const chartData = (data?.byDay ?? []).map((day) => ({
    label: formatDate(day.day, 'dd MMM'),
    ventas: day.sales / 100,
    propinas: day.tips / 100,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total facturado"
          value={money(summary?.total)}
          icon={CircleDollarSign}
          tone="primary"
          loading={isLoading}
        />
        <StatCard
          label="Órdenes finalizadas"
          value={summary?.ordersCount ?? 0}
          icon={Receipt}
          loading={isLoading}
        />
        <StatCard
          label="Ticket promedio"
          value={money(summary?.averageTicket)}
          icon={TrendingUp}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          label="Descuentos aplicados"
          value={money((summary?.discountTotal ?? 0) + (summary?.promotionTotal ?? 0))}
          icon={HandCoins}
          tone="rose"
          loading={isLoading}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Evolución de ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sin ventas en el período"
              description="Cambia el rango de fechas para ver otros resultados."
            />
          ) : (
            <SalesTrendChart data={chartData} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por tipo de vehículo</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Órdenes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.byVehicleType ?? []).map((row) => (
                  <TableRow key={row.vehicleType}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{VEHICLE_TYPE_META[row.vehicleType as VehicleType].icon}</span>
                        {VEHICLE_TYPE_META[row.vehicleType as VehicleType].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{row.ordersCount}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle diario</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead className="text-center">Órdenes</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Propinas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.byDay ?? []).map((row) => (
                  <TableRow key={row.day}>
                    <TableCell>{formatDate(row.day)}</TableCell>
                    <TableCell className="text-center tabular-nums">{row.ordersCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(row.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(row.tips)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------

function ServicesTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = useServicesReport(range);
  const rows = data?.data ?? [];
  const top = rows.slice(0, 8).map((row) => ({ name: row.name, cantidad: row.quantity }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Servicios realizados"
          value={data?.totals.quantity ?? 0}
          icon={Sparkles}
          tone="primary"
          loading={isLoading}
        />
        <StatCard
          label="Facturado en servicios"
          value={money(data?.totals.total)}
          icon={CircleDollarSign}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          label="Servicio más vendido"
          value={rows[0]?.name ?? '—'}
          hint={rows[0] ? `${rows[0].quantity} veces` : undefined}
          icon={TrendingUp}
          loading={isLoading}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Servicios más vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : top.length === 0 ? (
            <EmptyState icon={Sparkles} title="Sin servicios facturados en el período" />
          ) : (
            <TopServicesChart data={top} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por servicio</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Órdenes</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Precio promedio</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden md:table-cell text-right">Participación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="hidden text-center tabular-nums sm:table-cell">
                    {row.ordersCount}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {money(row.averagePrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(row.total)}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                    {percent(row.total, data?.totals.total ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------
// Clientes frecuentes
// ---------------------------------------------------------------------

function CustomersTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = useCustomersReport(range);
  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes frecuentes</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes atendidos en el período" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="hidden md:table-cell">Última visita</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Propinas</TableHead>
                <TableHead className="text-right">Consumo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {fullName(row.firstName, row.lastName)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {row.vehiclesCount} vehículo{row.vehiclesCount === 1 ? '' : 's'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {row.phone ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="muted">{row.ordersCount}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatSmart(row.lastVisitAt)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {money(row.tips)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Propinas
// ---------------------------------------------------------------------

function TipsTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = useTipsReport(range);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Propinas del período"
          value={money(data?.total)}
          icon={HandCoins}
          tone="amber"
          loading={isLoading}
        />
        <StatCard label="Hoy" value={money(data?.periods.today)} loading={isLoading} />
        <StatCard label="Esta semana" value={money(data?.periods.week)} loading={isLoading} />
        <StatCard label="Este mes" value={money(data?.periods.month)} loading={isLoading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Propinas por empleado</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {(data?.byEmployee.length ?? 0) === 0 ? (
              <EmptyState icon={HandCoins} title="Sin propinas registradas" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead className="text-center">Órdenes</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.byEmployee.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell className="font-medium">{row.employeeName}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.ordersCount}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(row.tips)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de propinas</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {(data?.detail.length ?? 0) === 0 ? (
              <EmptyState
                icon={HandCoins}
                title="Sin propinas en el período"
                description="Las propinas se registran al momento del cobro."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Orden</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.detail.map((row) => (
                    <TableRow key={row.orderId}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatSmart(row.finishedAt)}
                      </TableCell>
                      <TableCell className="font-medium">{row.employeeName}</TableCell>
                      <TableCell>
                        {fullName(row.firstName, row.lastName)}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {row.plate}
                        </span>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {row.number}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(row.tip)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Métodos de pago
// ---------------------------------------------------------------------

function PaymentsTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = usePaymentMethodsReport(range);
  const rows = data?.data ?? [];

  const chartData = rows.map((row) => ({
    name: PAYMENT_METHOD_META[row.method as PaymentMethod].label,
    value: row.amount / 100,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribución de cobros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={Wallet} title="Sin cobros en el período" />
          ) : (
            <PaymentMethodsChart data={chartData} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por método</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead className="text-center">Cobros</TableHead>
                <TableHead className="text-right">Propinas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.method}>
                  <TableCell className="font-medium">
                    {PAYMENT_METHOD_META[row.method as PaymentMethod].label}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{row.paymentsCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(row.tips)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(row.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {percent(row.amount, data?.total ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------
// Empleados
// ---------------------------------------------------------------------

function EmployeesTab({ range }: { range: RangeValue }) {
  const { data, isLoading } = useEmployeesReport(range);
  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por empleado</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sin empleados registrados"
            description="Registra a tu equipo para medir su desempeño."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                <TableHead className="text-center">Órdenes</TableHead>
                <TableHead className="hidden md:table-cell text-center">Servicios</TableHead>
                <TableHead className="hidden lg:table-cell text-center">Tiempo prom.</TableHead>
                <TableHead className="text-right">Propinas</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name}
                    {row.status === 'INACTIVE' ? (
                      <Badge variant="muted" className="ml-2">
                        Inactivo
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {row.position}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{row.ordersCount}</TableCell>
                  <TableCell className="hidden text-center tabular-nums md:table-cell">
                    {row.servicesCount}
                  </TableCell>
                  <TableCell className="hidden text-center text-sm text-muted-foreground lg:table-cell">
                    {row.ordersCount > 0 ? formatMinutes(row.avgMinutes) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(row.tips)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(row.sales)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EmployeeEarningsTab({ range, employeeId }: { range: RangeValue; employeeId?: string }) {
  const { data, isLoading } = useEmployeeEarningsReport(range, employeeId);
  const summary = data?.summary;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Servicios realizados"
          value={summary?.servicesCount ?? 0}
          icon={Sparkles}
          tone="sky"
          loading={isLoading}
          hint={`${summary?.ordersCount ?? 0} órdenes atendidas`}
        />
        <StatCard
          label="Valor total servicios"
          value={money(summary?.servicesTotal)}
          icon={CircleDollarSign}
          tone="primary"
          loading={isLoading}
        />
        <StatCard
          label="Mi Comisión (50%)"
          value={money(summary?.commissionTotal)}
          icon={TrendingUp}
          tone="emerald"
          loading={isLoading}
          hint="50% del valor de cada servicio"
        />
        <StatCard
          label="Total a cobrar"
          value={money(summary?.payoutTotal)}
          icon={HandCoins}
          tone="amber"
          loading={isLoading}
          hint={`Comisión (${money(summary?.commissionTotal)}) + Propinas (${money(summary?.tipsTotal)})`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Desglose de servicios y comisiones (50%)</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="space-y-2 px-5 pb-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sin servicios en el período seleccionado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio Servicio</TableHead>
                  <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    Mi Comisión (50%)
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground">Empresa (50%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatSmart(item.finishedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{item.orderNumber}</TableCell>
                    <TableCell className="font-semibold">{item.vehiclePlate}</TableCell>
                    <TableCell className="font-medium">{item.serviceName}</TableCell>
                    <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(item.totalPrice)}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {money(item.commission)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {money(item.companyShare)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
