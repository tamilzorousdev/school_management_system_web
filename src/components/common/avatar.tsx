import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Camera, ExternalLink, Loader2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONES = [
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-teal-500/15 text-teal-700 dark:text-teal-300',
]

const sizes = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  src,
  title,
  subtitle,
  onChangePhoto,
  onRemovePhoto,
  isUploading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  src?: string | null
  title?: string
  subtitle?: string
  onChangePhoto?: (file: File) => void | Promise<void>
  onRemovePhoto?: () => void | Promise<void>
  isUploading?: boolean
}) {
  if (!src) return null
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className='fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-3 outline-none duration-200 sm:max-w-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='flex w-full items-center justify-between gap-3 px-1 text-white'>
            <div className='min-w-0'>
              <DialogPrimitive.Title className='truncate text-base font-bold sm:text-lg'>
                {title || 'Photo preview'}
              </DialogPrimitive.Title>
              {subtitle && <p className='truncate text-xs text-white/70'>{subtitle}</p>}
            </div>
            <div className='flex items-center gap-2'>
              {onChangePhoto && (
                <label
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs transition hover:bg-white/25 active:scale-95',
                    isUploading && 'pointer-events-none opacity-60'
                  )}
                  title='Upload new photo'
                >
                  {isUploading ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Camera className='size-3.5' />
                  )}
                  <span className='hidden sm:inline'>{isUploading ? 'Uploading…' : 'Change photo'}</span>
                  <span className='sm:hidden'>{isUploading ? '…' : 'Change'}</span>
                  <input
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='sr-only'
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && onChangePhoto) {
                        void onChangePhoto(file)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
              {onRemovePhoto && (
                <button
                  type='button'
                  onClick={() => void onRemovePhoto()}
                  title='Remove photo'
                  className='inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 shadow-xs backdrop-blur-xs transition hover:bg-rose-500/35 hover:text-white active:scale-95'
                >
                  <Trash2 className='size-3.5' />
                  <span className='hidden sm:inline'>Remove</span>
                </button>
              )}
              <a
                href={src}
                target='_blank'
                rel='noopener noreferrer'
                title='Open full image in new tab'
                className='grid size-8 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white'
              >
                <ExternalLink className='size-4' />
              </a>
              <DialogPrimitive.Close
                aria-label='Close preview'
                className='grid size-8 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white'
              >
                <X className='size-4' />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className='relative flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-2xl'>
            <img
              src={src}
              alt={title || 'Profile photo preview'}
              className='max-h-[70vh] w-auto max-w-full rounded-2xl object-contain'
            />
          </div>

          {(onChangePhoto || onRemovePhoto) && (
            <div className='flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 backdrop-blur-sm'>
              <p className='text-xs text-white/70'>
                Photo not clear? Replace or remove it directly here.
              </p>
              <div className='flex items-center gap-2'>
                {onChangePhoto && (
                  <label
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95',
                      isUploading && 'pointer-events-none opacity-60'
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className='size-3.5 animate-spin' />
                    ) : (
                      <Camera className='size-3.5' />
                    )}
                    <span>{isUploading ? 'Uploading…' : 'Replace photo'}</span>
                    <input
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      className='sr-only'
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && onChangePhoto) {
                          void onChangePhoto(file)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
                {onRemovePhoto && (
                  <button
                    type='button'
                    onClick={() => void onRemovePhoto()}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/25 hover:text-white active:scale-95'
                  >
                    <Trash2 className='size-3.5' />
                    <span>Remove photo</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  previewable = false,
  subtitle,
  onChangePhoto,
  onRemovePhoto,
  isUploading = false,
}: {
  name: string
  src?: string | null
  size?: keyof typeof sizes
  className?: string
  previewable?: boolean
  subtitle?: string
  onChangePhoto?: (file: File) => void | Promise<void>
  onRemovePhoto?: () => void | Promise<void>
  isUploading?: boolean
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const tone = TONES[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES.length]

  const hasPhoto = Boolean(src && failedSrc !== src)

  const handleAvatarClick = (event: React.MouseEvent) => {
    if (previewable && hasPhoto) {
      event.stopPropagation()
      event.preventDefault()
      setPreviewOpen(true)
    }
  }

  return (
    <>
      {hasPhoto ? (
        <img
          src={src!}
          alt={name}
          onError={() => setFailedSrc(src!)}
          onClick={handleAvatarClick}
          title={previewable ? 'Click to view photo' : undefined}
          className={cn(
            'inline-block shrink-0 rounded-full object-cover',
            sizes[size],
            previewable &&
              'cursor-pointer transition hover:scale-105 hover:ring-2 hover:ring-primary/60 active:scale-95',
            className
          )}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'inline-grid shrink-0 place-items-center rounded-full font-bold tracking-wide',
            tone,
            sizes[size],
            className
          )}
        >
          {initials(name)}
        </span>
      )}

      {previewable && hasPhoto && (
        <ImagePreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          src={src}
          title={name}
          subtitle={subtitle}
          onChangePhoto={onChangePhoto}
          onRemovePhoto={onRemovePhoto}
          isUploading={isUploading}
        />
      )}
    </>
  )
}
