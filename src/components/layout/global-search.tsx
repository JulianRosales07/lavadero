'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Car, Loader2, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { StatusBadge } from '@/components/shared/status-badge';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { Customer, OrderListItem, Paginated } from '@/lib/types';
import { fullName } from '@/lib/utils';

/** Buscador global del header: encuentra órdenes por número/placa y clientes. */
export function GlobalSearch() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [term, setTerm] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  // Atajo de teclado: Ctrl/Cmd + K
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const enabled = debounced.length >= 2;

  const orders = useQuery({
    queryKey: ['search', 'orders', debounced],
    queryFn: () =>
      api.get<Paginated<OrderListItem>>('/api/orders', {
        q: debounced,
        preset: 'all',
        pageSize: 5,
      }),
    enabled,
  });

  const customers = useQuery({
    queryKey: ['search', 'customers', debounced],
    queryFn: () => api.get<Customer[]>('/api/customers/search', { q: debounced }),
    enabled,
  });

  const loading = orders.isFetching || customers.isFetching;
  const orderResults = orders.data?.data ?? [];
  const customerResults = (customers.data ?? []).slice(0, 5);
  const hasResults = orderResults.length > 0 || customerResults.length > 0;

  const go = (href: string) => {
    setOpen(false);
    setTerm('');
    router.push(href);
  };

  return (
    <Popover open={open && enabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar orden, placa o cliente..."
            className="h-10 pl-9 pr-16"
            aria-label="Buscador global"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            Ctrl K
          </kbd>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[min(28rem,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {loading && !hasResults ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Buscando...
          </div>
        ) : !hasResults ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin resultados para «{debounced}»
          </p>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto py-2">
            {orderResults.length > 0 && (
              <section>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Órdenes
                </p>
                {orderResults.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => go(`/ordenes/${order.id}`)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
                      <Car className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{order.plate}</span>
                        <StatusBadge status={order.status} short />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {order.number} · {fullName(order.firstName, order.lastName)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {money(order.total)}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {customerResults.length > 0 && (
              <section>
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Clientes
                </p>
                {customerResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => go(`/clientes?id=${customer.id}`)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
                      <User className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {fullName(customer.firstName, customer.lastName)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {customer.phone ?? 'Sin teléfono'} ·{' '}
                        {customer.vehicles?.map((v) => v.plate).join(', ') || 'Sin vehículos'}
                      </span>
                    </span>
                  </button>
                ))}
              </section>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
