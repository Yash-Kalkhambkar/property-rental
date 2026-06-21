import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string
  sub?: string
  accent?: boolean
  icon?: Icon
}

export function StatRibbon({
  stats,
  variant = 'owner',
}: {
  stats: StatItem[]
  variant?: 'owner' | 'tenant'
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5',
            variant === 'owner' ? 'glass-owner hover:glow-accent' : 'glass-tenant hover:glow-tenant',
            stat.accent &&
              (variant === 'owner'
                ? 'ring-1 ring-owner-accent/25'
                : 'ring-1 ring-tenant-accent/25'),
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={cn(
                  'text-xs font-medium mb-1.5',
                  variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
                )}
              >
                {stat.label}
              </p>
              <p
                className={cn(
                  'text-2xl font-semibold tracking-tight',
                  variant === 'owner' ? 'text-owner-text' : 'text-tenant-text',
                )}
              >
                {stat.value}
              </p>
              {stat.sub && (
                <p
                  className={cn(
                    'mt-1 text-xs',
                    variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
                  )}
                >
                  {stat.sub}
                </p>
              )}
            </div>
            {stat.icon && (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl opacity-80 transition-opacity group-hover:opacity-100',
                  variant === 'owner' ? 'icon-chip-owner' : 'icon-chip-tenant',
                )}
              >
                <stat.icon weight="duotone" size={20} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
