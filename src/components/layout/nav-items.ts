import {
  BadgePercent,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  /** Texto corto para el tooltip del riel de iconos. */
  hint?: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operación',
    items: [
      { href: '/dashboard', label: 'Resumen', hint: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATOR'] },
      { href: '/ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['ADMIN', 'OPERATOR'] },
      { href: '/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN'] },
      { href: '/caja', label: 'Caja', icon: Wallet, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/servicios', label: 'Servicios', icon: Sparkles, roles: ['ADMIN'] },
      { href: '/promociones', label: 'Promociones', icon: BadgePercent, roles: ['ADMIN'] },
      { href: '/empleados', label: 'Empleados', icon: UserCog, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['ADMIN', 'OPERATOR'] },
      { href: '/configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN', 'OPERATOR'] },
    ],
  },
];

export const visibleFor = (role: UserRole | undefined, item: NavItem) =>
  !item.roles || (role ? item.roles.includes(role) : false);

/** Secciones filtradas por el rol del usuario, sin secciones vacías. */
export function sectionsFor(role: UserRole | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => visibleFor(role, item)),
  })).filter((section) => section.items.length > 0);
}

/** Anchos del sidebar, compartidos con el layout para calcular el padding. */
export const SIDEBAR = {
  rail: 64,
  panel: 236,
  gap: 12,
  margin: 12,
} as const;

export const railWidth = SIDEBAR.rail + SIDEBAR.margin * 2;
export const fullWidth = SIDEBAR.margin * 2 + SIDEBAR.rail + SIDEBAR.gap + SIDEBAR.panel;
