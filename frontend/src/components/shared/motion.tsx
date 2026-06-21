import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  )
}

export function FadeInItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

export function Skeleton({
  className,
  variant = 'owner',
}: {
  className?: string
  variant?: 'owner' | 'tenant'
}) {
  return (
    <div
      className={`rounded-xl ${variant === 'owner' ? 'skeleton-shimmer' : 'skeleton-shimmer-tenant'} ${className ?? ''}`}
    />
  )
}
