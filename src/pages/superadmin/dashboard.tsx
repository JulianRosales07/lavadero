import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  ShoppingBag,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSuperAdminStats, useEstablishments } from '@/hooks/use-superadmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminDashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useSuperAdminStats();
  const { data: establishments, isLoading: isLoadingEst } = useEstablishments({ status: 'all' });

  const recentEstablishments = establishments?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 p-6 sm:p-8 backdrop-blur shadow-2xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="size-3.5" />
              <span>Centro de Control Multi-Tenant</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Panel de Super Administración
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Monitorea el rendimiento global, aprovisiona nuevas sedes de lavadero y gestiona
              las cuentas de administradores en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="bg-indigo-600 font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
            >
              <Link to="/superadmin/establecimientos?action=create">
                <Plus className="mr-2 size-4" />
                Nuevo Establecimiento
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800"
            >
              <Link to="/superadmin/establecimientos">
                Ver Todos
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Gradiente decorativo de fondo */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-40 size-48 rounded-full bg-cyan-500/10 blur-2xl" />
      </div>

      {/* Tarjetas de Métricas Globales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Establecimientos */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Establecimientos
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <div>
                <div className="text-3xl font-bold text-white">
                  {stats?.totalBusinesses ?? 0}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center text-emerald-400">
                    <CheckCircle2 className="mr-1 size-3.5" />
                    {stats?.activeBusinesses ?? 0} activos
                  </span>
                  {(stats?.inactiveBusinesses ?? 0) > 0 && (
                    <span className="flex items-center text-rose-400">
                      <XCircle className="mr-1 size-3.5" />
                      {stats?.inactiveBusinesses} inactivos
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Administradores */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Administradores de Sede
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <div>
                <div className="text-3xl font-bold text-white">
                  {stats?.totalAdmins ?? 0}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {stats?.totalUsers ?? 0} usuarios totales en la plataforma
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Órdenes Globales */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Órdenes Registradas
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <ShoppingBag className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <div>
                <div className="text-3xl font-bold text-white">
                  {stats?.totalOrders?.toLocaleString() ?? 0}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Transacciones en toda la red
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingresos Globales */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Volumen de Ventas Red
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-28 bg-slate-800" />
            ) : (
              <div>
                <div className="text-3xl font-bold text-white">
                  $ {(stats?.totalRevenue ?? 0).toLocaleString('es-CO')}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Facturación acumulada global
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de Establecimientos Recientes */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white">
              Establecimientos Registrados
            </CardTitle>
            <CardDescription className="text-slate-400">
              Últimas sedes creadas en la plataforma
            </CardDescription>
          </div>
          <Button
            asChild
            variant="ghost"
            className="text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
          >
            <Link to="/superadmin/establecimientos">
              Ver todos ({establishments?.length ?? 0})
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingEst ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : recentEstablishments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                <Building2 className="size-7" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-200">
                Aún no hay establecimientos creados
              </p>
              <p className="mt-1 text-sm text-slate-400 max-w-sm">
                Crea tu primer lavadero para habilitar su administración y asignarle su primer administrador.
              </p>
              <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-500">
                <Link to="/superadmin/establecimientos?action=create">
                  <Plus className="mr-2 size-4" />
                  Crear Primer Establecimiento
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentEstablishments.map((est) => (
                <div
                  key={est.id}
                  className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-indigo-400">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{est.name}</span>
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
                      <p className="text-xs text-slate-400">
                        {est.address || 'Sin dirección'} · {est.phone || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-slate-400">
                    <div className="text-right">
                      <p className="font-medium text-slate-200">{est.usersCount} usuarios</p>
                      <p>{est.ordersCount} órdenes</p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                    >
                      <Link to={`/superadmin/establecimientos?selected=${est.id}`}>
                        Gestionar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
