import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function QuickActions({
  actions,
  variant = 'owner',
}: {
  actions: {
    label: string
    description: string
    to: string
    icon: Icon
  }[]
  variant?: 'owner' | 'tenant'
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action, i) => (
        <motion.div
          key={action.to}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
        >
          <Link
            to={action.to}
            className={cn(
              'group flex items-start gap-3 rounded-xl p-4 transition-all duration-300',
              variant === 'owner'
                ? 'glass-owner hover:glow-accent'
                : 'glass-tenant hover:glow-tenant',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                variant === 'owner' ? 'icon-chip-owner' : 'icon-chip-tenant',
              )}
            >
              <action.icon weight="duotone" size={20} />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  variant === 'owner' ? 'text-owner-text' : 'text-tenant-text',
                )}
              >
                {action.label}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-xs leading-relaxed',
                  variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
                )}
              >
                {action.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
