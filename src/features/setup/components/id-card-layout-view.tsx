import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { QrCode, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  cardWidthPt,
  ID_CARD_LAYOUT_LABELS,
  ID_CARD_PREVIEW,
  ID_CARD_SAMPLE,
  type IdCardLayoutItem,
  type IdCardLayoutKey,
} from '@/lib/id-card-layout'

type Mode = 'move' | 'se' | 'e' | 's'

interface Drag {
  key: IdCardLayoutKey
  mode: Mode
  startX: number
  startY: number
  width: number
  height: number
  origin: Pick<IdCardLayoutItem, 'x' | 'y' | 'w' | 'h'>
}

interface IdCardLayoutViewProps {
  imageUrl: string
  items: IdCardLayoutItem[]
  editable?: boolean
  selected?: IdCardLayoutKey | null
  onSelect?: (key: IdCardLayoutKey | null) => void
  onChange?: (key: IdCardLayoutKey, patch: Partial<IdCardLayoutItem>) => void
  onLandscape?: (landscape: boolean) => void
  className?: string
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const round = (value: number) => Math.round(value * 10000) / 10000

export function IdCardLayoutView({
  imageUrl,
  items,
  editable = false,
  selected = null,
  onSelect,
  onChange,
  onLandscape,
  className,
}: IdCardLayoutViewProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [width, setWidth] = useState(0)
  const [landscape, setLandscape] = useState(true)

  useEffect(() => {
    const node = boxRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const pxPerPt = width / cardWidthPt(landscape)

  const start = (event: ReactPointerEvent, item: IdCardLayoutItem, mode: Mode) => {
    if (!editable) return
    event.stopPropagation()
    event.preventDefault()
    onSelect?.(item.key)
    const target = event.currentTarget as HTMLElement
    const card = target.closest('[data-id-card]')
    if (!card) return
    target.setPointerCapture(event.pointerId)
    const rect = card.getBoundingClientRect()
    setDrag({
      key: item.key,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height,
      origin: { x: item.x, y: item.y, w: item.w, h: item.h },
    })
  }

  const move = (event: ReactPointerEvent) => {
    if (!drag) return
    const dx = (event.clientX - drag.startX) / drag.width
    const dy = (event.clientY - drag.startY) / drag.height
    const { origin } = drag
    if (drag.mode === 'move') {
      onChange?.(drag.key, {
        x: round(clamp(origin.x + dx, 0, 1 - origin.w)),
        y: round(clamp(origin.y + dy, 0, 1 - origin.h)),
      })
      return
    }
    onChange?.(drag.key, {
      ...(drag.mode !== 's' ? { w: round(clamp(origin.w + dx, 0.02, 1 - origin.x)) } : {}),
      ...(drag.mode !== 'e' ? { h: round(clamp(origin.h + dy, 0.02, 1 - origin.y)) } : {}),
    })
  }

  const end = () => {
    setDrag(null)
  }

  const handlers = { onPointerMove: move, onPointerUp: end, onPointerCancel: end }

  return (
    <div
      ref={boxRef}
      data-id-card=''
      className={cn(
        'relative w-full overflow-hidden rounded-lg shadow-md ring-1 ring-border',
        className
      )}
      onPointerDown={() => editable && onSelect?.(null)}
    >
      <img
        src={imageUrl}
        alt='ID card design'
        draggable={false}
        className='block h-auto w-full select-none'
        onLoad={(event) => {
          const next = event.currentTarget.naturalWidth > event.currentTarget.naturalHeight
          setLandscape(next)
          onLandscape?.(next)
        }}
      />
      {items.map((item) => {
        const active = editable && item.key === selected
        return (
          <div
            key={item.key}
            role={editable ? 'button' : undefined}
            aria-label={editable ? ID_CARD_LAYOUT_LABELS[item.key] : undefined}
            title={editable ? ID_CARD_LAYOUT_LABELS[item.key] : undefined}
            onPointerDown={(event) => start(event, item, 'move')}
            {...handlers}
            className={cn(
              'absolute flex touch-none overflow-hidden',
              editable && 'cursor-move outline-1 outline-primary/70 outline-dashed',
              active && 'z-10 outline-2 outline-primary outline-solid'
            )}
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${item.w * 100}%`,
              height: `${item.h * 100}%`,
            }}
          >
            <ItemPreview item={item} pxPerPt={pxPerPt} />
            {active &&
              (['e', 's', 'se'] as const).map((mode) => (
                <span
                  key={mode}
                  onPointerDown={(event) => start(event, item, mode)}
                  {...handlers}
                  className={cn(
                    'absolute size-3.5 touch-none rounded-sm border-2 border-primary bg-card',
                    mode === 'e' && 'top-1/2 right-0 -translate-y-1/2 cursor-ew-resize',
                    mode === 's' && 'bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize',
                    mode === 'se' && 'right-0 bottom-0 cursor-nwse-resize'
                  )}
                />
              ))}
          </div>
        )
      })}
    </div>
  )
}

function ItemPreview({ item, pxPerPt }: { item: IdCardLayoutItem; pxPerPt: number }) {
  if (item.key === 'photo' || item.key === 'qr') {
    const Icon = item.key === 'photo' ? UserRound : QrCode
    return (
      <span
        className='flex size-full items-center justify-center'
        style={{
          background: item.key === 'photo' ? ID_CARD_PREVIEW.photo : ID_CARD_PREVIEW.qrBackground,
          color: item.key === 'photo' ? ID_CARD_PREVIEW.photoText : ID_CARD_PREVIEW.qr,
        }}
      >
        <Icon className='size-1/2' />
      </span>
    )
  }
  return (
    <span
      className='flex size-full items-center leading-tight'
      style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: Math.max(4, item.font_size * pxPerPt),
        fontWeight: item.bold ? 700 : 400,
        color: item.color,
        justifyContent:
          item.align === 'center' ? 'center' : item.align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: item.align,
      }}
    >
      {ID_CARD_SAMPLE[item.key]}
    </span>
  )
}
