import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'owner' | 'tenant'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'owner', ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl px-4 text-sm transition-all duration-200',
        'placeholder:text-owner-muted/50 focus-visible:outline-none focus-visible:ring-2',
        variant === 'owner' &&
          'bg-white/[0.04] border border-white/10 text-owner-text focus-visible:ring-owner-accent/35 focus-visible:border-owner-accent/40',
        variant === 'tenant' &&
          'bg-white border border-tenant-border text-tenant-text focus-visible:ring-tenant-accent/30 focus-visible:border-tenant-accent/40',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
