import { format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Los importes se manejan en PESOS COLOMBIANOS ENTEROS.
 * El peso no usa centavos en la operación diaria, así que no hay decimales
 * ni conversiones: lo que se guarda es lo que se muestra.
 */
const LOCALE = 'es-CO';

let currencySign = '$';

export const setCurrencySign = (sign: string) => {
  currencySign = sign || '$';
};

export const getCurrencySign = () => currencySign;

/** 25000 -> "$ 25.000" */
export function money(amount: number | null | undefined, withSign = true) {
  const value = Math.round(Number(amount ?? 0)).toLocaleString(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return withSign ? `${currencySign} ${value}` : value;
}

/** 1500000 -> "$ 1,5 M" · para tarjetas con poco espacio */
export function moneyShort(amount: number | null | undefined) {
  const value = Math.round(Number(amount ?? 0));
  if (Math.abs(value) < 1_000_000) return money(value);
  const millions = (value / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 });
  return `${currencySign} ${millions} M`;
}

/** Texto escrito por el usuario -> pesos enteros. Ignora puntos de miles. */
export function parseMoney(value: string | number | null | undefined) {
  if (typeof value === 'number') return Math.round(value);
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

const toDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(value: string | Date | null | undefined, pattern = 'dd MMM yyyy') {
  const date = toDate(value);
  return date ? format(date, pattern, { locale: es }) : '—';
}

export function formatTime(value: string | Date | null | undefined) {
  const date = toDate(value);
  return date ? format(date, 'HH:mm', { locale: es }) : '—';
}

export function formatDateTime(value: string | Date | null | undefined) {
  const date = toDate(value);
  return date ? format(date, 'dd MMM yyyy · HH:mm', { locale: es }) : '—';
}

/** "Hoy 14:30", "Ayer 09:12" o "12 mar 2026 · 08:00" */
export function formatSmart(value: string | Date | null | undefined) {
  const date = toDate(value);
  if (!date) return '—';
  if (isToday(date)) return `Hoy ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Ayer ${format(date, 'HH:mm')}`;
  return formatDateTime(date);
}

/** "hace 25 min" */
export function fromNow(value: string | Date | null | undefined) {
  const date = toDate(value);
  return date ? `hace ${formatDistanceToNowStrict(date, { locale: es })}` : '—';
}

/** 95 -> "1 h 35 min" */
export function formatMinutes(minutes: number | null | undefined) {
  const total = Math.max(0, Math.round(Number(minutes ?? 0)));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Fecha en formato yyyy-MM-dd para inputs date. */
export const toInputDate = (value: string | Date | null | undefined) => {
  const date = toDate(value) ?? new Date();
  return format(date, 'yyyy-MM-dd');
};

export const percent = (part: number, total: number) =>
  total <= 0 ? '0%' : `${Math.round((part / total) * 100)}%`;
