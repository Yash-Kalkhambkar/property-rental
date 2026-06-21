import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  pages,
  total,
  onPageChange,
  variant = 'owner',
}: {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
  variant?: 'owner' | 'tenant'
}) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <p
        className={cn(
          'text-sm',
          variant === 'owner' ? 'text-owner-muted' : 'text-tenant-muted',
        )}
      >
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          variant={variant === 'tenant' ? 'tenant-secondary' : 'secondary'}
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <CaretLeft weight="bold" size={16} />
        </Button>
        <Button
          variant={variant === 'tenant' ? 'tenant-secondary' : 'secondary'}
          size="icon"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <CaretRight weight="bold" size={16} />
        </Button>
      </div>
    </div>
  )
}
