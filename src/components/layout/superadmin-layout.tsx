'use client';

import * as React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronsLeft,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SIDEBAR } from '@/components/layout/nav-items';
import { cn, initials } from '@/lib/utils';

const COLLAPSED_KEY = 'lavadero.superadmin.sidebar.collapsed';

interface SuperAdminNavItem {
  to: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: { title: string; items: SuperAdminNavItem[] }[] = [
  {
    title: 'Plataforma',
    items: [
      { to: '/superadmin/dashboard', label: 'Panel Global', hint: 'Dashboard', icon: LayoutDashboard },
      { to: '/superadmin/establecimientos', label: 'Establecimientos', hint: 'Lavaderos', icon: Building2 },
    ],
  },
  {
    title: 'Usuarios',
    items: [
      { to: '/superadmin/usuarios', label: 'Administradores & Usuarios', hint: 'Usuarios', icon: Users },
    ],
  },
];

const railWidth = SIDEBAR.rail + SIDEBAR.margin * 2;
const fullWidth = SIDEBAR.margin * 2 + SIDEBAR.rail + SIDEBAR.gap + SIDEBAR.panel;

export default function SuperAdminLayout() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === '1');
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1');
      return !prev;
    });
  }, []);

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, user, navigate]);

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando panel...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ════════════════════════════════════════════════════
          ESCRITORIO: Riel de iconos + Panel etiquetado
          ════════════════════════════════════════════════════ */}
      <div className="fixed inset-y-3 left-3 z-40 hidden gap-3 lg:flex">
        {/* ── Riel de iconos ─────────────────────────────── */}
        <nav
          aria-label="Accesos directos"
          className="flex shrink-0 flex-col items-center rounded-2xl bg-sidebar py-4 shadow-lifted"
          style={{ width: SIDEBAR.rail }}
        >
          {/* Logo */}
          <Link
            to="/superadmin/dashboard"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-transparent p-1 shadow-sm transition-transform hover:scale-105"
            aria-label="Panel Global"
          >
            <img src="/DetailOps1.png" alt="DetailOps" className="size-8 object-contain rounded-lg" />
          </Link>

          {/* Secciones */}
          <div className="mt-5 flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto no-scrollbar">
            {NAV_SECTIONS.map((section, index) => (
              <div key={section.title} className="flex w-full flex-col items-center gap-1">
                {index > 0 ? <span className="my-2 h-px w-7 bg-sidebar-border" aria-hidden /> : null}
                {section.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <SimpleTooltip key={item.to} label={item.hint ?? item.label} side="right">
                      <Link
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative grid size-10 place-items-center rounded-xl transition-colors',
                          active
                            ? 'bg-primary/20 text-white'
                            : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        <item.icon className="size-[18px]" aria-hidden />
                        {active ? (
                          <span
                            className="absolute -right-[13px] h-6 w-[3px] rounded-full bg-white"
                            aria-hidden
                          />
                        ) : null}
                      </Link>
                    </SimpleTooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Expandir (solo cuando está colapsado) */}
          {collapsed ? (
            <SimpleTooltip label="Expandir navegación" side="right">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="mt-3 hidden size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:grid"
                aria-label="Expandir navegación"
              >
                <ChevronsLeft className="size-4 rotate-180" aria-hidden />
              </button>
            </SimpleTooltip>
          ) : null}

          {/* Avatar + Dropdown usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mt-4 shrink-0 rounded-full ring-2 ring-sidebar-border transition-all hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Menú de usuario"
              >
                <Avatar className="size-10">
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {initials(user?.name) || '··'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">Super Admin</p>
              </div>
              <DropdownMenuSeparator />

              {/* Toggle de tema */}
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm">Apariencia</span>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem destructive onClick={logout}>
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* ── Panel etiquetado ───────────────────────────── */}
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 ease-out',
            collapsed ? 'pointer-events-none w-0 border-0 opacity-0' : 'opacity-100',
          )}
          style={{ width: collapsed ? 0 : SIDEBAR.panel }}
          aria-hidden={collapsed}
        >
          {/* Header del panel */}
          <div className="flex items-start justify-between gap-2 px-5 pb-3 pt-5">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight tracking-tight">
                DetailOps
              </p>
              <p className="truncate text-xs text-muted-foreground">Panel Super Admin</p>
            </div>
          </div>

          {/* Navegación agrupada */}
          <nav
            aria-label="Menú Super Admin"
            className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 no-scrollbar"
          >
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {section.title}
                </p>
                <ul className="space-y-0.5 border-l border-border pl-0">
                  {section.items.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <li key={item.to} className="relative">
                        {active ? (
                          <span
                            className="absolute -left-px top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        <Link
                          to={item.to}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-sm transition-colors',
                            active
                              ? 'bg-accent font-medium text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                          )}
                        >
                          <item.icon className="size-4 shrink-0 opacity-70" aria-hidden />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Botón colapsar */}
          <div className="flex justify-center border-t border-border/70 py-3">
            <SimpleTooltip label="Colapsar navegación" side="right">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full text-primary"
                onClick={toggleCollapsed}
                aria-label="Colapsar navegación"
              >
                <ChevronsLeft />
              </Button>
            </SimpleTooltip>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MÓVIL: Barra de navegación inferior (compartida)
          ════════════════════════════════════════════════════ */}
      <MobileNav />

      {/* ════════════════════════════════════════════════════
          Contenido principal
          ════════════════════════════════════════════════════ */}
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-width)]"
        style={
          {
            '--sidebar-width': `${collapsed ? railWidth : fullWidth}px`,
          } as React.CSSProperties
        }
      >
        {/* Header escritorio con toggle de tema */}
        <header className="sticky top-0 z-30 hidden h-16 items-center border-b border-border/70 bg-background/85 px-6 backdrop-blur-md lg:flex">
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 pb-[calc(4.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:pb-10 lg:pt-6">
          <div className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-6 lg:animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
