import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type InsightTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface Insight {
  key: string
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  tone?: InsightTone
  active?: boolean
  onClick?: () => void
}

const tones: Record<InsightTone, { icon: string; ring: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', ring: 'ring-primary/40 border-primary/50' },
  success: { icon: 'bg-success/10 text-success', ring: 'ring-success/40 border-success/50' },
  warning: { icon: 'bg-warning/10 text-warning', ring: 'ring-warning/40 border-warning/50' },
  danger: {
    icon: 'bg-destructive/10 text-destructive',
    ring: 'ring-destructive/40 border-destructive/50',
  },
  info: { icon: 'bg-info/10 text-info', ring: 'ring-info/40 border-info/50' },
  neutral: { icon: 'bg-muted text-muted-foreground', ring: 'ring-ring/40 border-ring/50' },
}

const HEADER_OFFSET = 80

function scrollToResults(cards: HTMLElement | null) {
  let from: HTMLElement | null = cards
  while (from && !from.nextElementSibling && from.tagName !== 'MAIN') from = from.parentElement
  const target = from?.nextElementSibling
  if (!(target instanceof HTMLElement)) return
  window.setTimeout(() => {
    if (!target.isConnected) return
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, 120)
}

export function InsightCards({ items, loading }: { items: Insight[]; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3',
        items.length === 5 && 'lg:grid-cols-3 min-[1400px]:grid-cols-5'
      )}
    >
      {items.map((item) => {
        const tone = tones[item.tone ?? 'primary']
        const interactive = Boolean(item.onClick)
        const Tag = interactive ? 'button' : 'div'
        return (
          <Tag
            key={item.key}
            type={interactive ? 'button' : undefined}
            onClick={
              item.onClick
                ? () => {
                    item.onClick?.()
                    scrollToResults(ref.current)
                  }
                : undefined
            }
            aria-pressed={interactive ? Boolean(item.active) : undefined}
            className={cn(
              'group flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left shadow-xs transition-[box-shadow,border-color]',
              interactive &&
                'cursor-pointer outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40',
              item.active && cn('ring-2', tone.ring)
            )}
          >
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', tone.icon)}>
              <item.icon className='size-4' />
            </span>
            <span className='grid min-w-0 flex-1 gap-0.5'>
              <span className='truncate text-xs leading-tight font-semibold text-muted-foreground'>
                {item.label}
              </span>
              <span className='flex min-w-0 items-baseline gap-2'>
                {loading ? (
                  <Skeleton className='h-6 w-12' />
                ) : (
                  <span className='tabular text-xl leading-tight font-extrabold tracking-tight'>
                    {item.value}
                  </span>
                )}
                {item.hint && (
                  <span className='hidden truncate text-[11px] text-muted-foreground sm:inline'>
                    {item.active ? 'Showing these · click to clear' : item.hint}
                  </span>
                )}
              </span>
            </span>
          </Tag>
        )
      })}
    </div>
  )
}
