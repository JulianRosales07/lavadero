'use client';

import * as React from 'react';
import { Clock, Minus, Plus, Search, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices } from '@/hooks/use-catalog';
import { formatMinutes, money } from '@/lib/format';
import type { Service } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface PickedService {
  serviceId: string;
  name: string;
  price: number;
  durationMin: number;
  quantity: number;
  employeeId?: string;
}

/**
 * Grilla de servicios del catálogo con control de cantidad.
 * Un clic agrega el servicio; el mismo clic sobre uno ya elegido suma cantidad.
 */
export function ServicePicker({
  selected,
  onChange,
}: {
  selected: PickedService[];
  onChange: (services: PickedService[]) => void;
}) {
  const { data: services, isLoading } = useServices(true);
  const [term, setTerm] = React.useState('');

  const filtered = React.useMemo(() => {
    const needle = term.trim().toLowerCase();
    const list = services ?? [];
    if (!needle) return list;
    return list.filter(
      (service) =>
        service.name.toLowerCase().includes(needle) ||
        (service.category ?? '').toLowerCase().includes(needle),
    );
  }, [services, term]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const service of filtered) {
      const key = service.category?.trim() || 'Otros';
      map.set(key, [...(map.get(key) ?? []), service]);
    }
    return [...map.entries()];
  }, [filtered]);

  const quantityOf = (id: string) => selected.find((item) => item.serviceId === id)?.quantity ?? 0;

  const add = (service: Service) => {
    const existing = selected.find((item) => item.serviceId === service.id);
    if (existing) {
      onChange(
        selected.map((item) =>
          item.serviceId === service.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
      return;
    }
    onChange([
      ...selected,
      {
        serviceId: service.id,
        name: service.name,
        price: service.price,
        durationMin: service.durationMin,
        quantity: 1,
      },
    ]);
  };

  const remove = (serviceId: string) => {
    const existing = selected.find((item) => item.serviceId === serviceId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      onChange(selected.filter((item) => item.serviceId !== serviceId));
      return;
    }
    onChange(
      selected.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity: item.quantity - 1 } : item,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if ((services ?? []).length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No hay servicios en el catálogo"
        description="Crea tus servicios (lavado básico, premium, encerado, pulido...) con su precio y tiempo estimado para poder armar órdenes."
        action={
          <Button asChild size="sm">
            <a href="/servicios">Configurar servicios</a>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar servicio..."
          className="pl-9"
          aria-label="Buscar servicio"
        />
      </div>

      {grouped.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Ningún servicio coincide con «{term}»
        </p>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((service) => {
                const quantity = quantityOf(service.id);
                const active = quantity > 0;

                return (
                  <div
                    key={service.id}
                    className={cn(
                      'group relative rounded-xl border p-3.5 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border/70 bg-card hover:border-primary/50 hover:shadow-soft',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => add(service)}
                      className="block w-full text-left focus-visible:outline-none"
                      aria-label={`Agregar ${service.name}`}
                    >
                      <p className="pr-16 font-medium leading-tight">{service.name}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <span className="font-semibold text-primary tabular-nums">
                          {money(service.price)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden />
                          {formatMinutes(service.durationMin)}
                        </span>
                      </div>
                    </button>

                    {active ? (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-primary/30 bg-card p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => remove(service.id)}
                          aria-label={`Quitar uno de ${service.name}`}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="min-w-5 text-center text-sm font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => add(service)}
                          aria-label={`Agregar otro ${service.name}`}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant="muted"
                        className="pointer-events-none absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Plus className="size-3" />
                        Agregar
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
