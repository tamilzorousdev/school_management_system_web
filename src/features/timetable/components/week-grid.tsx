import type { ReactNode } from 'react'
import { CalendarClock, Coffee, Plus } from 'lucide-react'
import type { SpecialClass } from '@/features/performance/api'
import { activeSpecials, specialDays } from '@/features/performance/special-week'
import { cn } from '@/lib/utils'
import type { BellPeriod, Slot } from '../api'
import { DAYS, slotKey } from '../labels'

export interface SpecialPrefill {
  days: number[]
  start_time: string
  end_time: string
}

const to12 = (time: string | null) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')}${hours >= 12 ? ' PM' : ' AM'}`
}

function SpecialChip({
  special,
  showSection,
  onOpen,
}: {
  special: SpecialClass
  showSection?: boolean
  onOpen?: (special: SpecialClass) => void
}) {
  const body = (
    <>
      <span className='flex items-center gap-1 text-[10px] font-bold text-warning uppercase'>
        <CalendarClock className='size-3' />
        {special.kind === 'special' ? 'Special' : 'Extra'}
        {special.timing === 'extra_time' && (
          <span className='font-semibold normal-case'>
            {to12(special.start_time)}–{to12(special.end_time)}
          </span>
        )}
      </span>
      <span className='truncate text-xs font-semibold text-foreground'>{special.title}</span>
      <span className='truncate text-[11px] text-muted-foreground'>
        {showSection ? `Class ${special.section.name}` : special.teacher.name}
        {special.kind === 'extra' ? ` · ${special.students.length} students` : ''}
      </span>
    </>
  )
  const className =
    'grid w-full min-w-0 rounded-md border border-warning/30 bg-warning/5 p-1.5 text-left'
  return onOpen ? (
    <button
      type='button'
      onClick={(event) => {
        event.stopPropagation()
        onOpen(special)
      }}
      className={cn(className, 'transition-colors hover:bg-warning/10')}
    >
      {body}
    </button>
  ) : (
    <span className={className}>{body}</span>
  )
}

export function WeekGrid({
  periods,
  days = DAYS.map((day) => day.value),
  slots,
  label,
  renderSlot,
  onCellClick,
  specials,
  showSection,
  sectionId,
  onAddSpecial,
  onOpenSpecial,
}: {
  periods: BellPeriod[]
  days?: number[]
  slots: Slot[]
  label: string
  renderSlot: (slot: Slot) => ReactNode
  onCellClick?: (day: number, period: BellPeriod, slot: Slot | undefined) => void
  specials?: SpecialClass[]
  showSection?: boolean
  sectionId?: number
  onAddSpecial?: (prefill: SpecialPrefill) => void
  onOpenSpecial?: (special: SpecialClass) => void
}) {
  const active = activeSpecials(specials ?? [])
  const periodSpecials = (day: number, periodNo: number) =>
    active.filter(
      (row) => row.timing === 'period' && row.day_of_week === day && row.period_no === periodNo
    )
  const daySpecials = (day: number) =>
    active
      .filter((row) => row.timing === 'extra_time' && specialDays(row).includes(day))
      .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
  const showExtra = Boolean(specials)
  const byKey = new Map(slots.map((slot) => [slotKey(slot.day_of_week, slot.period_no), slot]))
  const dayRows = DAYS.filter((day) => days.includes(day.value))
  const specialRows = periods.filter(
    (period) =>
      period.is_special &&
      (!sectionId || !period.section_ids?.length || period.section_ids.includes(sectionId))
  )
  const hiddenSpecial = (period?: BellPeriod) =>
    Boolean(period?.is_special && !specialRows.includes(period))
  const breaks = periods.filter(
    (period, index) =>
      !period.is_special &&
      (period.is_break || period.period_no === null) &&
      !hiddenSpecial(periods[index - 1]) &&
      !hiddenSpecial(periods[index + 1])
  )
  const inRow = (special: SpecialClass, row: BellPeriod) =>
    Boolean(special.start_time && special.end_time) &&
    special.start_time! < row.end_time &&
    row.start_time < special.end_time!
  const teachingPeriods = periods.filter((period) => !period.is_break && period.period_no !== null)
  const sundays = daySpecials(0)

  const lastPeriod = teachingPeriods[teachingPeriods.length - 1]

  const firstStart = teachingPeriods[0]?.start_time ?? '00:00'
  const morning = specialRows.filter((row) => row.start_time < firstStart)
  const evening = specialRows.filter((row) => row.start_time >= firstStart)
  const specialHead = (row: BellPeriod) => (
    <th
      key={row.id}
      scope='col'
      className='w-36 border-b border-l-2 border-l-warning/30 bg-warning/10 px-2 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase'
    >
      <span className='grid min-w-0 gap-0.5'>
        <span className='truncate text-xs font-bold text-warning'>{row.name}</span>
        <span className='tabular text-[10px] font-normal whitespace-nowrap'>
          {row.start_time}–{row.end_time}
        </span>
      </span>
    </th>
  )
  const specialCell = (row: BellPeriod, day: (typeof DAYS)[number]) => (
    <td
      key={row.id}
      className='border-b border-l-2 border-l-warning/30 bg-warning/[0.05] p-1 align-top'
    >
      <div className='grid gap-1'>
        {daySpecials(day.value)
          .filter((special) => inRow(special, row))
          .map((special) => (
            <SpecialChip
              key={special.id}
              special={special}
              showSection={showSection}
              onOpen={onOpenSpecial}
            />
          ))}
        {onAddSpecial && (
          <button
            type='button'
            onClick={() =>
              onAddSpecial({
                days: [day.value],
                start_time: row.start_time,
                end_time: row.end_time,
              })
            }
            aria-label={`Add a special class on ${day.label} at ${row.start_time}`}
            className='flex min-h-9 items-center gap-1 rounded-md border border-dashed border-warning/40 px-1.5 text-xs text-warning hover:bg-warning/10'
          >
            <Plus className='size-3 shrink-0' />
            <span className='truncate'>Add</span>
          </button>
        )}
      </div>
    </td>
  )

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
                className='w-20 border-r border-b bg-card px-3 py-2 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase md:w-28'
              >
                Day
              </th>
              {showExtra && morning.map((row) => specialHead(row))}
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
                      <span className='tabular text-[10px] font-normal whitespace-nowrap text-muted-foreground sm:text-[11px]'>
                        {period.start_time}–{period.end_time}
                      </span>
                    </span>
                  </th>
                )
              })}
              {showExtra && evening.map((row) => specialHead(row))}
            </tr>
          </thead>
          <tbody>
            {dayRows.map((day) => (
              <tr key={day.value}>
                <th scope='row' className='border-r border-b bg-card px-3 py-2 text-left align-top'>
                  <span className='grid'>
                    <span className='hidden text-xs font-bold text-foreground sm:inline'>
                      {day.label}
                    </span>
                    <span className='text-xs font-bold text-foreground sm:hidden'>{day.short}</span>
                  </span>
                </th>
                {showExtra && morning.map((row) => specialCell(row, day))}
                {teachingPeriods.map((period) => {
                  const nextBreak = isPeriodBeforeBreak(period)
                  const slot = byKey.get(slotKey(day.value, period.period_no!))
                  const inPeriod = showExtra ? periodSpecials(day.value, period.period_no!) : []
                  const content = slot ? (
                    <>
                      {renderSlot(slot)}
                      {inPeriod.map((special) => (
                        <SpecialChip key={special.id} special={special} showSection={showSection} />
                      ))}
                    </>
                  ) : inPeriod.length ? (
                    <span className='grid gap-1'>
                      {inPeriod.map((special) => (
                        <SpecialChip key={special.id} special={special} showSection={showSection} />
                      ))}
                    </span>
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
                            'grid h-full min-h-16 w-full content-start overflow-hidden rounded-md border p-1.5 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
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
                            'grid h-full min-h-16 content-start overflow-hidden rounded-md border p-1.5',
                            slot ? 'border-primary/25 bg-primary/5' : 'border-dashed'
                          )}
                        >
                          {content}
                        </div>
                      )}
                    </td>
                  )
                })}
                {showExtra && evening.map((row) => specialCell(row, day))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showExtra && (sundays.length > 0 || onAddSpecial) && (
        <div className='flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-2.5'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Sunday:
          </span>
          {sundays.map((special) => (
            <span key={special.id} className='w-56'>
              <SpecialChip special={special} showSection={showSection} onOpen={onOpenSpecial} />
            </span>
          ))}
          {!sundays.length && (
            <span className='text-xs text-muted-foreground'>No special class</span>
          )}
          {onAddSpecial && (
            <button
              type='button'
              onClick={() =>
                onAddSpecial({
                  days: [0],
                  start_time: teachingPeriods[0]?.start_time ?? '09:00',
                  end_time: lastPeriod?.end_time ?? '16:00',
                })
              }
              className='inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:bg-muted'
            >
              <Plus className='size-3' />
              Sunday class
            </button>
          )}
        </div>
      )}
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
    <span className='grid w-full min-w-0 gap-0.5 overflow-hidden text-left'>
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
