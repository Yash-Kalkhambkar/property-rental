export type PropertyType = "RESIDENTIAL" | "COMMERCIAL";
export type UnitType = "1BHK" | "2BHK" | "3BHK" | "STUDIO" | "SHOP" | "OFFICE";
export type UnitStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE";
export type LeaseStatus = "ACTIVE" | "EXPIRED" | "TERMINATED";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
export type IdType = "AADHAAR" | "PAN" | "PASSPORT" | "DRIVING_LICENSE";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface Owner {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  property_type: PropertyType;
  total_units: number;
  occupied_units: number;
  monthly_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyPayload {
  name: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  property_type: PropertyType;
  total_units: number;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface CurrentTenantSummary {
  id: string;
  full_name: string;
  phone: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  area_sqft: number | null;
  unit_type: UnitType;
  monthly_rent: number;
  deposit_amount: number;
  status: UnitStatus;
  amenities: string[];
  current_tenant: CurrentTenantSummary | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitPayload {
  unit_number: string;
  floor?: number;
  area_sqft?: number;
  unit_type: UnitType;
  monthly_rent: number;
  deposit_amount: number;
  amenities?: string[];
}

export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export interface Tenant {
  id: string;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  id_type: IdType | null;
  id_number: string | null;
  id_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantPayload {
  full_name: string;
  email?: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_type?: IdType;
  id_number?: string;
  notes?: string;
}

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export interface PaymentsSummary {
  total_due: number;
  total_paid: number;
  overdue_amount: number;
}

export interface UnitSummary {
  id: string;
  unit_number: string;
  property_name: string;
  property_id: string;
}

export interface TenantSummary {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  unit: UnitSummary;
  tenant: TenantSummary;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_paid: number;
  rent_due_day: number;
  status: LeaseStatus;
  agreement_url: string | null;
  notes: string | null;
  payments_summary: PaymentsSummary;
  created_at: string;
  updated_at: string;
}

export interface CreateLeasePayload {
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_paid: number;
  rent_due_day?: number;
  notes?: string;
}

export interface TerminateLeasePayload {
  reason: string;
  termination_date: string;
}

export interface Payment {
  id: string;
  lease_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  paid_date: string | null;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  lease_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export type UpdatePaymentPayload = Partial<Omit<CreatePaymentPayload, "lease_id">>;

export interface DashboardSummary {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
}

export interface DashboardFinancials {
  current_month_expected: number;
  current_month_collected: number;
  overdue_amount: number;
  overdue_count: number;
}

export interface ExpiringLease {
  lease_id: string;
  tenant_name: string;
  unit: string;
  end_date: string;
  days_remaining: number;
}

export interface OverduePayment {
  payment_id: string;
  tenant_name: string;
  unit: string;
  overdue_days: number;
  amount: number;
}

export interface DashboardAlerts {
  leases_expiring_soon: ExpiringLease[];
  overdue_payments: OverduePayment[];
}

export interface Dashboard {
  summary: DashboardSummary;
  financials: DashboardFinancials;
  alerts: DashboardAlerts;
}

export interface ApiError {
  detail: string;
  code:
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "CONFLICT"
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";
}