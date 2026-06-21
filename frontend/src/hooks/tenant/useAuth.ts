import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { tenantAuthApi } from '@/api/tenant/auth.api'
import { useTenantAuthStore } from '@/stores/tenantAuthStore'
import { getApiErrorMessage } from '@/hooks/useApiError'

export function useTenantLogin() {
  const navigate = useNavigate()
  const setAccessToken = useTenantAuthStore((s) => s.setAccessToken)
  const setTenant = useTenantAuthStore((s) => s.setTenant)

  return useMutation({
    mutationFn: tenantAuthApi.login,
    onSuccess: async (res) => {
      setAccessToken(res.data.access_token)
      const me = await tenantAuthApi.me()
      setTenant(me.data)
      toast.success('Welcome home')
      navigate({ to: '/tenant' })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Invalid credentials')),
  })
}

export function useTenantLogout() {
  const navigate = useNavigate()
  const logout = useTenantAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: tenantAuthApi.logout,
    onSettled: () => {
      logout()
      navigate({ to: '/tenant/login' })
    },
  })
}

export function useChangeTenantPassword() {
  return useMutation({
    mutationFn: tenantAuthApi.changePassword,
    onSuccess: () => toast.success('Password updated'),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to change password')),
  })
}
