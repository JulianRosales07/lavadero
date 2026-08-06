'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, Droplets, LogOut, Plus, Settings, X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { SIDEBAR, sectionsFor } from '@/components/layout/nav-items';
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
import { useBusiness } from '@/hooks/use-catalog';
import { USER_ROLE_META } from '@/lib/constants';
import { cn, initials } from '@/lib/utils';

/**
 * Sidebar de dos piezas:
 *  · riel oscuro flotante con los iconos de todas las secciones
 *  · panel claro con la navegación agrupada y etiquetada
 * Al colapsar queda solo el riel, que sigue dando acceso a todo por tooltip.
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: business } = useBusiness();

  const sections = sectionsFor(user?.role);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="fixed inset-y-3 left-3 z-40 hidden gap-3 lg:flex">
        {/* ---------------------------------------------------------- */}
        {/* Riel de iconos                                             */}
        {/* ---------------------------------------------------------- */}
        <nav
          aria-label="Accesos directos"
          className="flex shrink-0 flex-col items-center rounded-2xl bg-sidebar py-4 shadow-lifted"
          style={{ width: SIDEBAR.rail }}
        >
          <Link
            href="/dashboard"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105"
            aria-label="Ir al resumen"
          >
            <Droplets className="size-5" aria-hidden />
          </Link>

          <div className="mt-5 flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto no-scrollbar">
            {sections.map((section, index) => (
              <div key={section.title} className="flex w-full flex-col items-center gap-1">
                {index > 0 ? <span className="my-2 h-px w-7 bg-sidebar-border" aria-hidden /> : null}

                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SimpleTooltip key={item.href} label={item.hint ?? item.label} side="right">
                      <Link
                        href={item.href}
                       
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative grid size-10 place-items-center rounded-xl transition-colors',
                          active
                            ? 'bg-primary/20 text-white'
                            : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        <item.icon className="size-[18px]" aria-hidden />
                        {/* Marca a la derecha del icono activo */}
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

          {/* Expandir: solo aparece cuando el panel está oculto, porque el
              botón de colapsar vive al pie del propio panel. */}
          {collapsed ? (
            <SimpleTooltip label="Expandir navegación" side="right">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="mt-3 hidden size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:grid"
                aria-label="Expandir navegación"
              >
                <ChevronsLeft className="size-4 rotate-180" aria-hidden />
              </button>
            </SimpleTooltip>
          ) : null}

          {/* Usuario */}
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
                <p className="truncate text-xs text-muted-foreground">
                  {user ? USER_ROLE_META[user.role].label : ''}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/configuracion">
                  <Settings />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem destructive onClick={logout}>
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* ---------------------------------------------------------- */}
        {/* Panel con la navegación etiquetada                          */}
        {/* ---------------------------------------------------------- */}
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 ease-out',
            collapsed ? 'pointer-events-none w-0 border-0 opacity-0 lg:w-0' : 'opacity-100',
          )}
          style={{ width: collapsed ? 0 : SIDEBAR.panel }}
          aria-hidden={collapsed}
        >
          <div className="flex items-start justify-between gap-2 px-5 pb-3 pt-5">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight tracking-tight">
                {business?.name ?? 'Mi Lavadero'}
              </p>
              <p className="truncate text-xs text-muted-foreground">Panel de control</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 lg:hidden"
             
              aria-label="Cerrar menú"
            >
              <X />
            </Button>
          </div>

          <div className="px-4 pb-4">
            <Button asChild className="w-full">
              <Link href="/ordenes/nueva">
                <Plus />
                Nueva orden
              </Link>
            </Button>
          </div>

          <nav
            aria-label="Menú principal"
            className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 no-scrollbar"
          >
            {sections.map((section) => (
              <div key={section.title}>
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {section.title}
                </p>

                {/* Guía vertical del grupo, como en el diseño de referencia */}
                <ul className="space-y-0.5 border-l border-border pl-0">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href} className="relative">
                        {active ? (
                          <span
                            className="absolute -left-px top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        <Link
                          href={item.href}
                         
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

          <div className="flex justify-center border-t border-border/70 py-3">
            <SimpleTooltip label="Colapsar navegación" side="right">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full text-primary"
                onClick={onToggleCollapsed}
                aria-label="Colapsar navegación"
              >
                <ChevronsLeft />
              </Button>
            </SimpleTooltip>
          </div>
        </div>
    </div>
  );
}
