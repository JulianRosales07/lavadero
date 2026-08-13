'use client';

import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Car,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  BarChart3,
} from 'lucide-react';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { CustomerHistoryDialog } from '@/components/reports/history-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCustomer, useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { VEHICLE_TYPE_META } from '@/lib/constants';
import { formatSmart, money } from '@/lib/format';
import type { Customer } from '@/lib/types';
import { fullName, initials } from '@/lib/utils';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [term, setTerm] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [toDelete, setToDelete] = React.useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = React.useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useCustomers({
    q: query,
    page,
    pageSize: 20,
  });
  const deleteCustomer = useDeleteCustomer();
  const editId = searchParams.get('editar');
  const { data: customerToEdit } = useCustomer(editId);

  // Abre el diálogo con ?nuevo=1 (acceso rápido desde el dashboard)
  React.useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setEditing(null);
      setDialogOpen(true);
      navigate('/clientes', { replace: true });
    }
  }, [searchParams, navigate]);

  // Permite abrir directamente los datos fiscales desde una orden.
  React.useEffect(() => {
    if (!editId || !customerToEdit) return;
    setEditing(customerToEdit);
    setDialogOpen(true);
    navigate('/clientes', { replace: true });
  }, [editId, customerToEdit, navigate]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(term.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  const customers = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Directorio de clientes y sus vehículos registrados."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <UserPlus />
            Nuevo cliente
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nombre, teléfono o placa..."
              className="pl-9"
              aria-label="Buscar clientes"
            />
          </div>
        </CardContent>
      </Card>

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
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? 'Sin resultados' : 'Aún no tienes clientes'}
              description={
                query
                  ? `No encontramos clientes que coincidan con «${query}».`
                  : 'Registra tu primer cliente con su vehículo para empezar a crear órdenes.'
              }
              action={
                query ? (
                  <Button variant="outline" size="sm" onClick={() => setTerm('')}>
                    Limpiar búsqueda
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <UserPlus />
                    Nuevo cliente
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Móvil: tarjetas */}
              <ul className="divide-y divide-border/60 md:hidden">
                {customers.map((customer) => (
                  <li key={customer.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initials(customer.firstName, customer.lastName)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {fullName(customer.firstName, customer.lastName)}
                        </p>
                        <p className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
                          {customer.phone ? (
                            <>
                              <Phone className="size-3" aria-hidden />
                              {customer.phone}
                            </>
                          ) : (
                            'Sin teléfono'
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {customer.vehicles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Sin vehículos</span>
                          ) : (
                            customer.vehicles.map((vehicle) => (
                              <Badge key={vehicle.id} variant="outline" className="font-mono">
                                <span aria-hidden>{VEHICLE_TYPE_META[vehicle.type].icon}</span>
                                {vehicle.plate}
                              </Badge>
                            ))
                          )}
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {customer.ordersCount ?? 0} órdenes · {money(customer.totalSpent)}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setHistoryCustomer({ id: customer.id, name: `${customer.firstName} ${customer.lastName}` })}
                          >
                            <BarChart3 />
                            Ver historial
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(customer);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil />
                            Editar datos
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setToDelete(customer)}>
                            <Trash2 />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2.5 w-full"
                      disabled={customer.vehicles.length === 0}
                      onClick={() => navigate(`/ordenes/nueva?clienteId=${customer.id}`)}
                    >
                      <Plus />
                      Nueva orden
                    </Button>
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículos</TableHead>
                  <TableHead className="hidden lg:table-cell">Última visita</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Órdenes</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(customer.firstName, customer.lastName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {fullName(customer.firstName, customer.lastName)}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            {customer.phone ? (
                              <>
                                <Phone className="size-3" aria-hidden />
                                {customer.phone}
                              </>
                            ) : (
                              'Sin teléfono'
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.vehicles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sin vehículos</span>
                        ) : (
                          customer.vehicles.map((vehicle) => (
                            <Badge key={vehicle.id} variant="outline" className="font-mono">
                              <span aria-hidden>{VEHICLE_TYPE_META[vehicle.type].icon}</span>
                              {vehicle.plate}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {customer.lastVisitAt ? formatSmart(customer.lastVisitAt) : 'Nunca'}
                      </span>
                    </TableCell>

                    <TableCell className="hidden text-center sm:table-cell">
                      <span className="text-sm font-medium tabular-nums">
                        {customer.ordersCount ?? 0}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-medium tabular-nums">
                        {money(customer.totalSpent)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={customer.vehicles.length === 0}
                          onClick={() => navigate(`/ordenes/nueva?clienteId=${customer.id}`)}
                        >
                          <Plus />
                          Orden
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setHistoryCustomer({ id: customer.id, name: `${customer.firstName} ${customer.lastName}` })}
                            >
                              <BarChart3 />
                              Ver historial
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(customer);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil />
                              Editar datos
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/ordenes?q=${encodeURIComponent(customer.phone ?? customer.firstName)}`}>
                                <Car />
                                Ver órdenes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem destructive onClick={() => setToDelete(customer)}>
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {data?.total} clientes
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

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
        onCreated={(customer) => {
          // Flujo rápido: tras guardar el cliente se abre la creación de la orden.
          const vehicleId = customer.vehicles?.[0]?.id;
          navigate(
            `/ordenes/nueva?clienteId=${customer.id}${vehicleId ? `&vehiculoId=${vehicleId}` : ''}`,
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar cliente?"
        description={
          !toDelete
            ? undefined
            : (toDelete.ordersCount ?? 0) > 0
              ? `Se eliminará a ${fullName(toDelete.firstName, toDelete.lastName)}, sus vehículos y sus ${toDelete.ordersCount} orden${toDelete.ordersCount === 1 ? '' : 'es'} (con pagos y evidencias). Esas ventas dejarán de aparecer en los reportes y no se puede deshacer.`
              : `Se eliminará a ${fullName(toDelete.firstName, toDelete.lastName)} y sus vehículos. Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteCustomer.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCustomer.mutateAsync({
            id: toDelete.id,
            force: (toDelete.ordersCount ?? 0) > 0,
          });
          setToDelete(null);
        }}
      />

      {historyCustomer ? (
        <CustomerHistoryDialog
          customerId={historyCustomer.id}
          customerName={historyCustomer.name}
          open={Boolean(historyCustomer)}
          onOpenChange={(open) => !open && setHistoryCustomer(null)}
        />
      ) : null}
    </>
  );
}
