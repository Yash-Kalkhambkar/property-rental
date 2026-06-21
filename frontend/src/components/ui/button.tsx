import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owner-accent/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-owner-accent text-white hover:bg-[#2563eb] shadow-[0_0_24px_-6px_rgba(59,130,246,0.45)] hover:shadow-[0_0_32px_-4px_rgba(59,130,246,0.55)]',
        secondary:
          'bg-owner-elevated text-owner-text border border-white/10 hover:bg-owner-surface hover:border-white/15',
        ghost: 'text-owner-muted hover:text-owner-text hover:bg-owner-elevated',
        destructive:
          'bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25',
        tenant:
          'bg-tenant-accent text-white hover:bg-[#0f766e] shadow-[0_0_20px_-6px_rgba(13,148,136,0.4)]',
        'tenant-secondary':
          'bg-tenant-elevated text-tenant-text border border-tenant-border hover:bg-tenant-surface',
        outline:
          'border border-owner-accent/35 text-owner-accent hover:bg-owner-accent-soft',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
