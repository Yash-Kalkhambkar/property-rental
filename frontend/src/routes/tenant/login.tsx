import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTenantLogin } from '@/hooks/tenant/useAuth'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/tenant/login')({
  component: TenantLoginPage,
})

function TenantLoginPage() {
  const login = useTenantLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  return (
    <AuthLayout
      variant="tenant"
      title="Your rental portal."
      subtitle="View leases, check payment history, and keep your rental details in one place."
    >
      <h2 className="text-2xl font-semibold mb-1 text-tenant-text">Resident sign in</h2>
      <p className="text-sm text-tenant-muted mb-8">Access your tenant portal</p>

      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-5">
        <div className="space-y-2">
          <Label variant="tenant" htmlFor="email">Email</Label>
          <Input variant="tenant" id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label variant="tenant" htmlFor="password">Password</Label>
          <Input variant="tenant" id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" variant="tenant" className="w-full" size="lg" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-tenant-muted">
        <Link to="/" className="hover:text-tenant-accent transition-colors">
          ← Back to home
        </Link>
        {' · '}
        Property owner?{' '}
        <Link to="/login" className="text-tenant-accent hover:underline font-medium">
          Owner portal
        </Link>
      </p>
    </AuthLayout>
  )
}
