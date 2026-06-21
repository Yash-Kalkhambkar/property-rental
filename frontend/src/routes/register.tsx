import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOwnerRegister } from '@/hooks/owner/useAuth'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.email('Enter a valid email'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/\d/, 'Include a number')
    .regex(/[!@#$%^&*]/, 'Include a special character'),
})

type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const registerOwner = useOwnerRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <AuthLayout
      variant="owner"
      title="Create your owner account."
      subtitle="Add your properties, set up leases, and start tracking rent in one place."
      footer={
        <p className="text-owner-muted">
          Already registered?{' '}
          <Link to="/login" className="text-owner-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <h2 className="text-2xl font-semibold mb-1">Create account</h2>
      <p className="text-sm text-owner-muted mb-8">Set up your owner profile</p>

      <form
        onSubmit={handleSubmit((v) => registerOwner.mutate(v))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register('full_name')} />
          {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={registerOwner.isPending}>
          {registerOwner.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
