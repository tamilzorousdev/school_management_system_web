import * as React from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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

  const [pendingIso, setPendingIso] = React.useState<string>(selectedIso)

  // Reset to days view whenever popover opens or closes
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return
    setOpen(newOpen)
    if (newOpen) {
      setViewMode('days')
      setPendingIso(selectedIso || '')
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
    setPendingIso(iso)
  }

  const handleDoubleClickDay = (year: number, month: number, day: number) => {
    const iso = toIso(year, month, day)
    setPendingIso(iso)
    triggerChange(iso)
    setOpen(false)
  }

  const handleApply = () => {
    if (pendingIso) {
      triggerChange(pendingIso)
    }
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPendingIso('')
    triggerChange('')
    setOpen(false)
  }

  const handleToday = () => {
    if (isDateDisabled(today.year, today.month, today.day)) return
    setPendingIso(today.iso)
    setNavYear(today.year)
    setNavMonth(today.month)
    setViewMode('days')
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
            'group relative flex w-full min-w-0 items-center justify-between rounded-md border border-[#D0D5DD] bg-white px-3 text-left text-sm shadow-xs transition-colors outline-none select-none',
            'hover:bg-[#F9FAFB] hover:border-slate-300 focus-visible:border-[#127D48] focus-visible:ring-[3px] focus-visible:ring-[#127D48]/20',
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
                'shrink-0 text-[#159053] transition-colors',
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
              )}
            />
            {selectedIso ? (
              <span className='font-medium text-slate-800 dark:text-slate-100'>
                {formatDisplay(selectedIso)}
              </span>
            ) : (
              <span className='text-slate-400'>{placeholder}</span>
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
                className='rounded-sm p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
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
        className='z-50 w-[260px] rounded-xl border border-[#DFE4E1] bg-[#FFFFFF] p-3 text-slate-800 shadow-[0px_4px_8px_-2px_#0F171414,0px_2px_4px_-2px_#0F17140A] outline-none select-none table-typography dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
      >
        {/* Top Header */}
        <div className='mb-3 flex items-center justify-between'>
          {viewMode === 'days' && (
            <>
              <button
                type='button'
                onClick={prevMonth}
                aria-label='Previous month'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>

              <button
                type='button'
                onClick={() => setViewMode('months')}
                className='text-[14.5px] font-semibold text-slate-800 transition-colors hover:text-[#159053] dark:text-slate-100 dark:hover:text-emerald-400'
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </button>

              <button
                type='button'
                onClick={nextMonth}
                aria-label='Next month'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </>
          )}

          {viewMode === 'months' && (
            <>
              <button
                type='button'
                onClick={() => setNavYear(viewYear - 1)}
                aria-label='Previous year'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>

              <button
                type='button'
                onClick={() => setViewMode('years')}
                className='text-[14.5px] font-semibold text-slate-800 transition-colors hover:text-[#159053] dark:text-slate-100 dark:hover:text-emerald-400'
              >
                {viewYear}
              </button>

              <button
                type='button'
                onClick={() => setNavYear(viewYear + 1)}
                aria-label='Next year'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </>
          )}

          {viewMode === 'years' && (
            <>
              <button
                type='button'
                onClick={() => setNavYear(viewYear - 12)}
                aria-label='Previous decade'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>

              <span className='text-[14.5px] font-semibold text-slate-800 dark:text-slate-100'>
                {decadeStart} – {decadeStart + 11}
              </span>

              <button
                type='button'
                onClick={() => setNavYear(viewYear + 12)}
                aria-label='Next decade'
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </>
          )}
        </div>

        {/* View Mode: Days */}
        {viewMode === 'days' && (
          <div>
            {/* Weekday labels */}
            <div className='mb-2 grid grid-cols-7 gap-1 text-center'>
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className='text-[12px] font-normal text-slate-400 dark:text-slate-500'
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className='grid grid-cols-7 gap-y-1 gap-x-1'>
              {calendarCells.map((cell, idx) => {
                const cellIso = toIso(cell.year, cell.month, cell.day)
                const activeIso = pendingIso || selectedIso
                const isSelected = activeIso === cellIso
                const isToday = today.iso === cellIso
                const disabledCell = isDateDisabled(cell.year, cell.month, cell.day)

                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                    type='button'
                    disabled={disabledCell}
                    onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                    onDoubleClick={() => handleDoubleClickDay(cell.year, cell.month, cell.day)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-all mx-auto',
                      // Non-current month days (muted gray like 29, 30, 1, 2, 3, 4, 5 in screenshot)
                      !cell.isCurrentMonth && 'text-slate-300 dark:text-slate-600 font-normal',
                      // Current month normal days
                      cell.isCurrentMonth &&
                        !isSelected &&
                        !isToday &&
                        'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                      // Today outline box
                      isToday &&
                        !isSelected &&
                        'border border-[#127D48] font-semibold text-[#127D48] hover:bg-[#EAF7F0]',
                      // Selected date filled solid green
                      isSelected &&
                        'bg-[#127D48] font-semibold text-white shadow-xs hover:bg-[#0E6339]',
                      disabledCell && 'pointer-events-none cursor-not-allowed opacity-20'
                    )}
                  >
                    {cell.day}
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
                    'flex h-10 items-center justify-center rounded-xl text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-[#159053] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    isCurrent && !isSelected && 'border border-[#159053] font-bold text-[#159053]',
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
                    'flex h-10 items-center justify-center rounded-xl text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-[#159053] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    isCurrent && !isSelected && 'border border-[#159053] font-bold text-[#159053]',
                    disabledYear && 'pointer-events-none cursor-not-allowed opacity-25'
                  )}
                >
                  {yr}
                </button>
              )
            })}
          </div>
        )}

        {/* Bottom Divider */}
        <div className='my-3 border-t border-slate-100 dark:border-slate-800' />

        {/* Bottom Footer */}
        <div className='flex items-center justify-between text-[13px]'>
          <button
            type='button'
            onClick={handleToday}
            className='font-semibold text-[#127D48] transition-colors hover:underline cursor-pointer'
          >
            Today
          </button>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleClear}
              className='rounded-md border border-[#D0D5DD] bg-white px-3 py-1 text-xs font-semibold text-[#344054] shadow-xs transition-colors hover:bg-slate-50'
            >
              Clear
            </button>
            <button
              type='button'
              onClick={handleApply}
              className='rounded-md bg-[#127D48] px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0E6339]'
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
