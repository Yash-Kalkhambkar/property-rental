export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export interface ApiResponse<T> {
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL'
export type UnitType = '1BHK' | '2BHK' | '3BHK' | 'STUDIO' | 'SHOP' | 'OFFICE'
export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'
export type IdType = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE'

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface DocumentUploadResponse {
  document_url: string
  presigned_url: string
}
