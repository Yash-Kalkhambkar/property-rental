import { cn } from '@/lib/utils'

type BackgroundVariant = 'owner' | 'tenant' | 'auth-owner' | 'auth-tenant'

export function AppBackground({
  variant,
  className,
}: {
  variant: BackgroundVariant
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
    >
      {variant === 'owner' || variant === 'auth-owner' ? (
        <>
          <div className="absolute inset-0 bg-owner-bg" />
          <div className="bg-blob bg-blob-owner-1" />
          <div className="bg-blob bg-blob-owner-2" />
          <div className="bg-blob bg-blob-owner-3" />
          <div className="bg-grid-owner absolute inset-0 opacity-[0.35]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-tenant-bg" />
          <div className="bg-blob bg-blob-tenant-1" />
          <div className="bg-blob bg-blob-tenant-2" />
          <div className="bg-grid-tenant absolute inset-0 opacity-40" />
        </>
      )}
    </div>
  )
}

export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#060a14]" />
      <div className="landing-aurora-1" />
      <div className="landing-aurora-2" />
      <div className="landing-aurora-3" />
      <div className="bg-grid-landing absolute inset-0" />
      <div className="landing-vignette absolute inset-0" />
    </div>
  )
}
