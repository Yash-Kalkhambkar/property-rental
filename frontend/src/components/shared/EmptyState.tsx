import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  description,
  action,
  icon: IconComponent,
  variant = 'owner',
}: {
  title: string
  description: string
  action?: React.ReactNode
  icon?: Icon
  variant?: 'owner' | 'tenant'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl',
        variant === 'owner' ? 'glass-owner' : 'glass-tenant',
      )}
    >
      {IconComponent && (
        <div
          className={cn(
            'mb-5 flex h-14 w-14 items-center justify-center rounded-2xl',
            variant === 'owner' ? 'icon-chip-owner' : 'icon-chip-tenant',
          )}
        >
          <IconComponent weight="duotone" size={28} />
        </div>
      )}
      <h3
        className={cn(
          'text-lg font-semibold mb-2',
          variant === 'owner' ? 'text-owner-text' : 'text-tenant-text',
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          'max-w-sm text-sm leading-relaxed mb-6',
          variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
        )}
      >
        {description}
      </p>
      {action}
    </motion.div>
  )
}
