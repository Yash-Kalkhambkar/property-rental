import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Prohibit, FileText } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentUploadBlock } from '@/components/shared/DocumentUploadBlock'
import { Skeleton } from '@/components/shared/motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useLease,
  useTerminateLease,
  useUploadLeaseAgreement,
  useLeaseDocumentUrl,
} from '@/hooks/owner/useLeases'
import { usePayments } from '@/hooks/owner/usePayments'
import { formatCurrency, formatDate } from '@/lib/formatters'

export const Route = createFileRoute('/_owner/leases/$id')({
  component: LeaseDetailPage,
})

function LeaseDetailPage() {
  const { id } = Route.useParams()
  const { data: lease, isLoading } = useLease(id)
  const { data: payments } = usePayments({ lease_id: id, limit: 50 })
  const terminate = useTerminateLease(id)
  const uploadAgreement = useUploadLeaseAgreement(id)
  const getDoc = useLeaseDocumentUrl()
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [terminationDate, setTerminationDate] = useState('')

  if (isLoading) return <Skeleton className="h-96" />
  if (!lease) return <p className="text-owner-muted">Lease not found.</p>

  return (
    <div className="space-y-8">
      <Link
        to="/leases"
        className="inline-flex items-center gap-2 text-sm text-owner-muted hover:text-owner-accent"
      >
        <ArrowLeft weight="regular" size={16} /> Back to leases
      </Link>

      <div className="glass-owner rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={lease.status} type="lease" />
            </div>
            <h1 className="font-display text-4xl font-semibold text-gradient-owner">
              {lease.tenant.full_name}
            </h1>
            <p className="text-owner-muted mt-2">
              {lease.unit.property_name} · Unit {lease.unit.unit_number}
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              <div>
                <p className="text-xs text-owner-muted uppercase tracking-wider">Period</p>
                <p className="font-medium">
                  {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-owner-muted uppercase tracking-wider">Monthly rent</p>
                <p className="font-medium text-owner-accent">{formatCurrency(lease.monthly_rent)}</p>
              </div>
              <div>
                <p className="text-xs text-owner-muted uppercase tracking-wider">Deposit paid</p>
                <p className="font-medium">{formatCurrency(lease.deposit_paid)}</p>
              </div>
            </div>
          </div>
          {lease.status === 'ACTIVE' && (
            <Button variant="destructive" onClick={() => setTerminateOpen(true)}>
              <Prohibit weight="regular" size={16} /> Terminate lease
            </Button>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-owner-border/50">
          <SummaryCard label="Total due" value={formatCurrency(lease.payments_summary.total_due)} />
          <SummaryCard label="Total paid" value={formatCurrency(lease.payments_summary.total_paid)} />
          <SummaryCard
            label="Overdue"
            value={formatCurrency(lease.payments_summary.overdue_amount)}
            danger
          />
        </div>
      </div>

      <DocumentUploadBlock
        label="Lease agreement"
        accept=".pdf"
        documentUrl={lease.agreement_url}
        onUpload={(file) => uploadAgreement.mutate(file)}
        isUploading={uploadAgreement.isPending}
        onView={() => getDoc.mutate(id)}
      />

      <div>
        <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText weight="duotone" size={24} className="text-owner-accent" /> Payments
        </h2>
        <div className="glass-owner rounded-2xl overflow-hidden">
          {!payments?.items.length ? (
            <p className="text-center text-owner-muted py-12">No payments recorded for this lease.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-owner-border/50 text-owner-muted text-left">
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.items.map((p) => (
                  <tr key={p.id} className="border-b border-owner-border/30 hover:bg-owner-elevated/40">
                    <td className="px-5 py-3">{formatDate(p.due_date)}</td>
                    <td className="px-5 py-3">{formatCurrency(p.amount_due)}</td>
                    <td className="px-5 py-3">{formatCurrency(p.amount_paid)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate lease</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Termination date</Label>
              <Input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setTerminateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason || !terminationDate || terminate.isPending}
              onClick={() =>
                terminate.mutate(
                  { reason, termination_date: terminationDate },
                  { onSuccess: () => setTerminateOpen(false) },
                )
              }
            >
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="rounded-xl bg-owner-bg/50 p-4">
      <p className="text-xs text-owner-muted uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${danger ? 'text-danger' : ''}`}>{value}</p>
    </div>
  )
}
