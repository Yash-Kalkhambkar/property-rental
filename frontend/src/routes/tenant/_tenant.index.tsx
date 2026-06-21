import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { CalendarBlank, CreditCard, FileText, User } from '@phosphor-icons/react'
import { PageShell } from '@/components/shared/PageShell'
import { QuickActions } from '@/components/shared/QuickActions'
import { StatRibbon } from '@/components/shared/StatRibbon'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageTransition, FadeInItem, Skeleton } from '@/components/shared/motion'
import { useTenantDashboard } from '@/hooks/tenant/usePortal'
import { formatCurrency, formatDateShort } from '@/lib/formatters'

export const Route = createFileRoute('/tenant/_tenant/')({
  component: TenantDashboardPage,
})

function TenantDashboardPage() {
  const { data, isLoading, isError } = useTenantDashboard()

  if (isLoading) {
    return (
      <PageShell title="Home" subtitle="Loading…" variant="tenant">
        <Skeleton variant="tenant" className="h-32 mb-6" />
        <Skeleton variant="tenant" className="h-64" />
      </PageShell>
    )
  }

  if (isError || !data) {
    return (
      <PageShell title="Home" variant="tenant">
        <div className="glass-tenant rounded-2xl p-8 text-center text-tenant-muted">
          Could not load dashboard.
        </div>
      </PageShell>
    )
  }

  return (
    <PageTransition>
      <PageShell
        title="Home"
        subtitle="What's due, what's coming up, and your active leases."
        variant="tenant"
      >
        <StatRibbon
          variant="tenant"
          stats={[
            {
              label: 'Active leases',
              value: String(data.active_leases_count),
              icon: FileText,
            },
            {
              label: 'Amount due',
              value: formatCurrency(data.total_amount_due),
              accent: data.total_amount_due > 0,
              icon: CreditCard,
            },
            {
              label: 'Upcoming',
              value: String(data.upcoming_payments.length),
              sub: 'Next 30 days',
              icon: CalendarBlank,
            },
          ]}
        />

        <div className="mt-8">
          <QuickActions
            variant="tenant"
            actions={[
              {
                label: 'View leases',
                description: 'Check terms and lease status',
                to: '/tenant/leases',
                icon: FileText,
              },
              {
                label: 'Payment history',
                description: 'See past and pending rent',
                to: '/tenant/payments',
                icon: CreditCard,
              },
              {
                label: 'Your profile',
                description: 'Update contact details',
                to: '/tenant/profile',
                icon: User,
              },
            ]}
          />
        </div>

        <FadeInItem className="mt-10">
          <div className="glass-tenant rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-tenant-border">
              <h3 className="text-base font-semibold text-tenant-text">Upcoming payments</h3>
            </div>
            {data.upcoming_payments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-tenant-muted">No payments due in the next 30 days.</p>
                <Link
                  to="/tenant/payments"
                  className="mt-3 inline-block text-sm font-medium text-tenant-accent hover:underline"
                >
                  View payment history →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-tenant-border">
                {data.upcoming_payments.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to="/tenant/payments"
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-tenant-accent/5"
                    >
                      <div>
                        <p className="font-medium text-tenant-text">Unit {p.unit_number}</p>
                        <p className="text-sm text-tenant-muted">
                          Due {formatDateShort(p.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={p.status} type="payment" />
                        <span className="font-semibold text-tenant-accent">
                          {formatCurrency(p.amount_due)}
                        </span>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </FadeInItem>
      </PageShell>
    </PageTransition>
  )
}
