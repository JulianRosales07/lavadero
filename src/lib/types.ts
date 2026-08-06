// =====================================================================
//  Tipos de la API (espejo del backend)
// =====================================================================

export type UserRole = 'ADMIN' | 'CASHIER' | 'OPERATOR';
export type VehicleType = 'CAR' | 'PICKUP' | 'MOTORCYCLE' | 'TRUCK';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'FINISHED' | 'CANCELLED';
export type DiscountType = 'AMOUNT' | 'PERCENT';
export type EvidenceStage = 'INITIAL' | 'FINAL';
export type DamageType = 'NONE' | 'SCRATCH' | 'DENT' | 'BROKEN_MIRROR' | 'BROKEN_GLASS' | 'OTHER';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN';
export type ExpenseCategory = 'SUPPLIES' | 'SALARY' | 'SERVICES' | 'MAINTENANCE' | 'OTHER';
export type RangePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarUrl: string | null;
  employeeId: string | null;
}

export interface Business {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  currency: string;
  currencySign: string;
  ticketFooter: string | null;
  ticketWidth: '58mm' | '80mm';
  showQr: boolean;
  factusEnabled: boolean;
  factusNumberingRangeId: number | null;
  factusDocument: string;
  factusOperationType: string;
  factusSendEmail: boolean;
  factusTaxId: string | null;
  factusTaxRate: number;
  factusDefaultMunicipalityCode: string | null;
  factusDefaultLegalOrganizationCode: '1' | '2';
  factusDefaultTributeCode: string;
}

export type IdentificationDocumentCode = '11' | '12' | '13' | '22' | '31' | '41' | '47';

export interface Vehicle {
  id: string;
  customerId?: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  type: VehicleType;
  photoUrl: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  identificationDocumentCode: IdentificationDocumentCode | null;
  identification: string | null;
  address: string | null;
  municipalityCode: string | null;
  legalOrganizationCode: '1' | '2' | null;
  tributeCode: string | null;
  vehicles: Vehicle[];
  ordersCount?: number;
  lastVisitAt?: string | null;
  totalSpent?: number;
  createdAt?: string;
}

export type ElectronicInvoiceStatus = 'PENDING' | 'SUBMITTING' | 'VALIDATED' | 'FAILED';

export interface ElectronicInvoice {
  id: string;
  orderId: string;
  provider: 'FACTUS';
  referenceCode: string;
  document: string;
  status: ElectronicInvoiceStatus;
  number: string | null;
  cufe: string | null;
  qrUrl: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FactusNumberingRange {
  id: number;
  document: string;
  prefix: string;
  from: number | null;
  to: number | null;
  resolutionNumber: string | null;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  category: string | null;
  color: string | null;
  active: boolean;
  sortOrder: number;
}

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: DiscountType;
  value: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  status: EmployeeStatus;
  hiredAt: string | null;
  userId: string | null;
  activeOrders?: number;
  finishedToday?: number;
  tipsToday?: number;
}

export interface OrderItem {
  id: string;
  serviceId: string | null;
  name: string;
  price: number;
  quantity: number;
  durationMin: number;
  notes: string | null;
  employeeId: string | null;
  employeeName: string | null;
  createdAt: string;
}

export interface OrderEvidence {
  id: string;
  stage: EvidenceStage;
  url: string;
  path: string | null;
  damageType: DamageType;
  note: string | null;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  tip: number;
  reference: string | null;
  paidAt: string;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus | null;
  message: string;
  userName: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  customerId: string;
  vehicleId: string;
  employeeId: string | null;
  promotionId: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountTotal: number;
  promotionTotal: number;
  tip: number;
  total: number;
  paid: number;
  estimatedMin: number;
  notes: string | null;
  cancelReason: string | null;
  requiresInvoice: boolean;
  checkInAt: string;
  startedAt: string | null;
  readyAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  customer: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'phone' | 'email' | 'notes'>;
  vehicle: Vehicle;
  employee: Pick<Employee, 'id' | 'name' | 'position' | 'phone'> | null;
  promotion: Pick<Promotion, 'id' | 'name' | 'type' | 'value'> | null;
  items: OrderItem[];
  evidences: OrderEvidence[];
  payments: OrderPayment[];
  events: OrderEvent[];
}

/** Fila del listado de órdenes (proyección plana). */
export interface OrderListItem {
  id: string;
  number: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  promotionTotal: number;
  tip: number;
  total: number;
  estimatedMin: number;
  checkInAt: string;
  finishedAt: string | null;
  createdAt: string;
  notes: string | null;
  customerId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  vehicleType: VehicleType;
  photoUrl: string | null;
  employeeId: string | null;
  employeeName: string | null;
  items: { id: string; name: string; price: number; quantity: number }[];
  evidencesCount: number;
}

export interface Expense {
  id: string;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  notes: string | null;
  spentAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  /** Número de registros que cumplen el filtro */
  total: number;
  /** Suma de dinero de esos registros (solo en órdenes) */
  totalAmount?: number;
}

export interface UploadedFile {
  url: string;
  path: string;
}

// ---------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------

export interface DashboardData {
  kpis: {
    waiting: number;
    inProgress: number;
    ready: number;
    finishedToday: number;
    servicesToday: number;
    salesToday: number;
    tipsToday: number;
    revenueToday: number;
    revenueMonth: number;
    expensesToday: number;
    customersTotal: number;
    customersToday: number;
  };
  latestOrders: {
    id: string;
    number: string;
    status: OrderStatus;
    total: number;
    tip: number;
    checkInAt: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    plate: string;
    brand: string | null;
    model: string | null;
    vehicleType: VehicleType;
    employeeName: string | null;
    services: string | null;
  }[];
  activeVehicles: {
    id: string;
    number: string;
    status: OrderStatus;
    checkInAt: string;
    estimatedMin: number;
    firstName: string;
    lastName: string;
    plate: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    vehicleType: VehicleType;
    photoUrl: string | null;
    employeeName: string | null;
    elapsedMin: number;
  }[];
  workingEmployees: {
    id: string;
    name: string;
    position: string;
    activeOrders: number;
    finishedToday: number;
    tipsToday: number;
  }[];
  salesTrend: { day: string; total: number; ordersCount: number }[];
}

export interface RangeInfo {
  from: string;
  to: string;
  preset: RangePreset;
}

export interface SalesReport {
  range: RangeInfo;
  summary: {
    ordersCount: number;
    subtotal: number;
    discountTotal: number;
    promotionTotal: number;
    tips: number;
    total: number;
    averageTicket: number;
  };
  byDay: {
    day: string;
    ordersCount: number;
    sales: number;
    tips: number;
    total: number;
  }[];
  byVehicleType: { vehicleType: VehicleType; ordersCount: number; total: number }[];
}

export interface ServicesReport {
  range: RangeInfo;
  totals: { quantity: number; total: number };
  data: {
    key: string;
    name: string;
    quantity: number;
    ordersCount: number;
    total: number;
    averagePrice: number;
  }[];
}

export interface CustomersReport {
  range: RangeInfo;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    ordersCount: number;
    total: number;
    tips: number;
    lastVisitAt: string | null;
    vehiclesCount: number;
  }[];
}

export interface TipsReport {
  range: RangeInfo;
  total: number;
  periods: { today: number; week: number; month: number };
  byEmployee: {
    employeeId: string;
    employeeName: string;
    ordersCount: number;
    tips: number;
  }[];
  byDay: { day: string; tips: number }[];
  detail: {
    orderId: string;
    number: string;
    finishedAt: string;
    tip: number;
    employeeId: string | null;
    employeeName: string;
    firstName: string;
    lastName: string;
    plate: string;
  }[];
}

export interface PaymentMethodsReport {
  range: RangeInfo;
  total: number;
  data: {
    method: PaymentMethod;
    paymentsCount: number;
    amount: number;
    tips: number;
  }[];
}

export interface EmployeesReport {
  range: RangeInfo;
  data: {
    id: string;
    name: string;
    position: string;
    status: EmployeeStatus;
    ordersCount: number;
    sales: number;
    tips: number;
    total: number;
    servicesCount: number;
    avgMinutes: number;
  }[];
}

export interface CashReport {
  range: RangeInfo;
  summary: {
    total: number;
    cash: number;
    card: number;
    transfer: number;
    yape: number;
    plin: number;
    tips: number;
    expenses: number;
    expensesCount: number;
    balance: number;
  };
  movements: {
    id: string;
    kind: 'INCOME' | 'EXPENSE';
    at: string;
    method: string;
    amount: number;
    tip: number;
    reference: string | null;
    description: string;
  }[];
}

export interface EmployeeEarningsReport {
  range: RangeInfo;
  summary: {
    ordersCount: number;
    servicesCount: number;
    servicesTotal: number;
    commissionTotal: number;
    companyTotal: number;
    tipsTotal: number;
    payoutTotal: number;
  };
  items: {
    itemId: string;
    orderId: string;
    orderNumber: string;
    finishedAt: string;
    vehiclePlate: string;
    serviceName: string;
    quantity: number;
    totalPrice: number;
    commission: number;
    companyShare: number;
  }[];
}
