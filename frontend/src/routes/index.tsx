import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landing/LandingPage'
import { useOwnerAuthStore } from '@/stores/ownerAuthStore'
import { useTenantAuthStore } from '@/stores/tenantAuthStore'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (useOwnerAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
    if (useTenantAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/tenant' })
    }
  },
  component: LandingPage,
})
