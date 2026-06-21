import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse } from '@/types/common'
import type {
  CreatePropertyPayload,
  CreateUnitPayload,
  PaginatedProperties,
  Property,
  PropertyDetail,
  Unit,
  UpdatePropertyPayload,
  UpdateUnitPayload,
} from '@/types/owner'

export const propertiesApi = {
  list: async (params?: { page?: number; limit?: number; city?: string }) => {
    const { data } = await ownerApi.get<ApiResponse<PaginatedProperties>>('/properties/', { params })
    return data
  },

  create: async (payload: CreatePropertyPayload) => {
    const { data } = await ownerApi.post<ApiResponse<Property>>('/properties/', payload)
    return data
  },

  getById: async (id: string) => {
    const { data } = await ownerApi.get<ApiResponse<PropertyDetail>>(`/properties/${id}`)
    return data
  },

  update: async (id: string, payload: UpdatePropertyPayload) => {
    const { data } = await ownerApi.patch<ApiResponse<Property>>(`/properties/${id}`, payload)
    return data
  },

  delete: async (id: string) => {
    const { data } = await ownerApi.delete<ApiResponse<null>>(`/properties/${id}`)
    return data
  },

  listUnits: async (propertyId: string, params?: { status?: string }) => {
    const { data } = await ownerApi.get<ApiResponse<Unit[]>>(`/properties/${propertyId}/units`, {
      params,
    })
    return data
  },

  createUnit: async (propertyId: string, payload: CreateUnitPayload) => {
    const { data } = await ownerApi.post<ApiResponse<Unit>>(
      `/properties/${propertyId}/units`,
      payload,
    )
    return data
  },

  updateUnit: async (unitId: string, payload: UpdateUnitPayload) => {
    const { data } = await ownerApi.patch<ApiResponse<Unit>>(`/units/${unitId}`, payload)
    return data
  },

  deleteUnit: async (unitId: string) => {
    const { data } = await ownerApi.delete<ApiResponse<null>>(`/units/${unitId}`)
    return data
  },
}
