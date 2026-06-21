import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/api/owner/tenants.api'
import type { CreateTenantPayload, UpdateTenantPayload } from '@/types/owner'
import { getApiErrorMessage } from '@/hooks/useApiError'

export const TENANT_KEYS = {
  all: ['tenants'] as const,
  list: (params?: object) => [...TENANT_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...TENANT_KEYS.all, 'detail', id] as const,
}

export function useTenants(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: TENANT_KEYS.list(params),
    queryFn: () => tenantsApi.list(params),
    select: (res) => res.data,
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: TENANT_KEYS.detail(id),
    queryFn: () => tenantsApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.all })
      toast.success('Tenant added')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to add tenant')),
  })
}

export function useUpdateTenant(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => tenantsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: TENANT_KEYS.list() })
      toast.success('Tenant updated')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update')),
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.all })
      toast.success('Tenant deleted')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete')),
  })
}

export function useUploadTenantDocument(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => tenantsApi.uploadDocument(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.detail(id) })
      toast.success('Document uploaded')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Upload failed')),
  })
}

export function useResetTenantPassword(id: string) {
  return useMutation({
    mutationFn: () => tenantsApi.resetPassword(id),
    onSuccess: () => toast.success('Password reset'),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Reset failed')),
  })
}
