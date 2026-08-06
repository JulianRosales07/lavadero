'use client';

import * as React from 'react';
import { Copy, MessageCircle, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Ticket } from '@/components/orders/ticket';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness } from '@/hooks/use-catalog';
import { useElectronicInvoices } from '@/hooks/use-electronic-invoices';
import { PAYMENT_METHOD_META } from '@/lib/constants';
import { formatDateTime, money } from '@/lib/format';
import type { Order } from '@/lib/types';
import { digitsOnly, fullName } from '@/lib/utils';

/** Mensaje de texto del ticket, usado para WhatsApp y para copiar. */
function buildMessage(order: Order, businessName: string) {
  const lines = [
    `*${businessName}*`,
    `Orden: ${order.number}`,
    `Fecha: ${formatDateTime(order.finishedAt ?? order.createdAt)}`,
    '',
    `Cliente: ${fullName(order.customer.firstName, order.customer.lastName)}`,
    `Vehículo: ${[order.vehicle.brand, order.vehicle.model].filter(Boolean).join(' ')} · ${order.vehicle.plate}`,
    order.employee ? `Atendió: ${order.employee.name}` : null,
    '',
    '*Servicios*',
    ...order.items.map(
      (item) =>
        `• ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''} — ${money(item.price * item.quantity)}`,
    ),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    order.discountTotal > 0 ? `Descuento: -${money(order.discountTotal)}` : null,
    order.promotionTotal > 0 ? `Promoción: -${money(order.promotionTotal)}` : null,
    order.tip > 0 ? `Propina: ${money(order.tip)}` : null,
    `*Total: ${money(order.total)}*`,
    order.payments.length > 0
      ? `Pago: ${order.payments.map((p) => PAYMENT_METHOD_META[p.method].label).join(' + ')}`
      : null,
    '',
    '¡Gracias por su preferencia!',
  ];

  return lines.filter((line) => line !== null).join('\n');
}

export function TicketDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: business } = useBusiness();
  const { data: invoices } = useElectronicInvoices(order.id, order.status === 'FINISHED');
  const invoice = invoices?.find((inv) => inv.status === 'VALIDATED');
  const [width, setWidth] = React.useState<'58mm' | '80mm'>('80mm');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (business?.ticketWidth) setWidth(business.ticketWidth);
  }, [business?.ticketWidth]);

  // Scroll a la parte superior al abrir el modal
  React.useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  const qrUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/ordenes/${order.id}` : undefined;
  const message = buildMessage(order, business?.name ?? 'Lavadero');

  const onPrint = () => {
    // La ventana de impresión usa .print-area definido en globals.css
    window.print();
  };

  const onWhatsApp = () => {
    const phone = digitsOnly(order.customer.phone);
    const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Orden ${order.number}`, text: message, url: qrUrl });
        return;
      } catch {
        // El usuario canceló: no hace falta avisar.
        return;
      }
    }
    await onCopy();
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Ticket copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el ticket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default" className="max-h-[90vh] print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <DialogHeader className="no-print">
          <DialogTitle>Ticket {order.number}</DialogTitle>
          <DialogDescription>
            Vista previa para impresora térmica. Elige el ancho del papel.
          </DialogDescription>
        </DialogHeader>

        <div className="no-print">
          <Tabs value={width} onValueChange={(value) => setWidth(value as '58mm' | '80mm')}>
            <TabsList className="w-full">
              <TabsTrigger value="58mm" className="flex-1">
                58 mm
              </TabsTrigger>
              <TabsTrigger value="80mm" className="flex-1">
                80 mm
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[calc(90vh-220px)] overflow-y-auto rounded-lg bg-slate-100 p-4 dark:bg-slate-900 print:max-h-none print:overflow-visible print:bg-white print:p-0"
        >
          <div className="flex justify-center">
            <div className="print-area shadow-soft print:shadow-none">
              <Ticket order={order} business={business} width={width} qrUrl={qrUrl} invoice={invoice} />
            </div>
          </div>
        </div>

        <DialogFooter className="no-print sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void onCopy()}>
              <Copy />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={() => void onShare()}>
              <Share2 />
              Compartir
            </Button>
            <Button variant="outline" size="sm" onClick={onWhatsApp}>
              <MessageCircle />
              WhatsApp
            </Button>
          </div>
          <Button onClick={onPrint}>
            <Printer />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
