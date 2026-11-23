import { useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, Download, Pause, Play, X, ZoomIn, ZoomOut } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { GalleryMedia } from '../api'
import { isExpired } from '../labels'

const SLIDE_MS = 4000
const ZOOM_STEPS = [1, 1.5, 2, 3]

interface MediaViewerProps {
  items: GalleryMedia[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  album: { title: string; event_date: string | null; place: string }
  slideshowEnabled: boolean
  onExpired: () => void
}

export function MediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
  album,
  slideshowEnabled,
  onExpired,
}: MediaViewerProps) {
  const open = index !== null && Boolean(items[index])
  const [lastIndex, setLastIndex] = useState(index ?? 0)
  if (open && index !== lastIndex) setLastIndex(index)
  const current = items[open ? index : lastIndex]
  const [zoom, setZoom] = useState<{ id: number; step: number }>({ id: 0, step: 0 })
  const [playing, setPlaying] = useState(false)
  const step = current && zoom.id === current.id ? zoom.step : 0
  const scale = ZOOM_STEPS[step]
  const position = open ? index : lastIndex
  const count = items.length
  const slideshow = playing && slideshowEnabled && open && count > 1

  const go = (delta: number) => {
    if (!count) return
    const next = (position + delta + count) % count
    if (isExpired(items[next]?.url_expires_at)) onExpired()
    onIndexChange(next)
  }

  useEffect(() => {
    if (!slideshow) return
    const timer = window.setTimeout(() => {
      if (isExpired(items[(position + 1) % count]?.url_expires_at)) onExpired()
      onIndexChange((position + 1) % count)
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [slideshow, position, count, items, onIndexChange, onExpired])

  const zoomBy = (delta: number) =>
    current &&
    setZoom({ id: current.id, step: Math.max(0, Math.min(ZOOM_STEPS.length - 1, step + delta)) })

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPlaying(false)
          onClose()
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-viewer/95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className='fixed inset-0 z-50 flex flex-col text-viewer-foreground outline-none'
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              go(1)
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault()
              go(-1)
            } else if (
              (event.key === '+' || event.key === '=') &&
              current?.media_type === 'image'
            ) {
              zoomBy(1)
            } else if (event.key === '-' && current?.media_type === 'image') {
              zoomBy(-1)
            } else if (event.key === ' ' && slideshowEnabled && current?.media_type === 'image') {
              event.preventDefault()
              setPlaying((value) => !value)
            }
          }}
        >
          <div className='flex items-center gap-2 px-3 py-2 sm:px-5'>
            <div className='grid min-w-0 flex-1'>
              <DialogPrimitive.Title className='truncate text-sm font-bold'>
                {current?.title || current?.original_name || album.title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className='truncate text-xs text-viewer-muted'>
                {position + 1} of {count} · {album.title}
              </DialogPrimitive.Description>
            </div>
            {current?.media_type === 'image' && (
              <>
                <ViewerButton label='Zoom out' disabled={step === 0} onClick={() => zoomBy(-1)}>
                  <ZoomOut />
                </ViewerButton>
                <span className='tabular hidden w-10 text-center text-xs sm:inline'>
                  {Math.round(scale * 100)}%
                </span>
                <ViewerButton
                  label='Zoom in'
                  disabled={step === ZOOM_STEPS.length - 1}
                  onClick={() => zoomBy(1)}
                >
                  <ZoomIn />
                </ViewerButton>
              </>
            )}
            {slideshowEnabled && count > 1 && (
              <ViewerButton
                label={playing ? 'Pause slideshow' : 'Start slideshow'}
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? <Pause /> : <Play />}
              </ViewerButton>
            )}
            {current?.download_url && (
              <a
                href={current.download_url}
                download={current.original_name}
                aria-label='Download'
                className='grid size-9 place-items-center rounded-md hover:bg-viewer-foreground/10 focus-visible:ring-2 focus-visible:ring-viewer-foreground/60 focus-visible:outline-none'
              >
                <Download className='size-4' />
              </a>
            )}
            <DialogPrimitive.Close
              aria-label='Close viewer'
              className='grid size-9 place-items-center rounded-md hover:bg-viewer-foreground/10 focus-visible:ring-2 focus-visible:ring-viewer-foreground/60 focus-visible:outline-none'
            >
              <X className='size-5' />
            </DialogPrimitive.Close>
          </div>

          <div className='relative flex min-h-0 flex-1 items-center justify-center'>
            {count > 1 && (
              <button
                type='button'
                aria-label='Previous'
                onClick={() => go(-1)}
                className='absolute left-2 z-10 grid size-10 place-items-center rounded-full bg-viewer/60 hover:bg-viewer/80 focus-visible:ring-2 focus-visible:ring-viewer-foreground/60 focus-visible:outline-none sm:left-4'
              >
                <ChevronLeft className='size-6' />
              </button>
            )}
            <div
              className={cn(
                'flex size-full items-center justify-center p-2 sm:p-6',
                scale > 1 ? 'overflow-auto' : 'overflow-hidden'
              )}
            >
              {current?.media_type === 'video' ? (
                <video
                  key={current.id}
                  src={current.url}
                  poster={current.thumbnail_url ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  onError={onExpired}
                  className='max-h-full max-w-full rounded-md bg-viewer'
                />
              ) : current ? (
                <img
                  key={current.id}
                  src={current.url}
                  alt={current.title || current.original_name}
                  onError={onExpired}
                  onDoubleClick={() => zoomBy(step === 0 ? 1 : -step)}
                  style={{ transform: `scale(${scale})` }}
                  className={cn(
                    'max-h-full max-w-full origin-center object-contain transition-transform duration-200 select-none',
                    scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  )}
                />
              ) : null}
            </div>
            {count > 1 && (
              <button
                type='button'
                aria-label='Next'
                onClick={() => go(1)}
                className='absolute right-2 z-10 grid size-10 place-items-center rounded-full bg-viewer/60 hover:bg-viewer/80 focus-visible:ring-2 focus-visible:ring-viewer-foreground/60 focus-visible:outline-none sm:right-4'
              >
                <ChevronRight className='size-6' />
              </button>
            )}
          </div>

          {current && (
            <div className='grid gap-1 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-center sm:px-8'>
              {current.description && (
                <p className='mx-auto max-w-3xl text-sm text-viewer-foreground/90'>
                  {current.description}
                </p>
              )}
              <p className='text-xs text-viewer-muted'>
                Uploaded {formatDateTime(current.created_at)}
                {current.uploaded_by_name ? ` by ${current.uploaded_by_name}` : ''}
                {album.event_date ? ` · Event ${formatDate(album.event_date)}` : ''}
                {` · ${album.place}`}
              </p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ViewerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className='grid size-9 place-items-center rounded-md hover:bg-viewer-foreground/10 focus-visible:ring-2 focus-visible:ring-viewer-foreground/60 focus-visible:outline-none disabled:opacity-40 [&_svg]:size-4'
    >
      {children}
    </button>
  )
}
