'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Phone, Plus, Trash2, UserCog, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmployeeHistoryDialog } from '@/components/reports/history-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteEmployee, useEmployees, useSaveEmployee } from '@/hooks/use-catalog';
import { money } from '@/lib/format';
import type { Employee } from '@/lib/types';
import { initials } from '@/lib/utils';

export default function EmployeesPage() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees(false);
  const deleteEmployee = useDeleteEmployee();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [toDelete, setToDelete] = React.useState<Employee | null>(null);
  const [historyEmployee, setHistoryEmployee] = React.useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <PageHeader
        title="Empleados"
        description="Cada orden queda asociada al empleado que realizó el servicio."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Nuevo empleado
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (employees ?? []).length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Sin empleados registrados"
              description="Registra a tu equipo para asignar responsables, medir productividad y repartir propinas."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus />
                  Registrar empleado
                </Button>
              }
            />
          ) : (
            <>
              {/* Móvil: tarjetas */}
              <ul className="divide-y divide-border/60 md:hidden">
                {employees?.map((employee) => (
                  <li key={employee.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(employee.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{employee.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <Badge variant="muted" className="text-[11px] px-1.5 py-0">
                              {employee.position}
                            </Badge>
                            {employee.status === 'ACTIVE' ? (
                              <Badge variant="success" className="text-[11px] px-1.5 py-0">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="muted" className="text-[11px] px-1.5 py-0">
                                Inactivo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setHistoryEmployee({ id: employee.id, name: employee.name })}
                          >
                            <BarChart3 />
                            Ver historial
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(employee);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setToDelete(employee)}>
                            <Trash2 />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Órdenes activas</span>
                        <span className="font-medium text-foreground">
                          {employee.activeOrders && employee.activeOrders > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {employee.activeOrders} activa{employee.activeOrders > 1 ? 's' : ''}
                            </span>
                          ) : (
                            '0'
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block">Propinas hoy</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {money(employee.tipsToday)}
                        </span>
                      </div>
                    </div>

                    {employee.phone ? (
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <a
                          href={`tel:${employee.phone}`}
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Phone className="size-3.5" aria-hidden />
                          <span>{employee.phone}</span>
                        </a>
                        <span>{employee.finishedToday ?? 0} órdenes hoy</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-right pt-1">
                        <span>{employee.finishedToday ?? 0} órdenes hoy</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                      <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                      <TableHead className="text-center">Órdenes activas</TableHead>
                      <TableHead className="hidden lg:table-cell text-center">Hoy</TableHead>
                      <TableHead className="text-right">Propinas hoy</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees?.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials(employee.name)}
                            </span>
                            <p className="font-medium">{employee.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="muted">{employee.position}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {employee.phone ? (
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="size-3.5" aria-hidden />
                              {employee.phone}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {employee.activeOrders && employee.activeOrders > 0 ? (
                            <Badge variant="warning">{employee.activeOrders}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-center lg:table-cell">
                          <span className="text-sm tabular-nums">{employee.finishedToday ?? 0}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {money(employee.tipsToday)}
                        </TableCell>
                        <TableCell>
                          {employee.status === 'ACTIVE' ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="muted">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setHistoryEmployee({ id: employee.id, name: employee.name })}
                              >
                                <BarChart3 />
                                Ver historial
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(employee);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onClick={() => setToDelete(employee)}>
                                <Trash2 />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar empleado?"
        description="Si tiene órdenes asociadas se marcará como inactivo para conservar el historial."
        confirmLabel="Eliminar"
        destructive
        loading={deleteEmployee.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteEmployee.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />

      {historyEmployee ? (
        <EmployeeHistoryDialog
          employeeId={historyEmployee.id}
          employeeName={historyEmployee.name}
          open={Boolean(historyEmployee)}
          onOpenChange={(open) => !open && setHistoryEmployee(null)}
        />
      ) : null}
    </>
  );
}

function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}) {
  const saveEmployee = useSaveEmployee();

  const [name, setName] = React.useState('');
  const [position, setPosition] = React.useState('Lavador');
  const [phone, setPhone] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [createUser, setCreateUser] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setName(employee?.name ?? '');
    setPosition(employee?.position ?? 'Lavador');
    setPhone(employee?.phone ?? '');
    setActive((employee?.status ?? 'ACTIVE') === 'ACTIVE');
    setCreateUser(false);
    setEmail('');
    setPassword('');
  }, [open, employee]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Escribe el nombre del empleado');
      return;
    }

    if (createUser) {
      if (!email.trim() || !email.includes('@')) {
        toast.error('Ingresa un correo electrónico válido para la cuenta de usuario');
        return;
      }
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      id: employee?.id,
      name: name.trim(),
      position: position.trim() || 'Lavador',
      phone: phone.trim() || null,
      status: active ? 'ACTIVE' : 'INACTIVE',
    };

    if (createUser && email.trim() && password.length >= 6) {
      payload.userAccount = {
        email: email.trim().toLowerCase(),
        password,
      };
    }

    await saveEmployee.mutateAsync(payload as Partial<Employee> & { id?: string });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          <DialogDescription>Datos básicos del personal de tu lavadero y cuenta de acceso.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Nombre *</Label>
            <Input
              id="employee-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Luis Ramírez"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-position">Cargo</Label>
              <Input
                id="employee-position"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Lavador, Detailer, Supervisor..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Teléfono</Label>
              <Input
                id="employee-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="987 654 321"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
            <div>
              <p className="text-sm font-medium">Empleado activo</p>
              <p className="text-xs text-muted-foreground">
                Los inactivos no aparecen al asignar órdenes.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Empleado activo" />
          </div>

          {/* Cuenta de acceso para el empleado */}
          <div className="rounded-lg border border-border/70 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Crear o cambiar cuenta de acceso</p>
                <p className="text-xs text-muted-foreground">
                  Permite al empleado iniciar sesión en el sistema con rol Empleado.
                </p>
              </div>
              <Switch checked={createUser} onCheckedChange={setCreateUser} aria-label="Crear cuenta de acceso" />
            </div>

            {createUser ? (
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Correo electrónico *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="empleado@lavadero.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-password">Contraseña *</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saveEmployee.isPending}>
              {employee ? 'Guardar cambios' : 'Registrar empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
