import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateLease } from '@/hooks/owner/useLeases'
import { useProperties, useProperty } from '@/hooks/owner/useProperties'
import { useTenants } from '@/hooks/owner/useTenants'

const schema = z.object({
  unit_id: z.string().min(1, 'Select a unit'),
  tenant_id: z.string().min(1, 'Select a tenant'),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  monthly_rent: z.number(),
  deposit_paid: z.number(),
  rent_due_day: z.number().min(1).max(28).optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function LeaseFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [propertyId, setPropertyId] = useState('')
  const create = useCreateLease()
  const { data: properties } = useProperties({ limit: 100 })
  const { data: propertyDetail } = useProperty(propertyId)
  const { data: tenants } = useTenants({ limit: 100 })

  const vacantUnits = propertyDetail?.units.filter((u) => u.status === 'VACANT') ?? []

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rent_due_day: 1, deposit_paid: 0, monthly_rent: 0 },
  })

  const onSubmit = (values: FormValues) => {
    create.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create lease</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <select
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value)
                setValue('unit_id', '')
              }}
              className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text"
            >
              <option value="">Select property…</option>
              {properties?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Vacant unit</Label>
            <select
              {...register('unit_id')}
              disabled={!propertyId}
              onChange={(e) => {
                setValue('unit_id', e.target.value)
                const unit = vacantUnits.find((u) => u.id === e.target.value)
                if (unit) setValue('monthly_rent', unit.monthly_rent)
              }}
              className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text disabled:opacity-50"
            >
              <option value="">Select unit…</option>
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number} · ₹{u.monthly_rent}/mo
                </option>
              ))}
            </select>
            {errors.unit_id && <p className="text-xs text-danger">{errors.unit_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tenant</Label>
            <select
              {...register('tenant_id')}
              className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text"
            >
              <option value="">Select tenant…</option>
              {tenants?.items.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            {errors.tenant_id && <p className="text-xs text-danger">{errors.tenant_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" {...register('end_date')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly rent</Label>
              <Input type="number" {...register('monthly_rent', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Deposit paid</Label>
              <Input type="number" {...register('deposit_paid', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Create lease</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
