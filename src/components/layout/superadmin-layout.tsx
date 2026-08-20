import * as React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Redirigir si no es SUPER_ADMIN
  React.useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const navItems = [
    {
      to: '/superadmin/dashboard',
      label: 'Panel Global',
      icon: LayoutDashboard,
    },
    {
      to: '/superadmin/establecimientos',
      label: 'Establecimientos',
      icon: Building2,
    },
    {
      to: '/superadmin/usuarios',
      label: 'Administradores & Usuarios',
      icon: Users,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Escritorio */}
      <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl lg:flex">
        {/* Header Marca */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white">AquaControl</span>
              <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0 text-[10px] font-semibold text-indigo-300">
                SaaS
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Panel Super Admin</p>
          </div>
        </div>

        {/* Badge Contexto Multi-tenant */}
        <div className="px-4 pt-4">
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Sparkles className="size-3.5" />
              <span>Modo Plataforma</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Gestión centralizada de lavaderos, franquicias y administradores.
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Administración Global
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Usuario */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/90 p-3 ring-1 ring-slate-800">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-medium text-slate-200">{user?.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="size-8 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex flex-1 flex-col">
        {/* Topbar Móvil */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldCheck className="size-4" />
            </div>
            <span className="font-bold text-white">Super Admin</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>

        {/* Menú Móvil desplegable */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-800 bg-slate-900 p-4 lg:hidden">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 mt-4"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Cerrar Sesión
              </Button>
            </nav>
          </div>
        )}

        {/* Vista activa */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
