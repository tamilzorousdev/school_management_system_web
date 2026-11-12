import type { ReactNode } from 'react'
import { Coffee, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BellPeriod, Slot } from '../api'
import { DAYS, slotKey } from '../labels'

export function WeekGrid({
  periods,
  days = DAYS.map((day) => day.value),
  slots,
  label,
  renderSlot,
  onCellClick,
}: {
  periods: BellPeriod[]
  days?: number[]
  slots: Slot[]
  label: string
  renderSlot: (slot: Slot) => ReactNode
  onCellClick?: (day: number, period: BellPeriod, slot: Slot | undefined) => void
}) {
  const byKey = new Map(slots.map((slot) => [slotKey(slot.day_of_week, slot.period_no), slot]))
  const dayRows = DAYS.filter((day) => days.includes(day.value))
  const breaks = periods.filter((period) => period.is_break || period.period_no === null)
  const teachingPeriods = periods.filter((period) => !period.is_break && period.period_no !== null)

  const isPeriodBeforeBreak = (period: BellPeriod) => {
    const idx = periods.findIndex((p) => p.id === period.id)
    if (idx < 0 || idx >= periods.length - 1) return null
    const next = periods[idx + 1]
    return next && (next.is_break || next.period_no === null) ? next : null
  }

  return (
    <div className='w-full overflow-hidden'>
      {breaks.length > 0 && (
        <div className='flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-2.5 text-xs'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Breaks & Lunch:
          </span>
          {breaks.map((b) => {
            const idx = periods.findIndex((p) => p.id === b.id)
            const prev = idx > 0 ? periods[idx - 1] : null
            return (
              <span
                key={b.id}
                className='inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-2xs'
              >
                <Coffee className='size-3.5 text-primary' />
                <span className='font-bold text-foreground'>{b.name}</span>
                <span className='tabular text-muted-foreground'>
                  {b.start_time}–{b.end_time}
                </span>
                {prev && !prev.is_break && (
                  <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground'>
                    After {prev.name}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      )}

      <div className='w-full overflow-x-auto'>
        <table
          aria-label={label}
          className='w-full min-w-full table-fixed border-separate border-spacing-0 text-sm'
        >
          <thead>
            <tr>
              <th
                scope='col'
                className='w-20 md:w-28 border-b border-r bg-card px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase'
              >
                Day
              </th>
              {teachingPeriods.map((period) => {
                const nextBreak = isPeriodBeforeBreak(period)
                return (
                  <th
                    key={period.id}
                    scope='col'
                    className={cn(
                      'border-b px-2 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase',
                      nextBreak && 'border-r-2 border-r-primary/20'
                    )}
                  >
                    <span className='grid min-w-0 gap-0.5'>
                      <span className='truncate text-xs font-bold text-foreground'>
                        {period.name}
                      </span>
                      <span className='tabular text-[10px] sm:text-[11px] font-normal text-muted-foreground whitespace-nowrap'>
                        {period.start_time}–{period.end_time}
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {dayRows.map((day) => (
              <tr key={day.value}>
                <th
                  scope='row'
                  className='border-b border-r bg-card px-3 py-2 text-left align-top'
                >
                  <span className='grid'>
                    <span className='text-xs font-bold text-foreground hidden sm:inline'>
                      {day.label}
                    </span>
                    <span className='text-xs font-bold text-foreground sm:hidden'>
                      {day.short}
                    </span>
                  </span>
                </th>
                {teachingPeriods.map((period) => {
                  const nextBreak = isPeriodBeforeBreak(period)
                  const slot = byKey.get(slotKey(day.value, period.period_no!))
                  const content = slot ? (
                    renderSlot(slot)
                  ) : (
                    <span className='flex h-full items-center gap-1 text-xs text-muted-foreground'>
                      {onCellClick ? (
                        <>
                          <Plus className='size-3 shrink-0' />
                          <span className='truncate'>Add</span>
                        </>
                      ) : (
                        'Free'
                      )}
                    </span>
                  )

                  return (
                    <td
                      key={period.id}
                      className={cn(
                        'border-b p-1 align-top',
                        nextBreak && 'border-r-2 border-r-primary/20'
                      )}
                    >
                      {onCellClick ? (
                        <button
                          type='button'
                          aria-label={`${day.label} ${period.name}${slot ? `: ${slot.subject.name}` : ', empty'}`}
                          onClick={() => onCellClick(day.value, period, slot)}
                          className={cn(
                            'grid h-full min-h-16 w-full content-start rounded-md border p-1.5 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 overflow-hidden',
                            slot
                              ? 'border-primary/25 bg-primary/5 hover:bg-primary/10'
                              : 'border-dashed hover:bg-muted'
                          )}
                        >
                          {content}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            'grid h-full min-h-16 content-start rounded-md border p-1.5 overflow-hidden',
                            slot ? 'border-primary/25 bg-primary/5' : 'border-dashed'
                          )}
                        >
                          {content}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SlotContent({
  title,
  code,
  lines,
}: {
  title: string
  code: string
  lines: (string | null)[]
}) {
  return (
    <span className='grid min-w-0 w-full gap-0.5 overflow-hidden text-left'>
      <span className='flex min-w-0 items-center gap-1'>
        <span className='shrink-0 font-mono text-[10px] font-bold text-primary'>{code}</span>
        <span className='truncate text-xs font-semibold'>{title}</span>
      </span>
      {lines.map(
        (line, index) =>
          line && (
            <span key={index} className='truncate text-[10px] text-muted-foreground'>
              {line}
            </span>
          )
      )}
    </span>
  )
}
