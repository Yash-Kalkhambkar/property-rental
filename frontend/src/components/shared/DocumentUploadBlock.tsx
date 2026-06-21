import { motion } from 'framer-motion'
import { UploadSimple, FileText, ArrowSquareOut } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DocumentUploadBlock({
  label,
  accept,
  onUpload,
  documentUrl,
  onView,
  isUploading,
  variant = 'owner',
}: {
  label: string
  accept: string
  onUpload: (file: File) => void
  documentUrl?: string | null
  onView?: () => void
  isUploading?: boolean
  variant?: 'owner' | 'tenant'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File) => {
    onUpload(file)
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variant === 'owner' ? 'glass-owner' : 'glass-tenant',
        dragOver && 'ring-2 ring-owner-accent/40',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <p
        className={cn(
          'text-sm font-medium mb-4',
          variant === 'owner' ? 'text-owner-text' : 'text-tenant-text',
        )}
      >
        {label}
      </p>

      {documentUrl ? (
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              variant === 'owner'
                ? 'bg-owner-accent-soft text-owner-accent'
                : 'bg-tenant-accent-soft text-tenant-accent',
            )}
          >
            <FileText weight="duotone" size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Document uploaded</p>
            <p className="text-xs text-owner-muted">Ready to view</p>
          </div>
          {onView && (
            <Button variant="outline" size="sm" onClick={onView}>
              <ArrowSquareOut weight="regular" size={16} /> View
            </Button>
          )}
        </div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'w-full rounded-xl border-2 border-dashed py-10 px-6 text-center transition-colors cursor-pointer',
            variant === 'owner'
              ? 'border-owner-border hover:border-owner-accent/40 hover:bg-owner-accent-soft/30'
              : 'border-tenant-border hover:border-tenant-accent/30 hover:bg-tenant-accent-soft',
          )}
        >
          <UploadSimple
            weight="duotone"
            size={32}
            className={cn(
              'mx-auto mb-3',
              variant === 'owner' ? 'text-owner-accent' : 'text-tenant-accent',
            )}
          />
          <p className="text-sm font-medium">
            {isUploading ? 'Uploading…' : 'Drop file here or click to browse'}
          </p>
          <p className="text-xs text-owner-muted mt-1">{accept.replace(/,/g, ', ')}</p>
        </motion.button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {documentUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          Replace document
        </Button>
      )}
    </div>
  )
}
