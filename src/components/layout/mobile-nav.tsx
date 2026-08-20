'use client';

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MoreHorizontal,
  Plus,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { sectionsFor } from '@/components/layout/nav-items';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { USER_ROLE_META } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import { cn, initials } from '@/lib/utils';

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ROLE_TABS: Record<UserRole, Tab[]> = {
  SUPER_ADMIN: [],
  ADMIN: [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/ordenes', label: 'Órdenes', icon: ClipboardList },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/caja', label: 'Caja', icon: Wallet },
  ],
  CASHIER: [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/ordenes', label: 'Órdenes', icon: ClipboardList },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/caja', label: 'Caja', icon: Wallet },
  ],
  OPERATOR: [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/ordenes', label: 'Órdenes', icon: ClipboardList },
    { href: '/reportes', label: 'Ganancias', icon: BarChart3 },
    { href: '/configuracion', label: 'Mi perfil', icon: Settings },
  ],
};

/**
 * Navegación inferior tipo app nativa, adaptada dinámicamente al rol del usuario.
 * Reemplaza al sidebar por debajo de lg.
 */
export function MobileNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const role = user?.role ?? 'OPERATOR';
  const tabs = ROLE_TABS[role] ?? ROLE_TABS.OPERATOR;
  const sections = sectionsFor(user?.role);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Los destinos que no caben en la barra inferior pero a los que el rol sí tiene acceso
  const extra = sections
    .flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })))
    .filter((item) => !tabs.some((tab) => tab.href === item.href));

  const moreActive = extra.some((item) => isActive(item.href));

  return (
    <>
      {/* Botón de acción principal: solo disponible para administradores */}
      {user?.role === 'ADMIN' && (
        <Link
          to="/ordenes/nueva"
          className={cn(
            'fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lifted transition-transform active:scale-95 lg:hidden',
            pathname.startsWith('/ordenes/nueva') && 'hidden',
          )}
          aria-label="Nueva orden"
        >
          <Plus className="size-6" aria-hidden />
        </Link>
      )}

      <nav
        aria-label="Navegación principal"
        style={{ transform: 'translateZ(0)' }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className={cn('grid', extra.length > 0 ? 'grid-cols-5' : 'grid-cols-5')}>
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  to={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span className="relative">
                    <tab.icon className="size-[22px]" aria-hidden />
                    {active ? (
                      <span
                        className="absolute -top-2 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-primary"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                moreActive ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-label="Más opciones"
            >
              <span className="relative">
                <MoreHorizontal className="size-[22px]" aria-hidden />
                {moreActive ? (
                  <span
                    className="absolute -top-2 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      {/* Hoja con el resto del menú */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" hideClose className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <div className="flex items-center gap-3 pb-1">
              <Avatar className="size-11">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-sm">{initials(user?.name) || '··'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user ? USER_ROLE_META[user.role].label : ''}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-3 gap-2.5">
              {extra.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-xs font-medium transition-colors active:scale-95',
                      active
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/70 text-foreground',
                    )}
                  >
                    <item.icon className="size-6 opacity-80" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full text-destructive hover:bg-destructive/10"
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
            >
              <LogOut />
              Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
