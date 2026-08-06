import type { DiscountType } from './types';

export interface TotalsLine {
  price: number;
  quantity: number;
  durationMin?: number;
}

export interface TotalsResult {
  subtotal: number;
  discountTotal: number;
  promotionTotal: number;
  tip: number;
  total: number;
  estimatedMin: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function applyDiscount(base: number, type: DiscountType, value: number) {
  if (value <= 0) return 0;
  if (type === 'PERCENT') return Math.round((base * clamp(value, 0, 100)) / 100);
  return clamp(value, 0, base);
}

/**
 * Réplica de recalc_order_totals para previsualizar los totales en vivo.
 * Importes en pesos colombianos enteros.
 * Orden: subtotal -> descuento manual -> promoción -> propina.
 * La cifra definitiva la calcula siempre Postgres al guardar.
 */
export function computeTotals(input: {
  items: TotalsLine[];
  discountType?: DiscountType;
  discountValue?: number;
  promotion?: { type: DiscountType; value: number } | null;
  tip?: number;
}): TotalsResult {
  const subtotal = input.items.reduce(
    (acc, item) => acc + item.price * Math.max(1, item.quantity),
    0,
  );
  const estimatedMin = input.items.reduce(
    (acc, item) => acc + (item.durationMin ?? 0) * Math.max(1, item.quantity),
    0,
  );

  const discountTotal = applyDiscount(
    subtotal,
    input.discountType ?? 'AMOUNT',
    input.discountValue ?? 0,
  );

  const afterDiscount = subtotal - discountTotal;
  const promotionTotal = input.promotion
    ? applyDiscount(afterDiscount, input.promotion.type, input.promotion.value)
    : 0;

  const tip = Math.max(0, input.tip ?? 0);
  const total = Math.max(0, afterDiscount - promotionTotal) + tip;

  return { subtotal, discountTotal, promotionTotal, tip, total, estimatedMin };
}
