import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse, DocumentUploadResponse } from '@/types/common'
import type {
  CreateTenantPayload,
  PaginatedTenants,
  TemporaryPasswordResponse,
  Tenant,
  UpdateTenantPayload,
} from '@/types/owner'

export const tenantsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await ownerApi.get<ApiResponse<PaginatedTenants>>('/tenants/', { params })
    return data
  },

  create: async (payload: CreateTenantPayload) => {
    const { data } = await ownerApi.post<ApiResponse<Tenant>>('/tenants/', payload)
    return data
  },

  getById: async (id: string) => {
    const { data } = await ownerApi.get<ApiResponse<Tenant>>(`/tenants/${id}`)
    return data
  },

  update: async (id: string, payload: UpdateTenantPayload) => {
    const { data } = await ownerApi.patch<ApiResponse<Tenant>>(`/tenants/${id}`, payload)
    return data
  },

  delete: async (id: string) => {
    const { data } = await ownerApi.delete<ApiResponse<null>>(`/tenants/${id}`)
    return data
  },

  uploadDocument: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await ownerApi.post<ApiResponse<DocumentUploadResponse>>(
      `/tenants/${id}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  resetPassword: async (id: string) => {
    const { data } = await ownerApi.post<ApiResponse<TemporaryPasswordResponse>>(
      `/tenants/${id}/reset-password`,
    )
    return data
  },
}
