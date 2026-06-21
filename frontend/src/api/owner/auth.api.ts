import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse, LoginResponse } from '@/types/common'
import type { Owner } from '@/types/owner'

export const ownerAuthApi = {
  register: async (payload: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    const { data } = await ownerApi.post<ApiResponse<Owner>>('/auth/register', payload)
    return data
  },

  login: async (payload: { email: string; password: string }) => {
    const { data } = await ownerApi.post<ApiResponse<LoginResponse>>('/auth/login', payload)
    return data
  },

  logout: async () => {
    await ownerApi.post('/auth/logout')
  },

  me: async () => {
    const { data } = await ownerApi.get<ApiResponse<Owner>>('/auth/me')
    return data
  },

  refresh: async () => {
    const { data } = await ownerApi.post<ApiResponse<LoginResponse>>('/auth/refresh')
    return data
  },
}
