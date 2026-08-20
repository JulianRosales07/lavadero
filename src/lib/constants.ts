import type {
  DamageType,
  EvidenceStage,
  ExpenseCategory,
  OrderStatus,
  PaymentMethod,
  RangePreset,
  UserRole,
  VehicleType,
} from './types';

// ---------------------------------------------------------------------
// Estados de la orden
// ---------------------------------------------------------------------

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; dot: string; short: string }
> = {
  PENDING: {
    label: 'Pendiente',
    short: 'Pend.',
    badge:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25',
    dot: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'En proceso',
    short: 'Proceso',
    badge:
      'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25',
    dot: 'bg-sky-500',
  },
  READY: {
    label: 'Lista para entregar',
    short: 'Lista',
    badge:
      'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25',
    dot: 'bg-violet-500',
  },
  FINISHED: {
    label: 'Finalizada',
    short: 'Final.',
    badge:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelada',
    short: 'Cancel.',
    badge:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25',
    dot: 'bg-rose-500',
  },
};

export const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'IN_PROGRESS', 'READY'];

/** Siguiente paso natural del flujo, para el botón de acción rápida. */
export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PENDING: { status: 'IN_PROGRESS', label: 'Iniciar servicio' },
  IN_PROGRESS: { status: 'READY', label: 'Marcar como lista' },
};

// ---------------------------------------------------------------------
// Vehículos
// ---------------------------------------------------------------------

export const VEHICLE_TYPE_META: Record<VehicleType, { label: string; icon: string }> = {
  CAR: { label: 'Automóvil', icon: '🚗' },
  PICKUP: { label: 'Camioneta', icon: '🛻' },
  MOTORCYCLE: { label: 'Moto', icon: '🏍️' },
  TRUCK: { label: 'Camión', icon: '🚚' },
};

export const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_META) as VehicleType[];

// ---------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; hint: string; className: string }
> = {
  CASH: { label: 'Efectivo', hint: 'Pago en caja', className: 'text-emerald-600' },
  CARD: { label: 'Tarjeta', hint: 'Débito o crédito', className: 'text-sky-600' },
  TRANSFER: { label: 'Transferencia', hint: 'Banca por internet', className: 'text-indigo-600' },
  YAPE: { label: 'Yape', hint: 'Billetera móvil', className: 'text-violet-600' },
  PLIN: { label: 'Plin', hint: 'Billetera móvil', className: 'text-cyan-600' },
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_META) as PaymentMethod[];

// ---------------------------------------------------------------------
// Evidencias
// ---------------------------------------------------------------------

export const DAMAGE_TYPE_META: Record<DamageType, { label: string }> = {
  NONE: { label: 'Sin daño' },
  SCRATCH: { label: 'Rayón' },
  DENT: { label: 'Golpe / abolladura' },
  BROKEN_MIRROR: { label: 'Espejo dañado' },
  BROKEN_GLASS: { label: 'Vidrio roto' },
  OTHER: { label: 'Otro desperfecto' },
};

export const DAMAGE_TYPES = Object.keys(DAMAGE_TYPE_META) as DamageType[];

export const EVIDENCE_STAGE_META: Record<EvidenceStage, { label: string; description: string }> = {
  INITIAL: {
    label: 'Evidencias iniciales',
    description: 'Estado del vehículo al ingresar: rayones, golpes, abolladuras, vidrios o espejos.',
  },
  FINAL: {
    label: 'Evidencias finales',
    description: 'Vehículo terminado. Opcional, sirve como respaldo de la entrega.',
  },
};

// ---------------------------------------------------------------------
// Otros
// ---------------------------------------------------------------------

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string }> = {
  SUPPLIES: { label: 'Insumos' },
  SALARY: { label: 'Personal' },
  SERVICES: { label: 'Servicios' },
  MAINTENANCE: { label: 'Mantenimiento' },
  OTHER: { label: 'Otros' },
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

export const USER_ROLE_META: Record<UserRole, { label: string; description: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', description: 'Gestión global de la plataforma' },
  ADMIN: { label: 'Administrador', description: 'Acceso total, incluye catálogo y reportes' },
  CASHIER: { label: 'Cajero', description: 'Órdenes, cobros y clientes' },
  OPERATOR: { label: 'Operario', description: 'Actualiza el estado de las órdenes' },
};

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Personalizado' },
];

/** Propinas sugeridas en pesos colombianos. */
export const TIP_SUGGESTIONS = [2000, 5000, 10000, 20000];
