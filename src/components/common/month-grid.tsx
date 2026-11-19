import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  WEEKDAYS,
  dayTitle,
  leadingBlanks,
  monthDays,
  monthTitle,
  shiftMonth,
} from '@/lib/calendar'
import { cn } from '@/lib/utils'

export type MonthGridTone = 'primary' | 'success' | 'warning' | 'danger' | 'muted'

export interface MonthGridItem {
  key: string
  date: string
  label: string
  hint?: string
  tone: MonthGridTone
  onClick?: () => void
}

const TONE: Record<MonthGridTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/10 text-destructive line-through',
  muted: 'bg-muted text-muted-foreground',
}

const VISIBLE = 3

export function MonthGrid({
  month,
  today,
  items,
  loading,
  onMonthChange,
  onDayClick,
  emptyText = 'Nothing this month',
}: {
  month: string
  today: string
  items: MonthGridItem[]
  loading?: boolean
  onMonthChange: (month: string) => void
  onDayClick?: (date: string) => void
  emptyText?: string
}) {
  const byDay = new Map<string, MonthGridItem[]>()
  for (const item of items) byDay.set(item.date, [...(byDay.get(item.date) ?? []), item])
  const days = monthDays(month)
  const busyDays = days.filter((day) => byDay.has(day))

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1'>
          <Button
            size='icon'
            variant='ghost'
            aria-label='Previous month'
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <h2 className='min-w-36 text-center text-base font-bold' aria-live='polite'>
            {monthTitle(month)}
          </h2>
          <Button
            size='icon'
            variant='ghost'
            aria-label='Next month'
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <Button
          size='sm'
          variant='outline'
          disabled={month === today.slice(0, 7)}
          onClick={() => onMonthChange(today.slice(0, 7))}
        >
          Today
        </Button>
      </div>

      <div className={cn('hidden md:block', loading && 'opacity-60')}>
        <div className='grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border'>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className='bg-muted/50 px-2 py-1.5 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase'
            >
              {day}
            </div>
          ))}
          {Array.from({ length: leadingBlanks(month) }, (_, index) => (
            <div key={`blank-${index}`} className='min-h-24 bg-muted/20' />
          ))}
          {days.map((day) => {
            const list = byDay.get(day) ?? []
            const isToday = day === today
            return (
              <div
                key={day}
                className={cn(
                  'grid min-h-24 content-start gap-1 bg-card p-1.5',
                  onDayClick && 'cursor-pointer hover:bg-muted/40'
                )}
                onClick={onDayClick ? () => onDayClick(day) : undefined}
              >
                <span
                  className={cn(
                    'tabular grid size-6 place-items-center rounded-full text-xs font-semibold',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {Number(day.slice(8))}
                </span>
                {list.slice(0, VISIBLE).map((item) => (
                  <Chip key={item.key} item={item} />
                ))}
                {list.length > VISIBLE && (
                  <span className='px-1 text-[11px] font-semibold text-muted-foreground'>
                    +{list.length - VISIBLE} more
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={cn('grid gap-2 md:hidden', loading && 'opacity-60')}>
        {busyDays.length === 0 ? (
          <p className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
            {emptyText}
          </p>
        ) : (
          busyDays.map((day) => (
            <div key={day} className='grid gap-1.5 rounded-lg border p-3'>
              <span
                className={cn(
                  'text-xs font-bold',
                  day === today ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {dayTitle(day)}
                {day === today ? ' · Today' : ''}
              </span>
              {(byDay.get(day) ?? []).map((item) => (
                <Chip key={item.key} item={item} wide />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Chip({ item, wide = false }: { item: MonthGridItem; wide?: boolean }) {
  const content = (
    <>
      <span className='truncate font-semibold'>{item.label}</span>
      {item.hint && <span className='truncate opacity-80'>{item.hint}</span>}
    </>
  )
  const className = cn(
    'grid min-w-0 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight',
    wide && 'py-1.5 text-sm',
    TONE[item.tone]
  )
  if (!item.onClick) return <span className={className}>{content}</span>
  return (
    <button
      type='button'
      className={cn(className, 'hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring')}
      onClick={(event) => {
        event.stopPropagation()
        item.onClick?.()
      }}
    >
      {content}
    </button>
  )
}
