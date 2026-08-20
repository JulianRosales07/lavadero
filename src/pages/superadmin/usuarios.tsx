import * as React from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { useEstablishments, usePlatformUsers, useUpdatePlatformUser } from '@/hooks/use-superadmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PlatformUser } from '@/lib/types';

export default function SuperAdminUsuariosPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = React.useState<string>('all');

  const [passwordModalUser, setPasswordModalUser] = React.useState<PlatformUser | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const { data: establishments } = useEstablishments();
  const { data: users, isLoading } = usePlatformUsers({
    q: searchQuery || undefined,
    role: selectedRole === 'all' ? undefined : selectedRole,
    businessId: selectedBusiness === 'all' ? undefined : selectedBusiness,
  });

  const updateUserMutation = useUpdatePlatformUser();

  const handleToggleStatus = async (user: PlatformUser) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: { active: !user.active },
      });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado del usuario');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!passwordModalUser) return;

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: passwordModalUser.id,
        data: { password: newPassword },
      });
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Administradores y Usuarios de Plataforma
        </h1>
        <p className="text-sm text-slate-400">
          Vista unificada de todas las cuentas registradas en cada lavadero.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Filtrar por sede" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">Todas las Sedes</SelectItem>
            {establishments?.map((est) => (
              <SelectItem key={est.id} value={est.id}>
                {est.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">Todos los Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="ADMIN">Administrador de Sede</SelectItem>
            <SelectItem value="CASHIER">Cajero</SelectItem>
            <SelectItem value="OPERATOR">Operador / Lavador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla / Lista de Usuarios */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Listado de Cuentas ({users?.length ?? 0})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Control de accesos y restablecimiento de credenciales
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="mx-auto size-6 animate-spin" />
              <p className="mt-2 text-xs">Cargando usuarios...</p>
            </div>
          ) : users?.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="mx-auto size-8 text-slate-600" />
              <p className="mt-2 font-medium text-slate-300">No se encontraron usuarios</p>
              <p className="text-xs">Prueba ajustando los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{u.name}</span>
                        {u.role === 'SUPER_ADMIN' ? (
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                            Super Admin
                          </Badge>
                        ) : u.role === 'ADMIN' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            Admin Sede
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-400 text-[10px]">
                            {u.role}
                          </Badge>
                        )}

                        {u.active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span className="flex items-center text-slate-300 font-medium">
                          <Building2 className="mr-1 size-3 text-slate-500" />
                          {u.businessName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPasswordModalUser(u)}
                      className="border-slate-800 bg-slate-800/80 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <KeyRound className="mr-1.5 size-3.5 text-amber-400" />
                      Contraseña
                    </Button>

                    {u.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs ${
                          u.active
                            ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                            : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                        }`}
                      >
                        {u.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Cambio de Contraseña */}
      {passwordModalUser && (
        <Dialog open={Boolean(passwordModalUser)} onOpenChange={(open) => !open && setPasswordModalUser(null)}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
            <form onSubmit={handlePasswordSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-white">
                  <KeyRound className="size-4 text-amber-400" />
                  Cambiar Contraseña
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Establece una nueva contraseña para <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email}).
                </DialogDescription>
              </DialogHeader>

              {passwordError && (
                <div className="mt-3 rounded bg-rose-500/10 p-2.5 text-xs text-rose-400 border border-rose-500/20">
                  {passwordError}
                </div>
              )}

              <div className="space-y-3 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Nueva Contraseña</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPasswordModalUser(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  {updateUserMutation.isPending ? 'Guardando...' : 'Actualizar Contraseña'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
