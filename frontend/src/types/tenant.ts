import type { PaymentStatus } from './common'

export interface TenantProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  created_at: string
}

export interface LeaseWithDetails {
  id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit_paid: number
  rent_due_day: number
  status: string
  unit_number: string
  unit_type: string
  property_name: string
  property_address: string
}

export interface PaymentWithLease {
  id: string
  amount_due: number
  amount_paid: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus | string
  payment_method: string | null
  lease_id: string
  unit_number: string
}

export interface UnitForTenant {
  unit_number: string
  unit_type: string
  floor: number | null
  area_sqft: number | null
}

export interface PropertyForTenant {
  id: string
  name: string
  address_line: string
  city: string
  state: string
  pincode: string
  property_type: string
  units: UnitForTenant[]
}

export interface PaymentSummary {
  id: string
  amount_due: number
  due_date: string
  status: string
  unit_number: string
}

export interface TenantDashboard {
  active_leases_count: number
  total_amount_due: number
  upcoming_payments: PaymentSummary[]
  active_lease_end_dates: string[]
}

export interface TenantPasswordChangePayload {
  current_password: string
  new_password: string
}
