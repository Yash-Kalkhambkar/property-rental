import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leasesApi } from '@/api/owner/leases.api'
import type { CreateLeasePayload, TerminateLeasePayload } from '@/types/owner'
import { getApiErrorMessage } from '@/hooks/useApiError'
import { DASHBOARD_KEYS } from './useDashboard'
import { PROPERTY_KEYS } from './useProperties'

export const LEASE_KEYS = {
  all: ['leases'] as const,
  list: (params?: object) => [...LEASE_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...LEASE_KEYS.all, 'detail', id] as const,
}

export function useLeases(
  params?: {
    page?: number
    limit?: number
    status?: string
    expiring_in_days?: number
    unit_id?: string
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: LEASE_KEYS.list(params),
    queryFn: () => leasesApi.list(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  })
}

export function useLease(id: string) {
  return useQuery({
    queryKey: LEASE_KEYS.detail(id),
    queryFn: () => leasesApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateLease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeasePayload) => leasesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASE_KEYS.all })
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Lease created')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create lease')),
  })
}

export function useTerminateLease(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TerminateLeasePayload) => leasesApi.terminate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASE_KEYS.all })
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Lease terminated')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to terminate')),
  })
}

export function useUploadLeaseAgreement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => leasesApi.uploadAgreement(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASE_KEYS.detail(id) })
      toast.success('Agreement uploaded')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Upload failed')),
  })
}

export function useLeaseDocumentUrl() {
  return useMutation({
    mutationFn: (id: string) => leasesApi.getDocumentUrl(id),
    onSuccess: (res) => {
      if (res.data.presigned_url) window.open(res.data.presigned_url, '_blank')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not load document')),
  })
}
