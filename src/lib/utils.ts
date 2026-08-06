import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Iniciales para avatares: "Juan Pérez" -> "JP" */
export function initials(...parts: (string | null | undefined)[]) {
  return parts
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Une nombre y apellido descartando vacíos. */
export const fullName = (first?: string | null, last?: string | null) =>
  [first, last].filter(Boolean).join(' ').trim() || 'Sin nombre';

/** Deja solo dígitos, útil para enlaces de WhatsApp. */
export const digitsOnly = (value?: string | null) => (value ?? '').replace(/\D/g, '');
