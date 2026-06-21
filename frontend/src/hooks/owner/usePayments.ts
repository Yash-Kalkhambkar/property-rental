import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { paymentsApi } from '@/api/owner/payments.api'
import type { CreatePaymentPayload, UpdatePaymentPayload } from '@/types/owner'
import { getApiErrorMessage } from '@/hooks/useApiError'
import { DASHBOARD_KEYS } from './useDashboard'
import { LEASE_KEYS } from './useLeases'

export const PAYMENT_KEYS = {
  all: ['payments'] as const,
  list: (params?: object) => [...PAYMENT_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...PAYMENT_KEYS.all, 'detail', id] as const,
}

export function usePayments(params?: {
  page?: number
  limit?: number
  status?: string
  lease_id?: string
  month?: string
}) {
  return useQuery({
    queryKey: PAYMENT_KEYS.list(params),
    queryFn: () => paymentsApi.list(params),
    select: (res) => res.data,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      qc.invalidateQueries({ queryKey: LEASE_KEYS.all })
      toast.success('Payment recorded')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to record payment')),
  })
}

export function useUpdatePayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePaymentPayload) => paymentsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      qc.invalidateQueries({ queryKey: LEASE_KEYS.all })
      toast.success('Payment updated')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update')),
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all })
      toast.success('Payment deleted')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete')),
  })
}
