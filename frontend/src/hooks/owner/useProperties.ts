import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/api/owner/properties.api'
import type { CreatePropertyPayload, CreateUnitPayload, UpdatePropertyPayload, UpdateUnitPayload } from '@/types/owner'
import { getApiErrorMessage } from '@/hooks/useApiError'
import { DASHBOARD_KEYS } from './useDashboard'

export const PROPERTY_KEYS = {
  all: ['properties'] as const,
  list: (params?: object) => [...PROPERTY_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...PROPERTY_KEYS.all, 'detail', id] as const,
}

export function useProperties(params?: { page?: number; limit?: number; city?: string }) {
  return useQuery({
    queryKey: PROPERTY_KEYS.list(params),
    queryFn: () => propertiesApi.list(params),
    select: (res) => res.data,
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: PROPERTY_KEYS.detail(id),
    queryFn: () => propertiesApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Property added')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to add property')),
  })
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePropertyPayload) => propertiesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.list() })
      toast.success('Property updated')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update')),
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Property deleted')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number } }
      if (e.response?.status === 409) toast.error('Cannot delete — active leases exist')
      else toast.error(getApiErrorMessage(err, 'Failed to delete'))
    },
  })
}

export function useCreateUnit(propertyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) => propertiesApi.createUnit(propertyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Unit added')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to add unit')),
  })
}

export function useUpdateUnit(propertyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unitId, payload }: { unitId: string; payload: UpdateUnitPayload }) =>
      propertiesApi.updateUnit(unitId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) })
      toast.success('Unit updated')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update unit')),
  })
}

export function useDeleteUnit(propertyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (unitId: string) => propertiesApi.deleteUnit(unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Unit deleted')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete unit')),
  })
}
