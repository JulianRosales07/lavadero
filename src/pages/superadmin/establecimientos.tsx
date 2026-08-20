import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  UserPlus,
  Phone,
  MapPin,
  Mail,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  useEstablishments,
  useCreateEstablishment,
  useUpdateEstablishment,
  useEstablishmentAdmins,
  useCreateEstablishmentAdmin,
} from '@/hooks/use-superadmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateEstablishmentInput, Establishment } from '@/lib/types';

export default function EstablecimientosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingEstablishment, setEditingEstablishment] = React.useState<Establishment | null>(null);
  const [managingAdminsEst, setManagingAdminsEst] = React.useState<Establishment | null>(null);
  const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);

  // Queries & Mutations
  const { data: establishments, isLoading } = useEstablishments({
    q: searchQuery || undefined,
    status: statusFilter,
  });

  const createEstMutation = useCreateEstablishment();
  const updateEstMutation = useUpdateEstablishment();
  const { data: admins, isLoading: isLoadingAdmins } = useEstablishmentAdmins(managingAdminsEst?.id);
  const createAdminMutation = useCreateEstablishmentAdmin();

  // Abrir modal si viene query param ?action=create
  React.useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Form states para Crear
  const [newEst, setNewEst] = React.useState<CreateEstablishmentInput>({
    name: '',
    legalName: '',
    taxId: '',
    phone: '',
    address: '',
    contactName: '',
    contactEmail: '',
    currency: 'COP',
    currencySign: '$',
    ticketWidth: '80mm',
    active: true,
    admin: {
      name: '',
      email: '',
      password: '',
    },
  });
  const [includeAdmin, setIncludeAdmin] = React.useState(true);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Form states para Nuevo Admin en sede existente
  const [newAdminData, setNewAdminData] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
  });
  const [adminError, setAdminError] = React.useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newEst.name.trim()) {
      setCreateError('Ingresa el nombre del establecimiento');
      return;
    }

    if (includeAdmin) {
      if (!newEst.admin?.name || !newEst.admin?.email || !newEst.admin?.password) {
        setCreateError('Completa todos los campos del administrador inicial');
        return;
      }
      if (newEst.admin.password.length < 6) {
        setCreateError('La contraseña del administrador debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      const payload: CreateEstablishmentInput = {
        ...newEst,
        admin: includeAdmin ? newEst.admin : undefined,
      };

      await createEstMutation.mutateAsync(payload);
      setIsCreateOpen(false);
      // Reset form
      setNewEst({
        name: '',
        legalName: '',
        taxId: '',
        phone: '',
        address: '',
        contactName: '',
        contactEmail: '',
        currency: 'COP',
        currencySign: '$',
        ticketWidth: '80mm',
        active: true,
        admin: { name: '', email: '', password: '' },
      });
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear el establecimiento');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEstablishment) return;

    try {
      await updateEstMutation.mutateAsync({
        id: editingEstablishment.id,
        data: {
          name: editingEstablishment.name,
          legalName: editingEstablishment.legalName,
          taxId: editingEstablishment.taxId,
          phone: editingEstablishment.phone,
          address: editingEstablishment.address,
          contactName: editingEstablishment.contactName,
          contactEmail: editingEstablishment.contactEmail,
          currency: editingEstablishment.currency,
          currencySign: editingEstablishment.currencySign,
          ticketWidth: editingEstablishment.ticketWidth,
          active: editingEstablishment.active,
        },
      });
      setEditingEstablishment(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el establecimiento');
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!managingAdminsEst) return;

    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      setAdminError('Todos los campos son requeridos');
      return;
    }

    try {
      await createAdminMutation.mutateAsync({
        businessId: managingAdminsEst.id,
        data: newAdminData,
      });
      setIsAddAdminOpen(false);
      setNewAdminData({ name: '', email: '', password: '', role: 'ADMIN' });
    } catch (err: any) {
      setAdminError(err.message || 'Error al crear el administrador');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Establecimientos y Lavaderos
          </h1>
          <p className="text-sm text-slate-400">
            Crea, administra y asigna administradores a cada sede de lavadero.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25"
        >
          <Plus className="mr-2 size-4" />
          Crear Establecimiento
        </Button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, teléfono o NIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val: any) => setStatusFilter(val)}
        >
          <SelectTrigger className="w-full sm:w-44 bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Solo Activos</SelectItem>
            <SelectItem value="inactive">Solo Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Establecimientos */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-56 animate-pulse border-slate-800 bg-slate-900/60" />
          ))}
        </div>
      ) : establishments?.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-800 text-slate-400">
            <Building2 className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            No se encontraron establecimientos
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Intenta con otro término de búsqueda o crea uno nuevo.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500"
          >
            <Plus className="mr-2 size-4" />
            Crear Establecimiento
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {establishments?.map((est) => (
            <Card
              key={est.id}
              className="flex flex-col justify-between border-slate-800 bg-slate-900/60 backdrop-blur transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-white leading-tight">
                      {est.name}
                    </CardTitle>
                    {est.legalName && (
                      <p className="text-xs text-slate-400 truncate">{est.legalName}</p>
                    )}
                  </div>
                  {est.active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pb-4 text-xs text-slate-300">
                <div className="space-y-1.5">
                  {est.address && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="size-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{est.address}</span>
                    </div>
                  )}
                  {est.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="size-3.5 shrink-0 text-slate-500" />
                      <span>{est.phone}</span>
                    </div>
                  )}
                  {est.contactEmail && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="size-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{est.contactEmail}</span>
                    </div>
                  )}
                </div>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 p-2.5 text-center ring-1 ring-slate-800">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Admins</p>
                    <p className="text-sm font-bold text-white">{est.usersCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Personal</p>
                    <p className="text-sm font-bold text-white">{est.employeesCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Órdenes</p>
                    <p className="text-sm font-bold text-indigo-300">{est.ordersCount}</p>
                  </div>
                </div>
              </CardContent>

              {/* Botones de acción */}
              <div className="flex items-center gap-2 border-t border-slate-800/80 p-3 bg-slate-950/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-800 bg-slate-800/60 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                  onClick={() => setManagingAdminsEst(est)}
                >
                  <ShieldCheck className="mr-1.5 size-3.5 text-indigo-400" />
                  Admins ({est.usersCount})
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-slate-400 hover:bg-slate-800 hover:text-white"
                  onClick={() => setEditingEstablishment(est)}
                  title="Editar datos"
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal: CREAR ESTABLECIMIENTO + ADMINISTRADOR                       */}
      {/* ================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-slate-900 border-slate-800 text-white">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-white">
                <Building2 className="size-5 text-indigo-400" />
                Nuevo Establecimiento
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Registra la sede del lavadero y crea a su administrador principal en un solo paso.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
                {createError}
              </div>
            )}

            <div className="space-y-6 py-4">
              {/* Sección 1: Datos del Lavadero */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  1. Información del Lavadero
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs text-slate-300">
                      Nombre Comercial del Establecimiento *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej. AutoLavado Express Norte"
                      value={newEst.name}
                      onChange={(e) => setNewEst({ ...newEst, name: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="legalName" className="text-xs text-slate-300">
                      Razón Social (Opcional)
                    </Label>
                    <Input
                      id="legalName"
                      placeholder="Ej. Inversiones AutoClean S.A.S."
                      value={newEst.legalName ?? ''}
                      onChange={(e) => setNewEst({ ...newEst, legalName: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="taxId" className="text-xs text-slate-300">
                      NIT / Identificación Fiscal
                    </Label>
                    <Input
                      id="taxId"
                      placeholder="900.123.456-7"
                      value={newEst.taxId ?? ''}
                      onChange={(e) => setNewEst({ ...newEst, taxId: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs text-slate-300">
                      Teléfono de Contacto
                    </Label>
                    <Input
                      id="phone"
                      placeholder="300 123 4567"
                      value={newEst.phone ?? ''}
                      onChange={(e) => setNewEst({ ...newEst, phone: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs text-slate-300">
                      Dirección Física
                    </Label>
                    <Input
                      id="address"
                      placeholder="Calle 10 # 45-20"
                      value={newEst.address ?? ''}
                      onChange={(e) => setNewEst({ ...newEst, address: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      2. Administrador Principal de la Sede
                    </h4>
                    <p className="text-xs text-slate-400">
                      Usuario con rol ADMIN que gestionará esta sede.
                    </p>
                  </div>
                  <Switch
                    checked={includeAdmin}
                    onCheckedChange={setIncludeAdmin}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                </div>

                {includeAdmin && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300">
                        Nombre Completo del Administrador *
                      </Label>
                      <Input
                        placeholder="Ej. Carlos Mendoza"
                        value={newEst.admin?.name ?? ''}
                        onChange={(e) =>
                          setNewEst({
                            ...newEst,
                            admin: { ...newEst.admin!, name: e.target.value },
                          })
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                        required={includeAdmin}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">
                        Correo Electrónico (Login) *
                      </Label>
                      <Input
                        type="email"
                        placeholder="carlos@lavaderoexpress.com"
                        value={newEst.admin?.email ?? ''}
                        onChange={(e) =>
                          setNewEst({
                            ...newEst,
                            admin: { ...newEst.admin!, email: e.target.value },
                          })
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                        required={includeAdmin}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">
                        Contraseña de Acceso *
                      </Label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newEst.admin?.password ?? ''}
                        onChange={(e) =>
                          setNewEst({
                            ...newEst,
                            admin: { ...newEst.admin!, password: e.target.value },
                          })
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                        required={includeAdmin}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createEstMutation.isPending}
                className="bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
              >
                {createEstMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creando establecimiento...
                  </>
                ) : (
                  'Crear Establecimiento'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Modal: EDITAR ESTABLECIMIENTO                                     */}
      {/* ================================================================= */}
      {editingEstablishment && (
        <Dialog open={Boolean(editingEstablishment)} onOpenChange={(open) => !open && setEditingEstablishment(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-slate-900 border-slate-800 text-white">
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle className="text-xl text-white">
                  Editar Establecimiento
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Modifica los datos generales y el estado de operación de la sede.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Switch Estado Activo / Inactivo */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-white">Estado de la Sede</p>
                    <p className="text-xs text-slate-400">
                      {editingEstablishment.active
                        ? 'Establecimiento activo y habilitado para operar'
                        : 'Establecimiento suspendido (usuarios no podrán iniciar sesión)'}
                    </p>
                  </div>
                  <Switch
                    checked={editingEstablishment.active}
                    onCheckedChange={(val) =>
                      setEditingEstablishment({ ...editingEstablishment, active: val })
                    }
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Nombre Comercial</Label>
                  <Input
                    value={editingEstablishment.name}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, name: e.target.value })
                    }
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Razón Social</Label>
                    <Input
                      value={editingEstablishment.legalName ?? ''}
                      onChange={(e) =>
                        setEditingEstablishment({ ...editingEstablishment, legalName: e.target.value })
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">NIT / Identificación</Label>
                    <Input
                      value={editingEstablishment.taxId ?? ''}
                      onChange={(e) =>
                        setEditingEstablishment({ ...editingEstablishment, taxId: e.target.value })
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Teléfono</Label>
                    <Input
                      value={editingEstablishment.phone ?? ''}
                      onChange={(e) =>
                        setEditingEstablishment({ ...editingEstablishment, phone: e.target.value })
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Dirección</Label>
                    <Input
                      value={editingEstablishment.address ?? ''}
                      onChange={(e) =>
                        setEditingEstablishment({ ...editingEstablishment, address: e.target.value })
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingEstablishment(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateEstMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  {updateEstMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ================================================================= */}
      {/* Modal: GESTIONAR ADMINISTRADORES DE SEDE                           */}
      {/* ================================================================= */}
      {managingAdminsEst && (
        <Dialog
          open={Boolean(managingAdminsEst)}
          onOpenChange={(open) => {
            if (!open) {
              setManagingAdminsEst(null);
              setIsAddAdminOpen(false);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <div>
                  <DialogTitle className="text-xl text-white">
                    Administradores de Sede
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Establecimiento: <strong className="text-white">{managingAdminsEst.name}</strong>
                  </DialogDescription>
                </div>
                {!isAddAdminOpen && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddAdminOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <UserPlus className="mr-1.5 size-3.5" />
                    Nuevo Admin
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Formulario para agregar nuevo Admin */}
              {isAddAdminOpen ? (
                <form
                  onSubmit={handleAddAdminSubmit}
                  className="rounded-xl border border-indigo-500/30 bg-slate-950 p-4 space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Crear Nuevo Administrador
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddAdminOpen(false)}
                      className="text-xs text-slate-400"
                    >
                      Cancelar
                    </Button>
                  </div>

                  {adminError && (
                    <div className="rounded bg-rose-500/10 p-2 text-xs text-rose-400 border border-rose-500/20">
                      {adminError}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs text-slate-300">Nombre Completo</Label>
                      <Input
                        placeholder="Nombre y Apellidos"
                        value={newAdminData.name}
                        onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newAdminData.email}
                        onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Contraseña</Label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newAdminData.password}
                        onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-white"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createAdminMutation.isPending}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {createAdminMutation.isPending ? 'Creando...' : 'Guardar y Asignar'}
                  </Button>
                </form>
              ) : null}

              {/* Listado de administradores y usuarios */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Usuarios Vinculados a esta Sede
                </h4>

                {isLoadingAdmins ? (
                  <div className="space-y-2">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-950" />
                    ))}
                  </div>
                ) : admins?.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                    No hay administradores registrados para esta sede.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950">
                    {admins?.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-semibold">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{admin.name}</p>
                            <p className="text-slate-400">{admin.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              admin.role === 'ADMIN'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }
                          >
                            {admin.role}
                          </Badge>
                          {admin.active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setManagingAdminsEst(null)}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
