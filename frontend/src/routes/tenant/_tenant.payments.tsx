import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CreditCard } from '@phosphor-icons/react'
import { PageShell } from '@/components/shared/PageShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTransition, FadeInItem, Skeleton } from '@/components/shared/motion'
import { useTenantPayments } from '@/hooks/tenant/usePortal'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const filters = ['', 'PENDING', 'PAID', 'PARTIAL', 'OVERDUE']

export const Route = createFileRoute('/tenant/_tenant/payments')({
  component: TenantPaymentsPage,
})

function TenantPaymentsPage() {
  const [status, setStatus] = useState('')
  const { data: payments, isLoading } = useTenantPayments(status || undefined)

  return (
    <PageTransition>
      <PageShell
        title="My Payments"
        subtitle="Every rent payment — filter by status and track your history."
        variant="tenant"
      >
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-all',
                status === s
                  ? 'bg-tenant-accent text-tenant-surface'
                  : 'glass-tenant text-tenant-muted hover:text-tenant-text',
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="tenant" className="h-20" />
            ))}
          </div>
        ) : !payments?.length ? (
          <EmptyState
            variant="tenant"
            icon={CreditCard}
            title="No payments"
            description="Your payment history will show up here once rent is recorded."
          />
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <FadeInItem key={p.id}>
                <div className="glass-tenant rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <StatusBadge status={p.status} type="payment" />
                      <span className="text-xs text-tenant-muted">Unit {p.unit_number}</span>
                    </div>
                    <p className="text-sm text-tenant-muted">Due {formatDate(p.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-tenant-accent">
                      {formatCurrency(p.amount_paid)}{' '}
                      <span className="text-tenant-muted font-normal text-sm">
                        / {formatCurrency(p.amount_due)}
                      </span>
                    </p>
                  </div>
                </div>
              </FadeInItem>
            ))}
          </div>
        )}
      </PageShell>
    </PageTransition>
  )
}
