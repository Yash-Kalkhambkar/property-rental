import { tenantApi } from '@/stores/tenantAuthStore'
import type { ApiResponse, LoginResponse } from '@/types/common'
import type { TenantPasswordChangePayload, TenantProfile } from '@/types/tenant'

export const tenantAuthApi = {
  login: async (payload: { email: string; password: string }) => {
    const { data } = await tenantApi.post<ApiResponse<LoginResponse>>(
      '/auth/tenant/login',
      payload,
    )
    return data
  },

  logout: async () => {
    await tenantApi.post('/auth/tenant/logout')
  },

  me: async () => {
    const { data } = await tenantApi.get<ApiResponse<TenantProfile>>('/auth/tenant/me')
    return data
  },

  refresh: async () => {
    const { data } = await tenantApi.post<ApiResponse<LoginResponse>>('/auth/tenant/refresh')
    return data
  },

  changePassword: async (payload: TenantPasswordChangePayload) => {
    const { data } = await tenantApi.patch<ApiResponse<null>>('/auth/tenant/password', payload)
    return data
  },
}
