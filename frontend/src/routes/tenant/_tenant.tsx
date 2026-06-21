import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useTenantAuthStore } from '@/stores/tenantAuthStore'
import { TenantShell } from '@/components/layout/tenant/TenantShell'

export const Route = createFileRoute('/tenant/_tenant')({
  beforeLoad: () => {
    if (!useTenantAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/tenant/login' })
    }
  },
  component: () => (
    <TenantShell>
      <Outlet />
    </TenantShell>
  ),
})
