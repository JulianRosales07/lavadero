'use client';

import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Car, Loader2, Search, ShieldCheck, User, X } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { NAV_SECTIONS } from '@/components/layout/nav-items';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { Customer, OrderListItem, Paginated } from '@/lib/types';
import { useBusiness } from '@/hooks/use-catalog';
import { fullName } from '@/lib/utils';

/** Título de la pantalla actual, para la cabecera compacta. */
function useScreenTitle() {
  const location = useLocation();
  const pathname = location.pathname;

  return React.useMemo(() => {
    if (pathname.startsWith('/ordenes/nueva')) return { title: 'Nueva orden', back: '/ordenes' };
    if (/^\/ordenes\/[^/]+$/.test(pathname)) return { title: 'Detalle de orden', back: '/ordenes' };

    const item = NAV_SECTIONS.flatMap((section) => section.items).find(
      (candidate) => pathname === candidate.href || pathname.startsWith(`${candidate.href}/`),
    );

    return { title: item?.hint ?? item?.label ?? 'DetailOps', back: null as string | null };
  }, [pathname]);
}

/**
 * Cabecera móvil: título de la pantalla, botón de volver cuando procede y
 * búsqueda a pantalla completa. Solo se muestra por debajo de lg.
 */
export function MobileTopBar() {
  const navigate = useNavigate();
  const { data: business } = useBusiness();
  const { title, back } = useScreenTitle();
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <>
      {/* Fondo opaco a propósito: backdrop-blur en una capa fija obliga al
          navegador a recomponer todo el viewport en cada scroll y navegación. */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-3 lg:hidden">
        {back ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(back)}
            aria-label="Volver"
          >
            <ArrowLeft />
          </Button>
        ) : (
          <Link
            to="/dashboard"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white p-0.5 shadow-sm"
            aria-label="Inicio"
          >
            <img src="/DetailOps.png" alt="DetailOps" className="size-7 object-contain rounded-lg" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {business?.name ?? 'DetailOps'}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
        >
          <Search />
        </Button>
        <ThemeToggle />
      </header>

      <MobileSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

/** Búsqueda a pantalla completa, pensada para el pulgar. */
function MobileSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  React.useEffect(() => {
    if (!open) setTerm('');
  }, [open]);

  const enabled = debounced.length >= 2;

  const orders = useQuery({
    queryKey: ['search', 'orders', debounced],
    queryFn: () =>
      api.get<Paginated<OrderListItem>>('/api/orders', {
        q: debounced,
        preset: 'all',
        pageSize: 8,
      }),
    enabled,
  });

  const customers = useQuery({
    queryKey: ['search', 'customers', debounced],
    queryFn: () => api.get<Customer[]>('/api/customers/search', { q: debounced }),
    enabled,
  });

  const orderResults = orders.data?.data ?? [];
  const customerResults = (customers.data ?? []).slice(0, 6);
  const loading = orders.isFetching || customers.isFetching;

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" handle={false} hideClose className="h-full rounded-none">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Orden, placa o cliente..."
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            aria-label="Buscar"
          />
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pb-8">
          {!enabled ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar.
            </p>
          ) : loading && orderResults.length === 0 && customerResults.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Buscando...
            </p>
          ) : orderResults.length === 0 && customerResults.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Sin resultados para «{debounced}»
            </p>
          ) : (
            <>
              {orderResults.length > 0 ? (
                <section className="pt-2">
                  <p className="px-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Órdenes
                  </p>
                  {orderResults.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => go(`/ordenes/${order.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-accent"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                        <Car className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{order.plate}</span>
                          <StatusBadge status={order.status} short />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {fullName(order.firstName, order.lastName)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {money(order.total)}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}

              {customerResults.length > 0 ? (
                <section className="pt-3">
                  <p className="px-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Clientes
                  </p>
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => go(`/ordenes/nueva?clienteId=${customer.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-accent"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                        <User className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {fullName(customer.firstName, customer.lastName)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.phone ?? 'Sin teléfono'} ·{' '}
                          {customer.vehicles?.map((vehicle) => vehicle.plate).join(', ') ||
                            'Sin vehículos'}
                        </span>
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>

        <SheetHeader className="sr-only">
          <SheetTitle>Buscar</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
