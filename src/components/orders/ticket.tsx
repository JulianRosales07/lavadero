'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { PAYMENT_METHOD_META, VEHICLE_TYPE_META } from '@/lib/constants';
import { formatDate, formatDateTime, formatTime, money } from '@/lib/format';
import type { Business, Order } from '@/lib/types';
import { cn, fullName } from '@/lib/utils';

/**
 * Ticket optimizado para impresoras térmicas de 58 mm y 80 mm.
 * Usa fuente monoespaciada y solo negro sobre blanco.
 */
export function Ticket({
  order,
  business,
  width,
  qrUrl,
  invoice,
  className,
}: {
  order: Order;
  business?: Business | null;
  width?: '58mm' | '80mm';
  qrUrl?: string;
  invoice?: { number: string | null; cufe: string | null; qrUrl: string | null; validatedAt: string | null } | null;
  className?: string;
}) {
  const paperWidth = width ?? business?.ticketWidth ?? '80mm';
  const narrow = paperWidth === '58mm';
  const showQr = (business?.showQr ?? true) && Boolean(qrUrl);

  return (
    <div
      className={cn(
        'ticket mx-auto bg-white p-3 text-black',
        narrow ? 'ticket-58 text-[10px] leading-[1.35]' : 'ticket-80 text-[11px] leading-[1.4]',
        className,
      )}
    >
      {/* Encabezado */}
      <header className="text-center">
        {business?.logoUrl ? (
          <div className="relative mx-auto mb-1.5 h-12 w-24">
            <Image
              src={business.logoUrl}
              alt=""
              fill
              sizes="96px"
              className="object-contain"
              unoptimized
            />
          </div>
        ) : null}

        <p className={cn('font-bold uppercase', narrow ? 'text-[13px]' : 'text-[15px]')}>
          {business?.name ?? 'Lavadero'}
        </p>
        {business?.legalName ? <p>{business.legalName}</p> : null}
        {business?.taxId ? <p>RUC {business.taxId}</p> : null}
        {business?.address ? <p>{business.address}</p> : null}
        {business?.phone ? <p>Tel. {business.phone}</p> : null}
      </header>

      <Divider />

      {/* Datos de la orden */}
      <p className="text-center font-bold">ORDEN DE SERVICIO</p>
      <p className="text-center font-bold tracking-wide">{order.number}</p>

      <Divider />

      <Field label="Fecha" value={formatDate(order.finishedAt ?? order.createdAt, 'dd/MM/yyyy')} />
      <Field label="Hora" value={formatTime(order.finishedAt ?? order.createdAt)} />
      <Field label="Ingreso" value={formatTime(order.checkInAt)} />
      <Field label="Cliente" value={fullName(order.customer.firstName, order.customer.lastName)} />
      {order.customer.phone ? <Field label="Teléfono" value={order.customer.phone} /> : null}
      <Field
        label="Vehículo"
        value={
          [order.vehicle.brand, order.vehicle.model].filter(Boolean).join(' ') ||
          VEHICLE_TYPE_META[order.vehicle.type].label
        }
      />
      <Field label="Placa" value={order.vehicle.plate} bold />
      {order.vehicle.color ? <Field label="Color" value={order.vehicle.color} /> : null}
      <Field label="Atendió" value={order.employee?.name ?? 'No asignado'} />

      <Divider />

      {/* Servicios */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="pb-0.5 text-left font-bold">SERVICIO</th>
            <th className="pb-0.5 text-center font-bold">CANT</th>
            <th className="pb-0.5 text-right font-bold">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="py-0.5 pr-1">{item.name}</td>
              <td className="py-0.5 text-center tabular-nums">{item.quantity}</td>
              <td className="py-0.5 text-right tabular-nums">
                {money(item.price * item.quantity, false)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Divider />

      {/* Totales */}
      <Amount label="SUBTOTAL" value={order.subtotal} />
      {order.discountTotal > 0 ? (
        <Amount label="DESCUENTO" value={-order.discountTotal} />
      ) : null}
      {order.promotionTotal > 0 ? (
        <Amount
          label={`PROMO ${order.promotion?.name ?? ''}`.trim()}
          value={-order.promotionTotal}
        />
      ) : null}
      {order.tip > 0 ? <Amount label="PROPINA" value={order.tip} /> : null}

      <div className="mt-1 flex items-baseline justify-between border-t border-black pt-1">
        <span className={cn('font-bold', narrow ? 'text-[12px]' : 'text-[14px]')}>TOTAL</span>
        <span className={cn('font-bold tabular-nums', narrow ? 'text-[12px]' : 'text-[14px]')}>
          {money(order.total)}
        </span>
      </div>

      {order.payments.length > 0 ? (
        <>
          <Divider />
          {order.payments.map((payment) => (
            <Field
              key={payment.id}
              label={PAYMENT_METHOD_META[payment.method].label}
              value={money(payment.amount, false)}
            />
          ))}
          {order.paid > order.total ? (
            <Field label="Vuelto" value={money(order.paid - order.total, false)} />
          ) : null}
        </>
      ) : null}

      {order.notes ? (
        <>
          <Divider />
          <p className="font-bold">OBSERVACIONES</p>
          <p className="whitespace-pre-wrap break-words">{order.notes}</p>
        </>
      ) : null}

      <Divider />

      {/* Factura electrónica */}
      {invoice?.number ? (
        <>
          <div className="space-y-1">
            <p className="text-center font-bold">FACTURACIÓN ELECTRÓNICA</p>
            <Field label="Facturado por" value={business?.legalName || business?.name || 'Lavadero'} />
            {invoice.validatedAt ? (
              <Field label="Expedición" value={formatDateTime(invoice.validatedAt)} />
            ) : null}
            <Field label="No. Factura" value={invoice.number} bold />
          </div>

          {invoice.cufe ? (
            <>
              <Divider />
              <div className="rounded border border-black p-1">
                <p className="text-center text-[8px] font-bold">CÓDIGO ÚNICO (CUFE)</p>
                <p className="break-all text-center text-[7px] leading-tight">{invoice.cufe}</p>
              </div>
            </>
          ) : null}

          {invoice.qrUrl ? (
            <>
              <Divider />
              <div className="flex flex-col items-center gap-1 pb-1">
                <p className="text-center text-[9px] font-bold">VERIFICAR FACTURA EN DIAN</p>
                <QRCodeSVG value={invoice.qrUrl} size={narrow ? 80 : 96} level="M" />
              </div>
            </>
          ) : null}
          <Divider />
        </>
      ) : null}

      {/* Pie */}
      {!invoice?.number && showQr && qrUrl ? (
        <div className="flex flex-col items-center gap-1 pb-1.5">
          <QRCodeSVG value={qrUrl} size={narrow ? 68 : 84} level="M" />
          <p className="text-[8px]">Consulta tu orden</p>
        </div>
      ) : null}

      <p className="text-center font-bold">{business?.ticketFooter ?? '¡Gracias por su preferencia!'}</p>
      <p className="mt-1 text-center text-[8px]">
        {invoice?.number
          ? 'Documento válido como comprobante fiscal.'
          : order.evidences.length > 0
            ? `Se registraron ${order.evidences.length} evidencia(s) fotográfica(s) del vehículo.`
            : 'Documento no válido como comprobante fiscal.'}
      </p>
    </div>
  );
}

const Divider = () => <div className="my-1.5 border-t border-dashed border-black" />;

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-1">
      <span className="shrink-0">{label}:</span>
      <span className={cn('min-w-0 flex-1 break-words text-right', bold && 'font-bold')}>
        {value}
      </span>
    </div>
  );
}

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums">
        {value < 0 ? `-${money(Math.abs(value), false)}` : money(value, false)}
      </span>
    </div>
  );
}
