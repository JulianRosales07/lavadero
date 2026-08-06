'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ServicePicker, type PickedService } from '@/components/orders/service-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAddOrderItems } from '@/hooks/use-orders';
import { money } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Agrega servicios a una orden existente sin generar otra orden. */
export function AddServicesDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [services, setServices] = React.useState<PickedService[]>([]);
  const addItems = useAddOrderItems();

  React.useEffect(() => {
    if (open) setServices([]);
  }, [open]);

  const extra = services.reduce(
    (acc, service) => acc + service.price * service.quantity,
    0,
  );

  const onSubmit = async () => {
    if (services.length === 0) {
      toast.error('Selecciona al menos un servicio');
      return;
    }

    await addItems.mutateAsync({
      id: order.id,
      items: services.map((service) => ({
        serviceId: service.serviceId,
        quantity: service.quantity,
        employeeId: order.employeeId,
      })),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Agregar servicios a {order.number}</DialogTitle>
          <DialogDescription>
            El total de la orden se recalcula automáticamente al guardar.
          </DialogDescription>
        </DialogHeader>

        <ServicePicker selected={services} onChange={setServices} />

        {services.length > 0 ? (
          <>
            <Separator />
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">
                {services.length} servicio{services.length === 1 ? '' : 's'} por agregar
              </span>
              <span className="text-base font-semibold tabular-nums">+ {money(extra)}</span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Nuevo total estimado: {money(order.total + extra)}
            </p>
          </>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            loading={addItems.isPending}
            disabled={services.length === 0}
            onClick={() => void onSubmit()}
          >
            <Plus />
            Agregar servicios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
