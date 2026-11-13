import * as React from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  id?: string
  name?: string
  value?: string // 'YYYY-MM-DD'
  defaultValue?: string
  onChange?:
    | ((value: string) => void)
    | ((value: string, e: React.ChangeEvent<HTMLInputElement>) => void)
    | ((e: React.ChangeEvent<HTMLInputElement>) => void)
  min?: string // 'YYYY-MM-DD'
  max?: string // 'YYYY-MM-DD'
  placeholder?: string
  disabled?: boolean
  className?: string
  invalid?: boolean
  required?: boolean
  align?: 'start' | 'center' | 'end'
  size?: 'default' | 'sm'
  clearable?: boolean
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDate(iso?: string | null): { year: number; month: number; day: number } | null {
  if (!iso || typeof iso !== 'string') return null
  const cleaned = iso.slice(0, 10)
  const parts = cleaned.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null
  return { year: y, month: m - 1, day: d }
}

function toIso(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0')
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(iso?: string | null): string {
  const p = parseDate(iso)
  if (!p) return ''
  return `${String(p.day).padStart(2, '0')} ${MONTH_SHORT[p.month]} ${p.year}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay()
}

export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  className,
  invalid = false,
  required = false,
  align = 'start',
  size = 'default',
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Controlled or uncontrolled value
  const selectedIso = value !== undefined ? value || '' : defaultValue || ''
  const selectedParsed = React.useMemo(() => parseDate(selectedIso), [selectedIso])

  const today = React.useMemo(() => {
    const d = new Date()
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()),
    }
  }, [])

  // Explicit user navigation state (when browsing away from selected date)
  const [navYear, setNavYear] = React.useState<number | null>(null)
  const [navMonth, setNavMonth] = React.useState<number | null>(null)

  const viewYear = navYear ?? selectedParsed?.year ?? today.year
  const viewMonth = navMonth ?? selectedParsed?.month ?? today.month

  // Current view: 'days' | 'months' | 'years'
  const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>('days')

  const minParsed = React.useMemo(() => parseDate(min), [min])
  const maxParsed = React.useMemo(() => parseDate(max), [max])

  const isDateDisabled = (y: number, m: number, d: number) => {
    const iso = toIso(y, m, d)
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  const isMonthDisabled = (monthIdx: number) => {
    if (
      minParsed &&
      (viewYear < minParsed.year || (viewYear === minParsed.year && monthIdx < minParsed.month))
    ) {
      return true
    }
    if (
      maxParsed &&
      (viewYear > maxParsed.year || (viewYear === maxParsed.year && monthIdx > maxParsed.month))
    ) {
      return true
    }
    return false
  }

  const isYearDisabled = (yr: number) => {
    if (minParsed && yr < minParsed.year) return true
    if (maxParsed && yr > maxParsed.year) return true
    return false
  }

  // Reset to days view whenever popover opens or closes
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return
    setOpen(newOpen)
    if (newOpen) {
      setViewMode('days')
      setNavYear(selectedParsed?.year ?? today.year)
      setNavMonth(selectedParsed?.month ?? today.month)
    } else {
      setNavYear(null)
      setNavMonth(null)
    }
  }

  const triggerChange = (newIso: string) => {
    if (!onChange) return
    const eventLike = {
      target: { value: newIso, id, name },
      currentTarget: { value: newIso, id, name },
      type: 'change',
      toString: () => newIso,
    } as unknown as React.ChangeEvent<HTMLInputElement>

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(onChange as any)(newIso, eventLike)
    } catch (err) {
      if (err instanceof TypeError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(onChange as any)(eventLike)
      } else {
        throw err
      }
    }
  }

  const handleSelectDay = (year: number, month: number, day: number) => {
    const iso = toIso(year, month, day)
    triggerChange(iso)
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    triggerChange('')
  }

  const handleToday = () => {
    if (isDateDisabled(today.year, today.month, today.day)) return
    triggerChange(today.iso)
    setNavYear(today.year)
    setNavMonth(today.month)
    setOpen(false)
  }

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setNavMonth(11)
      setNavYear(viewYear - 1)
    } else {
      setNavMonth(viewMonth - 1)
      setNavYear(viewYear)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setNavMonth(0)
      setNavYear(viewYear + 1)
    } else {
      setNavMonth(viewMonth + 1)
      setNavYear(viewYear)
    }
  }

  // Year decade navigation
  const decadeStart = Math.floor(viewYear / 12) * 12
  const decadeYears = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  // Generate calendar days
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const daysInPrevMonth = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  )

  const calendarCells = React.useMemo(() => {
    const cells: { year: number; month: number; day: number; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1
      cells.push({
        year: prevY,
        month: prevM,
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        year: viewYear,
        month: viewMonth,
        day: d,
        isCurrentMonth: true,
      })
    }

    // Next month padding to fill 42 cells (6 rows)
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1
      cells.push({
        year: nextY,
        month: nextM,
        day: d,
        isCurrentMonth: false,
      })
    }

    return cells
  }, [viewYear, viewMonth, daysInMonth, firstDay, daysInPrevMonth])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          id={id}
          name={name}
          disabled={disabled}
          data-slot='date-picker'
          className={cn(
            'group relative flex w-full min-w-0 items-center justify-between rounded-md border border-input bg-card px-3 text-left text-sm shadow-xs transition-all outline-none select-none',
            'hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
            disabled && 'cursor-not-allowed opacity-50',
            invalid &&
              'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
            size === 'sm' ? 'h-8 text-xs' : 'h-9',
            className
          )}
          aria-required={required}
          aria-invalid={invalid}
        >
          <div className='flex items-center gap-2 truncate overflow-hidden'>
            <CalendarIcon
              className={cn(
                'shrink-0 text-muted-foreground/80 transition-colors group-hover:text-primary',
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                selectedIso && 'text-primary'
              )}
            />
            {selectedIso ? (
              <span className='font-medium tracking-tight text-foreground'>
                {formatDisplay(selectedIso)}
              </span>
            ) : (
              <span className='text-muted-foreground/70'>{placeholder}</span>
            )}
          </div>

          <div className='ml-1.5 flex shrink-0 items-center gap-1'>
            {clearable && selectedIso && !disabled && (
              <span
                role='button'
                tabIndex={0}
                aria-label='Clear date'
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear()
                  }
                }}
                className='rounded-sm p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground'
              >
                <X className='h-3.5 w-3.5' />
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        className='z-50 w-[310px] rounded-2xl border border-border/80 bg-card p-3.5 text-card-foreground shadow-xl outline-none select-none'
      >
        {/* Top Header */}
        <div className='mb-3 flex items-center justify-between border-b border-border/60 pb-3'>
          {viewMode === 'days' && (
            <>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setViewMode('months')}
                  className='flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted/70 hover:text-primary'
                >
                  {MONTH_NAMES[viewMonth]}
                </button>
                <button
                  type='button'
                  onClick={() => setViewMode('years')}
                  className='flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted/70 hover:text-primary'
                >
                  {viewYear}
                </button>
              </div>

              <div className='flex items-center gap-0.5'>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear - 1)}
                  title='Previous year'
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronsLeft className='h-3.5 w-3.5' />
                </button>
                <button
                  type='button'
                  onClick={prevMonth}
                  title='Previous month'
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronLeft className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={nextMonth}
                  title='Next month'
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronRight className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear + 1)}
                  title='Next year'
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronsRight className='h-3.5 w-3.5' />
                </button>
              </div>
            </>
          )}

          {viewMode === 'months' && (
            <>
              <button
                type='button'
                onClick={() => setViewMode('years')}
                className='rounded-lg px-2 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted/70 hover:text-primary'
              >
                {viewYear}
              </button>

              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear - 1)}
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronLeft className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear + 1)}
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronRight className='h-4 w-4' />
                </button>
              </div>
            </>
          )}

          {viewMode === 'years' && (
            <>
              <span className='px-2 py-1 text-sm font-bold text-foreground'>
                {decadeStart} – {decadeStart + 11}
              </span>

              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear - 12)}
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronsLeft className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={() => setNavYear(viewYear + 12)}
                  className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronsRight className='h-4 w-4' />
                </button>
              </div>
            </>
          )}
        </div>

        {/* View Mode: Days */}
        {viewMode === 'days' && (
          <div>
            {/* Weekday labels */}
            <div className='mb-1.5 grid grid-cols-7 gap-1 text-center'>
              {WEEKDAYS.map((day, idx) => (
                <span
                  key={day}
                  className={cn(
                    'py-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground/80',
                    (idx === 0 || idx === 6) && 'text-muted-foreground/60'
                  )}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className='grid grid-cols-7 gap-1'>
              {calendarCells.map((cell, idx) => {
                const cellIso = toIso(cell.year, cell.month, cell.day)
                const isSelected = selectedIso === cellIso
                const isToday = today.iso === cellIso
                const disabledCell = isDateDisabled(cell.year, cell.month, cell.day)

                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                    type='button'
                    disabled={disabledCell}
                    onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                    className={cn(
                      'relative mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium transition-all',
                      cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/35',
                      !isSelected &&
                        !disabledCell &&
                        'hover:bg-accent hover:text-accent-foreground',
                      isSelected &&
                        'bg-primary font-semibold text-primary-foreground shadow-xs hover:bg-primary/90',
                      isToday && !isSelected && 'ring-1.5 font-bold text-primary ring-primary/60',
                      disabledCell && 'pointer-events-none cursor-not-allowed opacity-20'
                    )}
                  >
                    {cell.day}
                    {isToday && !isSelected && (
                      <span className='absolute bottom-1 h-1 w-1 rounded-full bg-primary' />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* View Mode: Months */}
        {viewMode === 'months' && (
          <div className='grid grid-cols-3 gap-2 py-1'>
            {MONTH_SHORT.map((name, idx) => {
              const isSelected = selectedParsed?.year === viewYear && selectedParsed?.month === idx
              const isCurrent = today.year === viewYear && today.month === idx
              const disabledMonth = isMonthDisabled(idx)

              return (
                <button
                  key={name}
                  type='button'
                  disabled={disabledMonth}
                  onClick={() => {
                    setNavMonth(idx)
                    setViewMode('days')
                  }}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground hover:bg-muted',
                    isCurrent && !isSelected && 'border border-primary/50 font-bold text-primary',
                    disabledMonth && 'pointer-events-none cursor-not-allowed opacity-25'
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}

        {/* View Mode: Years */}
        {viewMode === 'years' && (
          <div className='grid grid-cols-3 gap-2 py-1'>
            {decadeYears.map((yr) => {
              const isSelected = selectedParsed?.year === yr
              const isCurrent = today.year === yr
              const disabledYear = isYearDisabled(yr)

              return (
                <button
                  key={yr}
                  type='button'
                  disabled={disabledYear}
                  onClick={() => {
                    setNavYear(yr)
                    setViewMode('months')
                  }}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground hover:bg-muted',
                    isCurrent && !isSelected && 'border border-primary/50 font-bold text-primary',
                    disabledYear && 'pointer-events-none cursor-not-allowed opacity-25'
                  )}
                >
                  {yr}
                </button>
              )
            })}
          </div>
        )}

        {/* Bottom Quick Bar */}
        <div className='mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs'>
          <button
            type='button'
            onClick={() => handleClear()}
            className='rounded-md px-2 py-1 font-medium text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive'
          >
            Clear
          </button>

          <button
            type='button'
            onClick={handleToday}
            className='rounded-md px-2 py-1 font-bold text-primary transition-colors hover:bg-primary/10 hover:text-primary/80'
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
