import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { variant?: 'owner' | 'tenant' }
>(({ className, variant = 'owner', ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
      className,
    )}
    {...props}
  />
))
Label.displayName = 'Label'
