import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse, DocumentUploadResponse } from '@/types/common'
import type {
  CreateLeasePayload,
  Lease,
  PaginatedLeases,
  TerminateLeasePayload,
} from '@/types/owner'

export const leasesApi = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: string
    expiring_in_days?: number
    unit_id?: string
  }) => {
    const { data } = await ownerApi.get<ApiResponse<PaginatedLeases>>('/leases/', { params })
    return data
  },

  create: async (payload: CreateLeasePayload) => {
    const { data } = await ownerApi.post<ApiResponse<Lease>>('/leases/', payload)
    return data
  },

  getById: async (id: string) => {
    const { data } = await ownerApi.get<ApiResponse<Lease>>(`/leases/${id}`)
    return data
  },

  update: async (id: string, payload: { notes?: string; end_date?: string }) => {
    const { data } = await ownerApi.patch<ApiResponse<Lease>>(`/leases/${id}`, payload)
    return data
  },

  terminate: async (id: string, payload: TerminateLeasePayload) => {
    const { data } = await ownerApi.patch<ApiResponse<Lease>>(
      `/leases/${id}/terminate`,
      payload,
    )
    return data
  },

  uploadAgreement: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await ownerApi.post<ApiResponse<DocumentUploadResponse>>(
      `/leases/${id}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  getDocumentUrl: async (id: string) => {
    const { data } = await ownerApi.get<ApiResponse<{ presigned_url: string }>>(
      `/leases/${id}/documents`,
    )
    return data
  },
}
