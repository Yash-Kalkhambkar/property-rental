import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useOwnerAuthStore } from '@/stores/ownerAuthStore'
import { OwnerShell } from '@/components/layout/owner/OwnerShell'

export const Route = createFileRoute('/_owner')({
  beforeLoad: () => {
    if (!useOwnerAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <OwnerShell>
      <Outlet />
    </OwnerShell>
  ),
})
