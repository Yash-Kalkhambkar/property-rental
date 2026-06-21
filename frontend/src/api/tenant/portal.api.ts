import { tenantApi } from '@/stores/tenantAuthStore'
import type { ApiResponse } from '@/types/common'
import type {
  LeaseWithDetails,
  PaymentWithLease,
  PropertyForTenant,
  TenantDashboard,
} from '@/types/tenant'

export const tenantPortalApi = {
  dashboard: async () => {
    const { data } = await tenantApi.get<ApiResponse<TenantDashboard>>('/tenant/dashboard')
    return data
  },

  leases: async () => {
    const { data } = await tenantApi.get<ApiResponse<LeaseWithDetails[]>>('/tenant/leases')
    return data
  },

  payments: async (params?: { status?: string }) => {
    const { data } = await tenantApi.get<ApiResponse<PaymentWithLease[]>>('/tenant/payments', {
      params,
    })
    return data
  },

  properties: async () => {
    const { data } = await tenantApi.get<ApiResponse<PropertyForTenant[]>>('/tenant/properties')
    return data
  },
}
