'use client';

import * as React from 'react';
import { Check, Phone, Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerSearch } from '@/hooks/use-customers';
import { VEHICLE_TYPE_META } from '@/lib/constants';
import type { Customer, Vehicle } from '@/lib/types';
import { cn, fullName, initials } from '@/lib/utils';

/** Búsqueda de cliente + elección del vehículo, en un solo paso. */
export function CustomerVehiclePicker({
  customer,
  vehicle,
  onSelectCustomer,
  onSelectVehicle,
  onNewCustomer,
}: {
  customer: Customer | null;
  vehicle: Vehicle | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  onNewCustomer: () => void;
}) {
  const [term, setTerm] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  const { data: results, isLoading } = useCustomerSearch(debounced, !customer);

  if (customer) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initials(customer.firstName, customer.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {fullName(customer.firstName, customer.lastName)}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {customer.phone ? (
                <>
                  <Phone className="size-3" aria-hidden />
                  {customer.phone}
                </>
              ) : (
                'Sin teléfono'
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelectCustomer(null);
              onSelectVehicle(null);
              setTerm('');
            }}
          >
            Cambiar
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Vehículo</p>
          {customer.vehicles.length === 0 ? (
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              Este cliente no tiene vehículos registrados. Agrégalo desde la ficha del cliente.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {customer.vehicles.map((item) => {
                const active = vehicle?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectVehicle(item)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border/70 bg-card hover:border-primary/50',
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-base">
                      {VEHICLE_TYPE_META[item.type].icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tracking-tight">{item.plate}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[item.brand, item.model, item.color].filter(Boolean).join(' · ') ||
                          VEHICLE_TYPE_META[item.type].label}
                      </span>
                    </span>
                    {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar por nombre, teléfono o placa..."
            className="pl-9"
            autoFocus
            aria-label="Buscar cliente"
          />
        </div>
        <Button type="button" variant="outline" onClick={onNewCustomer}>
          <UserPlus />
          Nuevo cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : (results ?? []).length === 0 ? (
        <p className="rounded-lg bg-muted/40 py-6 text-center text-sm text-muted-foreground">
          {debounced
            ? `Sin resultados para «${debounced}». Registra un nuevo cliente.`
            : 'Escribe para buscar o registra un nuevo cliente.'}
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {results?.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectCustomer(item);
                  onSelectVehicle(item.vehicles?.[0] ?? null);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(item.firstName, item.lastName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {fullName(item.firstName, item.lastName)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.phone ?? 'Sin teléfono'}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap justify-end gap-1">
                  {item.vehicles?.slice(0, 3).map((v) => (
                    <Badge key={v.id} variant="outline" className="font-mono text-[11px]">
                      {v.plate}
                    </Badge>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
