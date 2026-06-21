import { useQuery } from '@tanstack/react-query'
import { tenantPortalApi } from '@/api/tenant/portal.api'

export const TENANT_PORTAL_KEYS = {
  dashboard: ['tenant', 'dashboard'] as const,
  leases: ['tenant', 'leases'] as const,
  payments: (status?: string) => ['tenant', 'payments', status] as const,
  properties: ['tenant', 'properties'] as const,
}

export function useTenantDashboard() {
  return useQuery({
    queryKey: TENANT_PORTAL_KEYS.dashboard,
    queryFn: tenantPortalApi.dashboard,
    select: (res) => res.data,
  })
}

export function useTenantLeases() {
  return useQuery({
    queryKey: TENANT_PORTAL_KEYS.leases,
    queryFn: tenantPortalApi.leases,
    select: (res) =>
      [...res.data].sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      ),
  })
}

export function useTenantPayments(status?: string) {
  return useQuery({
    queryKey: TENANT_PORTAL_KEYS.payments(status),
    queryFn: () => tenantPortalApi.payments({ status }),
    select: (res) =>
      [...res.data].sort(
        (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime(),
      ),
  })
}

export function useTenantProperties() {
  return useQuery({
    queryKey: TENANT_PORTAL_KEYS.properties,
    queryFn: tenantPortalApi.properties,
    select: (res) => res.data,
  })
}
