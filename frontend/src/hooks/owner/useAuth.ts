import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ownerAuthApi } from '@/api/owner/auth.api'
import { useOwnerAuthStore } from '@/stores/ownerAuthStore'
import { getApiErrorMessage } from '@/hooks/useApiError'

export function useOwnerLogin() {
  const navigate = useNavigate()
  const setAccessToken = useOwnerAuthStore((s) => s.setAccessToken)
  const setOwner = useOwnerAuthStore((s) => s.setOwner)

  return useMutation({
    mutationFn: ownerAuthApi.login,
    onSuccess: async (res) => {
      setAccessToken(res.data.access_token)
      const me = await ownerAuthApi.me()
      setOwner(me.data)
      toast.success('Welcome back')
      navigate({ to: '/dashboard' })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Invalid credentials')),
  })
}

export function useOwnerRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ownerAuthApi.register,
    onSuccess: () => {
      toast.success('Account created — please sign in')
      navigate({ to: '/login' })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Registration failed')),
  })
}

export function useOwnerLogout() {
  const navigate = useNavigate()
  const logout = useOwnerAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: ownerAuthApi.logout,
    onSettled: () => {
      logout()
      navigate({ to: '/login' })
    },
  })
}
