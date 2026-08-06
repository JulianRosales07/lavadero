'use client';

import * as React from 'react';
import { Clock, Receipt, TrendingUp } from 'lucide-react';
import { RangeFilter, type RangeValue } from '@/components/shared/range-filter';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustomerOrdersReport, useEmployeeOrdersReport } from '@/hooks/use-reports';
import { VEHICLE_TYPE_META } from '@/lib/constants';
import { formatMinutes, formatSmart, money } from '@/lib/format';
import type { VehicleType } from '@/lib/types';

export function EmployeeHistoryDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
}: {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [range, setRange] = React.useState<RangeValue>({ preset: 'month' });
  const { data, isLoading } = useEmployeeOrdersReport(employeeId, range);
  const orders = data?.data ?? [];

  const totals = React.useMemo(() => {
    return {
      count: orders.length,
      services: orders.reduce((sum, o) => sum + o.servicesCount, 0),
      tips: orders.reduce((sum, o) => sum + o.tip, 0),
      sales: orders.reduce((sum, o) => sum + o.total, 0),
      avgDuration: orders.length > 0
        ? Math.round(orders.reduce((sum, o) => sum + o.durationMin, 0) / orders.length)
        : 0,
    };
  }, [orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Historial de {employeeName}</DialogTitle>
          <DialogDescription>
            Órdenes atendidas y servicios realizados en el período seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RangeFilter value={range} onChange={setRange} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Órdenes"
              value={totals.count}
              icon={Receipt}
              loading={isLoading}
            />
            <StatCard
              label="Servicios"
              value={totals.services}
              icon={TrendingUp}
              loading={isLoading}
            />
            <StatCard
              label="Propinas"
              value={money(totals.tips)}
              tone="amber"
              loading={isLoading}
            />
            <StatCard
              label="Ventas"
              value={money(totals.sales)}
              tone="emerald"
              loading={isLoading}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Sin órdenes en el período seleccionado
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead className="text-center">Servicios</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Duración</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSmart(order.finishedAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span aria-hidden className="text-lg">
                            {VEHICLE_TYPE_META[order.vehicleType as VehicleType].icon}
                          </span>
                          <span className="font-mono text-sm">{order.vehiclePlate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="muted">{order.servicesCount}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-center text-sm text-muted-foreground sm:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="size-3" />
                          {formatMinutes(order.durationMin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(order.total)}
                        {order.tip > 0 ? (
                          <span className="ml-1 text-xs text-amber-600">
                            +{money(order.tip)}
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CustomerHistoryDialog({
  customerId,
  customerName,
  open,
  onOpenChange,
}: {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [range, setRange] = React.useState<RangeValue>({ preset: 'year' });
  const { data, isLoading } = useCustomerOrdersReport(customerId, range);
  const orders = data?.data ?? [];

  const totals = React.useMemo(() => {
    return {
      count: orders.length,
      services: orders.reduce((sum, o) => sum + (o.services?.length ?? 0), 0),
      tips: orders.reduce((sum, o) => sum + o.tip, 0),
      total: orders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Historial de {customerName}</DialogTitle>
          <DialogDescription>
            Todas las órdenes y servicios realizados en el período seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RangeFilter value={range} onChange={setRange} />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Visitas"
              value={totals.count}
              icon={Receipt}
              loading={isLoading}
            />
            <StatCard
              label="Propinas"
              value={money(totals.tips)}
              tone="amber"
              loading={isLoading}
            />
            <StatCard
              label="Consumo total"
              value={money(totals.total)}
              tone="emerald"
              loading={isLoading}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Sin órdenes en el período seleccionado
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead className="hidden sm:table-cell">Atendió</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSmart(order.finishedAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span aria-hidden className="text-lg">
                            {VEHICLE_TYPE_META[order.vehicleType as VehicleType].icon}
                          </span>
                          <span className="font-mono text-sm">{order.vehiclePlate}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {order.services?.map((service, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span>{service.name}</span>
                              {service.quantity > 1 ? (
                                <span className="text-muted-foreground">×{service.quantity}</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {order.employeeName ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(order.total)}
                        {order.tip > 0 ? (
                          <span className="ml-1 text-xs text-amber-600">
                            +{money(order.tip)}
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
