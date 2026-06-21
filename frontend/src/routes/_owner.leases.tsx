import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, ArrowUpRight } from '@phosphor-icons/react'
import { PageShell } from '@/components/shared/PageShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { FadeInItem, PageTransition, Skeleton } from '@/components/shared/motion'
import { Button } from '@/components/ui/button'
import { LeaseFormDialog } from '@/components/features/leases/LeaseFormDialog'
import { useLeases } from '@/hooks/owner/useLeases'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const filters = [
  { label: 'All', value: undefined as string | undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Terminated', value: 'TERMINATED' },
]

export const Route = createFileRoute('/_owner/leases')({
  component: LeasesPage,
})

function LeasesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>()
  const [expiringSoon, setExpiringSoon] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useLeases({
    page,
    limit: 12,
    status,
    expiring_in_days: expiringSoon ? 30 : undefined,
  })

  return (
    <PageTransition>
      <PageShell
        title="Leases"
        subtitle="Track every agreement — filter by status or find leases nearing expiration."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus weight="bold" size={16} /> New lease
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => {
                setStatus(f.value)
                setExpiringSoon(false)
                setPage(1)
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-all',
                status === f.value && !expiringSoon
                  ? 'bg-owner-accent text-owner-bg'
                  : 'glass-owner text-owner-muted hover:text-owner-text',
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => {
              setExpiringSoon(!expiringSoon)
              setStatus(undefined)
              setPage(1)
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-all',
              expiringSoon
                ? 'bg-warning/20 text-warning border border-warning/30'
                : 'glass-owner text-owner-muted hover:text-owner-text',
            )}
          >
            Expiring soon
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={FileText}
            title="No leases"
            description="Create a lease to connect a tenant with a unit."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus weight="bold" size={16} /> New lease
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map((lease, i) => (
                <FadeInItem key={lease.id}>
                  <motion.div whileHover={{ x: 4 }}>
                    <Link
                      to="/leases/$id"
                      params={{ id: lease.id }}
                      className="group block glass-owner rounded-2xl p-5 hover:glow-accent transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusBadge status={lease.status} type="lease" />
                            <span className="text-xs text-owner-muted">
                              {formatDateShort(lease.start_date)} – {formatDateShort(lease.end_date)}
                            </span>
                          </div>
                          <h3 className="font-display text-xl font-semibold group-hover:text-owner-accent transition-colors">
                            {lease.tenant.full_name}
                          </h3>
                          <p className="text-sm text-owner-muted mt-1">
                            {lease.unit.property_name} · Unit {lease.unit.unit_number}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-owner-muted">Monthly rent</p>
                            <p className="text-lg font-semibold text-owner-accent">
                              {formatCurrency(lease.monthly_rent)}
                            </p>
                          </div>
                          <ArrowUpRight weight="bold" size={18} className="text-owner-muted group-hover:text-owner-accent" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </FadeInItem>
              ))}
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </PageShell>

      <LeaseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageTransition>
  )
}
