import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy')
  } catch {
    return date
  }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM')
  } catch {
    return date
  }
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return date
  }
}

export function formatMonthYear(month: string): string {
  try {
    return format(parseISO(`${month}-01`), 'MMMM yyyy')
  } catch {
    return month
  }
}

export const leaseStatusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
}

export const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
}

export const unitStatusLabel: Record<string, string> = {
  VACANT: 'Vacant',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
}

export const propertyTypeLabel: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
}

export const unitTypeLabel: Record<string, string> = {
  '1BHK': '1 BHK',
  '2BHK': '2 BHK',
  '3BHK': '3 BHK',
  STUDIO: 'Studio',
  SHOP: 'Shop',
  OFFICE: 'Office',
}

export const paymentMethodLabel: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
}

export const idTypeLabel: Record<string, string> = {
  AADHAAR: 'Aadhaar',
  PAN: 'PAN',
  PASSPORT: 'Passport',
  DRIVING_LICENSE: 'Driving License',
}
