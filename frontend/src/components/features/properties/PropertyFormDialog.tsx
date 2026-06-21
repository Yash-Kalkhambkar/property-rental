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
import { useCreateProperty, useUpdateProperty } from '@/hooks/owner/useProperties'
import type { Property } from '@/types/owner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address_line: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  property_type: z.enum(['RESIDENTIAL', 'COMMERCIAL']),
  total_units: z.number().min(1, 'At least 1 unit'),
})

type FormValues = z.infer<typeof schema>

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
}) {
  const create = useCreateProperty()
  const update = useUpdateProperty(property?.id ?? '')
  const isEdit = !!property

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: property
      ? {
          name: property.name,
          address_line: property.address_line,
          city: property.city,
          state: property.state,
          pincode: property.pincode,
          property_type: property.property_type,
          total_units: property.total_units,
        }
      : undefined,
    defaultValues: {
      property_type: 'RESIDENTIAL',
      total_units: 1,
    },
  })

  const onSubmit = (values: FormValues) => {
    const mutation = isEdit ? update : create
    mutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        if (!isEdit) reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit property' : 'Add property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Address" error={errors.address_line?.message}>
            <Input {...register('address_line')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" error={errors.city?.message}>
              <Input {...register('city')} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <Input {...register('state')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pincode" error={errors.pincode?.message}>
              <Input {...register('pincode')} />
            </Field>
            <Field label="Total units" error={errors.total_units?.message}>
              <Input type="number" {...register('total_units', { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Type" error={errors.property_type?.message}>
            <select
              {...register('property_type')}
              className="flex h-11 w-full rounded-xl px-4 text-sm bg-owner-bg/60 border border-owner-border text-owner-text"
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Save' : 'Add property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
