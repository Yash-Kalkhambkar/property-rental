import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOwnerLogin } from '@/hooks/owner/useAuth'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const login = useOwnerLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <AuthLayout
      variant="owner"
      title="Sign in to your portfolio."
      subtitle="Manage properties, tenants, leases, and payments from one place."
      footer={
        <p className="text-owner-muted">
          New here?{' '}
          <Link to="/register" className="text-owner-accent hover:underline font-medium">
            Create an owner account
          </Link>
        </p>
      }
    >
      <h2 className="text-2xl font-semibold mb-1">Owner sign in</h2>
      <p className="text-sm text-owner-muted mb-8">Access your rental portfolio</p>

      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-owner-muted">
        <Link to="/" className="hover:text-owner-accent transition-colors">
          ← Back to home
        </Link>
        {' · '}
        Tenant?{' '}
        <Link to="/tenant/login" className="text-owner-accent hover:underline">
          Resident portal
        </Link>
      </p>
    </AuthLayout>
  )
}
