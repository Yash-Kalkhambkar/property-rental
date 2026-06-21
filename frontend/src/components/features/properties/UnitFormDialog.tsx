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
import { useCreateUnit, useUpdateUnit } from '@/hooks/owner/useProperties'
import type { Unit } from '@/types/owner'

const schema = z.object({
  unit_number: z.string().min(1, 'Required'),
  floor: z.number().optional(),
  area_sqft: z.number().optional(),
  unit_type: z.enum(['1BHK', '2BHK', '3BHK', 'STUDIO', 'SHOP', 'OFFICE']),
  monthly_rent: z.number(),
  deposit_amount: z.number(),
})

type FormValues = z.infer<typeof schema>

export function UnitFormDialog({
  propertyId,
  open,
  onOpenChange,
  unit,
}: {
  propertyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  unit?: Unit
}) {
  const create = useCreateUnit(propertyId)
  const update = useUpdateUnit(propertyId)
  const isEdit = !!unit

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: unit
      ? {
          unit_number: unit.unit_number,
          floor: unit.floor ?? undefined,
          area_sqft: unit.area_sqft ?? undefined,
          unit_type: unit.unit_type,
          monthly_rent: unit.monthly_rent,
          deposit_amount: unit.deposit_amount,
        }
      : undefined,
    defaultValues: { unit_type: '2BHK', monthly_rent: 0, deposit_amount: 0 },
  })

  const onSubmit = (values: FormValues) => {
    if (isEdit && unit) {
      update.mutate({ unitId: unit.id, payload: values }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit unit' : 'Add unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit number</Label>
              <Input {...register('unit_number')} />
              {errors.unit_number && <p className="text-xs text-danger">{errors.unit_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select {...register('unit_type')} className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text">
                {['1BHK', '2BHK', '3BHK', 'STUDIO', 'SHOP', 'OFFICE'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input type="number" {...register('floor', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Area (sqft)</Label>
              <Input type="number" {...register('area_sqft', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly rent</Label>
              <Input type="number" {...register('monthly_rent', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Deposit</Label>
              <Input type="number" {...register('deposit_amount', { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save' : 'Add unit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
