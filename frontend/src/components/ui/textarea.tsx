import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'owner' | 'tenant'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'owner', ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 resize-y',
        'placeholder:text-owner-muted/60 focus-visible:outline-none focus-visible:ring-2',
        variant === 'owner' &&
          'bg-owner-bg/60 border border-owner-border text-owner-text focus-visible:ring-owner-accent/40',
        variant === 'tenant' &&
          'bg-tenant-surface border border-tenant-border text-tenant-text focus-visible:ring-tenant-accent/30',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
