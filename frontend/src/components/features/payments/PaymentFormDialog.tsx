import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePayment, useUpdatePayment } from '@/hooks/owner/usePayments'
import { useLeases } from '@/hooks/owner/useLeases'
import { paymentsApi } from '@/api/owner/payments.api'

const schema = z.object({
  lease_id: z.string().min(1),
  amount_due: z.number(),
  amount_paid: z.number(),
  due_date: z.string().min(1),
  paid_date: z.string().optional(),
  payment_method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PaymentFormDialog({
  open,
  onOpenChange,
  paymentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId?: string
}) {
  const isEdit = !!paymentId
  const create = useCreatePayment()
  const update = useUpdatePayment(paymentId ?? '')
  const { data: leases } = useLeases({ status: 'ACTIVE', limit: 100 })

  const { data: existing } = useQuery({
    queryKey: ['payments', 'detail', paymentId],
    queryFn: () => paymentsApi.getById(paymentId!),
    select: (r) => r.data,
    enabled: !!paymentId && open,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount_due: 0, amount_paid: 0 },
  })

  useEffect(() => {
    if (existing) {
      reset({
        lease_id: existing.lease_id,
        amount_due: existing.amount_due,
        amount_paid: existing.amount_paid,
        due_date: existing.due_date,
        paid_date: existing.paid_date ?? undefined,
        payment_method: (existing.payment_method as FormValues['payment_method']) ?? undefined,
        reference_number: existing.reference_number ?? undefined,
        notes: existing.notes ?? undefined,
      })
    } else if (!paymentId) {
      reset({ amount_due: 0, amount_paid: 0 })
    }
  }, [existing, paymentId, reset])

  const onSubmit = (values: FormValues) => {
    const mutation = isEdit ? update : create
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit payment' : 'Record payment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Lease</Label>
              <select
                {...register('lease_id')}
                className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text"
              >
                <option value="">Select lease…</option>
                {leases?.items.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant.full_name} · {l.unit.unit_number}
                  </option>
                ))}
              </select>
              {errors.lease_id && <p className="text-xs text-danger">{errors.lease_id.message}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount due</Label>
              <Input type="number" {...register('amount_due', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Amount paid</Label>
              <Input type="number" {...register('amount_paid', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2">
              <Label>Paid date</Label>
              <Input type="date" {...register('paid_date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <select
              {...register('payment_method')}
              className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text"
            >
              <option value="">—</option>
              {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save' : 'Record'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
