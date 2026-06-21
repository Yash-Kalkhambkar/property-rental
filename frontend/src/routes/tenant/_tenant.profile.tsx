import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, EnvelopeSimple, Phone, LockSimple } from '@phosphor-icons/react'
import { PageShell } from '@/components/shared/PageShell'
import { PageTransition, FadeInItem } from '@/components/shared/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTenantAuthStore } from '@/stores/tenantAuthStore'
import { useChangeTenantPassword } from '@/hooks/tenant/useAuth'
import { formatDate } from '@/lib/formatters'

const passwordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export const Route = createFileRoute('/tenant/_tenant/profile')({
  component: TenantProfilePage,
})

function TenantProfilePage() {
  const tenant = useTenantAuthStore((s) => s.tenant)
  const changePassword = useChangeTenantPassword()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  return (
    <PageTransition>
      <PageShell
        title="My Profile"
        subtitle="Your account details and security settings."
        variant="tenant"
      >
        <FadeInItem>
          <div className="glass-tenant rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-tenant-accent/10 text-tenant-accent font-display text-4xl font-semibold">
                {tenant?.full_name?.charAt(0) ?? '?'}
              </div>
              <div>
                <h2 className="font-display text-3xl font-semibold text-tenant-text">
                  {tenant?.full_name}
                </h2>
                <p className="text-tenant-muted text-sm mt-1">
                  Member since {tenant?.created_at ? formatDate(tenant.created_at) : '—'}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <ProfileField icon={EnvelopeSimple} label="Email" value={tenant?.email ?? '—'} />
              <ProfileField icon={Phone} label="Phone" value={tenant?.phone ?? '—'} />
              <ProfileField icon={User} label="Full name" value={tenant?.full_name ?? '—'} />
            </div>
          </div>
        </FadeInItem>

        <FadeInItem>
          <div className="glass-tenant rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <LockSimple weight="duotone" size={20} className="text-tenant-accent" />
              <h3 className="font-display text-xl font-semibold text-tenant-text">
                Change password
              </h3>
            </div>
            <form
              onSubmit={handleSubmit((v) =>
                changePassword.mutate(
                  { current_password: v.current_password, new_password: v.new_password },
                  { onSuccess: () => reset() },
                ),
              )}
              className="space-y-4 max-w-md"
            >
              <div className="space-y-2">
                <Label variant="tenant">Current password</Label>
                <Input variant="tenant" type="password" {...register('current_password')} />
                {errors.current_password && (
                  <p className="text-xs text-danger">{errors.current_password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label variant="tenant">New password</Label>
                <Input variant="tenant" type="password" {...register('new_password')} />
                {errors.new_password && (
                  <p className="text-xs text-danger">{errors.new_password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label variant="tenant">Confirm new password</Label>
                <Input variant="tenant" type="password" {...register('confirm')} />
                {errors.confirm && <p className="text-xs text-danger">{errors.confirm.message}</p>}
              </div>
              <Button type="submit" variant="tenant" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </div>
        </FadeInItem>
      </PageShell>
    </PageTransition>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ weight?: 'duotone'; size?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tenant-accent/10 text-tenant-accent">
        <Icon weight="duotone" size={16} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-tenant-muted">{label}</p>
        <p className="font-medium text-tenant-text">{value}</p>
      </div>
    </div>
  )
}
