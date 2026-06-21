import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse } from '@/types/common'
import type {
  CreatePaymentPayload,
  PaginatedPayments,
  Payment,
  UpdatePaymentPayload,
} from '@/types/owner'

export const paymentsApi = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: string
    lease_id?: string
    month?: string
  }) => {
    const { data } = await ownerApi.get<ApiResponse<PaginatedPayments>>('/payments/', { params })
    return data
  },

  create: async (payload: CreatePaymentPayload) => {
    const { data } = await ownerApi.post<ApiResponse<Payment>>('/payments/', payload)
    return data
  },

  getById: async (id: string) => {
    const { data } = await ownerApi.get<ApiResponse<Payment>>(`/payments/${id}`)
    return data
  },

  update: async (id: string, payload: UpdatePaymentPayload) => {
    const { data } = await ownerApi.patch<ApiResponse<Payment>>(`/payments/${id}`, payload)
    return data
  },

  delete: async (id: string) => {
    const { data } = await ownerApi.delete<ApiResponse<null>>(`/payments/${id}`)
    return data
  },
}
