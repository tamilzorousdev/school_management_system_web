import type { ReactNode } from 'react'
import { CalendarClock, Coffee, MapPin, Plus, UserRound } from 'lucide-react'
import type { SpecialClass } from '@/features/performance/api'
import { activeSpecials, specialDays } from '@/features/performance/special-week'
import { cn } from '@/lib/utils'
import type { BellPeriod, Slot } from '../api'
import { DAYS, getSubjectTone, slotKey } from '../labels'

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
      <span className='flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase'>
        <CalendarClock className='size-3 shrink-0' />
        {special.kind === 'special' ? 'Special' : 'Extra'}
        {special.timing === 'extra_time' && (
          <span className='font-semibold normal-case'>
            {to12(special.start_time)}–{to12(special.end_time)}
          </span>
        )}
      </span>
      <span className='truncate text-xs font-bold text-foreground'>{special.title}</span>
      <span className='truncate text-[11px] text-muted-foreground'>
        {showSection ? `Class ${special.section.name}` : special.teacher.name}
        {special.kind === 'extra' ? ` · ${special.students.length} students` : ''}
      </span>
    </>
  )
  const className =
    'grid w-full min-w-0 rounded-lg border border-amber-400/50 bg-amber-500/[0.08] dark:bg-amber-500/[0.14] p-2 text-left shadow-2xs'
  return onOpen ? (
    <button
      type='button'
      onClick={(event) => {
        event.stopPropagation()
        onOpen(special)
      }}
      className={cn(className, 'transition-all hover:bg-amber-500/[0.15] hover:border-amber-400')}
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
  const teachingPeriods = periods.filter((period) => !period.is_break && period.period_no !== null)
  const sundays = daySpecials(0)

  const lastPeriod = teachingPeriods[teachingPeriods.length - 1]

  const firstStart = teachingPeriods[0]?.start_time ?? '00:00'
  const morning = specialRows.filter((row) => row.start_time < firstStart)
  const evening = specialRows.filter((row) => row.start_time >= firstStart)
  const morningSpecials = active.filter(
    (row) => row.timing === 'extra_time' && (row.start_time ?? '') < firstStart
  )
  const eveningSpecials = active.filter(
    (row) => row.timing === 'extra_time' && (row.start_time ?? '') >= firstStart
  )

  const isPeriodBeforeBreak = (period: BellPeriod) => {
    const idx = periods.findIndex((p) => p.id === period.id)
    if (idx < 0 || idx >= periods.length - 1) return null
    const next = periods[idx + 1]
    return next && (next.is_break || next.period_no === null) ? next : null
  }

  return (
    <div className='w-full overflow-hidden'>
      {/* Special Classes Ribbon (Morning & Evening at the top) */}
      {showExtra &&
        (morning.length > 0 ||
          morningSpecials.length > 0 ||
          evening.length > 0 ||
          eveningSpecials.length > 0) && (
          <div className='flex flex-col divide-y divide-amber-400/25 border-b bg-amber-500/[0.08] dark:bg-amber-500/[0.14] text-xs'>
            {/* Morning Special Classes */}
            {(morning.length > 0 || morningSpecials.length > 0) && (
              <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300'>
                    <span className='text-sm'>🌅</span>
                    <span className='text-[11px] font-extrabold uppercase tracking-wider'>
                      Morning Special (Before 9 AM):
                    </span>
                  </span>
                  {morningSpecials.map((special) => (
                    <span key={special.id} className='max-w-xs'>
                      <SpecialChip special={special} showSection={showSection} onOpen={onOpenSpecial} />
                    </span>
                  ))}
                  {morningSpecials.length === 0 && (
                    <span className='text-xs text-muted-foreground'>
                      {morning.map((m) => `${m.name} (${m.start_time}–${m.end_time})`).join(', ')}
                    </span>
                  )}
                </div>
                {onAddSpecial && morning[0] && (
                  <button
                    type='button'
                    onClick={() =>
                      onAddSpecial({
                        days: [1, 2, 3, 4, 5],
                        start_time: morning[0]?.start_time ?? '07:30',
                        end_time: morning[morning.length - 1]?.end_time ?? '08:45',
                      })
                    }
                    className='inline-flex items-center gap-1 rounded-md border border-amber-400/60 bg-card px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-2xs hover:bg-amber-500/10 dark:text-amber-300'
                  >
                    <Plus className='size-3' />
                    Add Morning Class
                  </button>
                )}
              </div>
            )}

            {/* Evening Special Classes */}
            {(evening.length > 0 || eveningSpecials.length > 0) && (
              <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300'>
                    <span className='text-sm'>🌇</span>
                    <span className='text-[11px] font-extrabold uppercase tracking-wider'>
                      Evening Special (After School):
                    </span>
                  </span>
                  {eveningSpecials.map((special) => (
                    <span key={special.id} className='max-w-xs'>
                      <SpecialChip special={special} showSection={showSection} onOpen={onOpenSpecial} />
                    </span>
                  ))}
                  {eveningSpecials.length === 0 && (
                    <span className='text-xs text-muted-foreground'>
                      {evening.map((e) => `${e.name} (${e.start_time}–${e.end_time})`).join(', ')}
                    </span>
                  )}
                </div>
                {onAddSpecial && evening[0] && (
                  <button
                    type='button'
                    onClick={() =>
                      onAddSpecial({
                        days: [1, 2, 3, 4, 5],
                        start_time: evening[0]?.start_time ?? '15:45',
                        end_time: evening[evening.length - 1]?.end_time ?? '17:00',
                      })
                    }
                    className='inline-flex items-center gap-1 rounded-md border border-amber-400/60 bg-card px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-2xs hover:bg-amber-500/10 dark:text-amber-300'
                  >
                    <Plus className='size-3' />
                    Add Evening Class
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      {/* Breaks & Lunch Bar */}
      {breaks.length > 0 && (
        <div className='flex flex-wrap items-center gap-2 border-b border-[#C6CEC9] bg-muted/30 px-4 py-2 text-xs dark:border-slate-700'>
          <span className='inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            <Coffee className='size-3.5 text-amber-500' />
            Breaks & Lunch:
          </span>
          {breaks.map((b) => {
            const idx = periods.findIndex((p) => p.id === b.id)
            const prev = idx > 0 ? periods[idx - 1] : null
            return (
              <span
                key={b.id}
                className='inline-flex items-center gap-1.5 rounded-full border border-[#C6CEC9] bg-card px-3 py-0.5 text-xs font-medium shadow-2xs dark:border-slate-700'
              >
                <span className='size-1.5 rounded-full bg-amber-500' />
                <span className='font-bold text-foreground'>{b.name}</span>
                <span className='tabular font-semibold text-muted-foreground'>
                  {b.start_time}–{b.end_time}
                </span>
                {prev && !prev.is_break && (
                  <span className='rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground'>
                    After {prev.name}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Core Timetable Grid (Fits Screen 100%) */}
      <div className='w-full overflow-x-auto'>
        <table
          aria-label={label}
          className='w-full min-w-full border-separate border-spacing-0 text-sm'
        >
          <thead>
            <tr>
              <th
                scope='col'
                className='sticky left-0 z-20 w-28 min-w-[6.5rem] border-r border-b border-[#C6CEC9] bg-card px-3.5 py-2.5 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] dark:border-slate-700'
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
                      'border-b border-r border-[#C6CEC9] last:border-r-0 bg-card/60 px-2.5 py-2 text-center text-[11px] font-bold tracking-wider uppercase min-w-[6.75rem] md:min-w-[7.5rem] dark:border-slate-700',
                      nextBreak && 'border-r-2 border-r-amber-500/60 dark:border-r-amber-500/50'
                    )}
                  >
                    <div className='grid min-w-0 justify-items-center gap-0.5 overflow-hidden'>
                      <span className='truncate text-xs font-bold text-foreground'>
                        {period.name}
                      </span>
                      <span className='tabular text-[10px] font-semibold whitespace-nowrap text-muted-foreground'>
                        {period.start_time}–{period.end_time}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {dayRows.map((day) => {
              const currentDayOfWeek = new Date().getDay()
              const isToday = currentDayOfWeek === day.value
              return (
                <tr key={day.value} className={isToday ? 'bg-primary/[0.02]' : undefined}>
                  <th
                    scope='row'
                    className={cn(
                      'sticky left-0 z-10 w-28 min-w-[6.5rem] border-r border-b border-[#C6CEC9] px-3.5 py-2.5 text-center align-middle transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] dark:border-slate-700',
                      isToday
                        ? 'border-r-2 border-r-primary bg-primary/[0.06]'
                        : 'bg-card'
                    )}
                  >
                    <div className='flex flex-col items-center justify-center gap-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='hidden text-xs font-bold text-foreground sm:inline'>
                          {day.label}
                        </span>
                        <span className='text-xs font-bold text-foreground sm:hidden'>
                          {day.short}
                        </span>
                      </div>
                      {isToday && (
                        <span className='w-fit rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-black text-primary-foreground uppercase tracking-wider shadow-2xs'>
                          Today
                        </span>
                      )}
                    </div>
                  </th>
                  {teachingPeriods.map((period) => {
                    const nextBreak = isPeriodBeforeBreak(period)
                    const slot = byKey.get(slotKey(day.value, period.period_no!))
                    const inPeriod = showExtra ? periodSpecials(day.value, period.period_no!) : []
                    const tone = slot ? getSubjectTone(slot.subject.name, slot.subject.code) : null

                    const content = slot ? (
                      <>
                        {renderSlot(slot)}
                        {inPeriod.map((special) => (
                          <SpecialChip
                            key={special.id}
                            special={special}
                            showSection={showSection}
                          />
                        ))}
                      </>
                    ) : inPeriod.length ? (
                      <span className='grid gap-1'>
                        {inPeriod.map((special) => (
                          <SpecialChip
                            key={special.id}
                            special={special}
                            showSection={showSection}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className='flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-muted-foreground/60 transition-colors group-hover:text-primary'>
                        {onCellClick ? (
                          <>
                            <Plus className='size-3.5 shrink-0 opacity-60 transition-transform group-hover:scale-110 group-hover:opacity-100' />
                            <span className='text-[10px] font-semibold tracking-wide'>
                              Add period
                            </span>
                          </>
                        ) : (
                          <span className='text-[11px] font-medium'>Free</span>
                        )}
                      </span>
                    )

                    return (
                      <td
                        key={period.id}
                        className={cn(
                          'border-b border-r border-[#C6CEC9] last:border-r-0 p-1.5 align-top min-w-[6.75rem] md:min-w-[7.5rem] dark:border-slate-700',
                          nextBreak && 'border-r-2 border-r-amber-500/60 dark:border-r-amber-500/50'
                        )}
                      >
                        {onCellClick ? (
                          <button
                            type='button'
                            aria-label={`${day.label} ${period.name}${slot ? `: ${slot.subject.name}` : ', empty'}`}
                            onClick={() => onCellClick(day.value, period, slot)}
                            className={cn(
                              'group relative grid h-full min-h-[4.5rem] w-full content-start overflow-hidden rounded-xl border p-1.5 text-left transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                              slot
                                ? cn('border-l-[4px] shadow-2xs hover:shadow-xs hover:brightness-[0.98] dark:hover:brightness-[1.08]', tone?.border, tone?.bg)
                                : 'border-dashed border-[#9AA49F] bg-card hover:border-primary hover:bg-muted/40 dark:border-slate-600'
                            )}
                          >
                            {content}
                          </button>
                        ) : (
                          <div
                            className={cn(
                              'grid h-full min-h-[4.5rem] content-start overflow-hidden rounded-xl border p-1.5 shadow-2xs',
                              slot
                                ? cn('border-l-[4px]', tone?.border, tone?.bg)
                                : 'border-dashed border-[#9AA49F] bg-card dark:border-slate-600'
                            )}
                          >
                            {content}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {showExtra && (sundays.length > 0 || onAddSpecial) && (
        <div className='flex flex-wrap items-center gap-2 border-t border-[#C6CEC9] bg-muted/20 px-4 py-2.5 dark:border-slate-700'>
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
              className='inline-flex items-center gap-1 rounded-full border border-dashed border-[#9AA49F] px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:bg-muted dark:border-slate-600'
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
  lines = [],
}: {
  title: string
  code: string
  lines?: (string | null)[]
}) {
  const tone = getSubjectTone(title, code)
  return (
    <div className='flex h-full w-full min-w-0 flex-col justify-between gap-1 overflow-hidden text-left'>
      <div className='flex items-start justify-between gap-1'>
        <span className={cn('truncate text-xs font-bold leading-snug', tone.text)}>
          {title}
        </span>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
            tone.badge
          )}
        >
          {code}
        </span>
      </div>
      <div className='flex flex-col gap-0.5 text-[11px] text-muted-foreground min-w-0'>
        {lines.map(
          (line, index) =>
            line && (
              <span
                key={index}
                className='inline-flex items-center gap-1 truncate font-medium text-foreground/80'
              >
                {index === 0 && <UserRound className='size-2.5 shrink-0 opacity-60' />}
                {index === 1 && <MapPin className='size-2.5 shrink-0 opacity-60' />}
                <span className='truncate'>{line}</span>
              </span>
            )
        )}
      </div>
    </div>
  )
}
