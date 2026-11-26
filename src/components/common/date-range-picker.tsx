import * as React from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRange {
  from?: string // 'YYYY-MM-DD'
  to?: string // 'YYYY-MM-DD'
}

export interface DateRangePickerProps {
  id?: string
  name?: string
  value?: DateRange
  defaultValue?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'start' | 'center' | 'end'
  clearable?: boolean
  min?: string // 'YYYY-MM-DD'
  max?: string // 'YYYY-MM-DD'
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

function addDays(iso: string, days: number): string {
  const p = parseDate(iso)
  if (!p) return iso
  const d = new Date(Date.UTC(p.year, p.month, p.day + days))
  return toIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function getDaysDifference(fromIso: string, toIso: string): number {
  const pFrom = parseDate(fromIso)
  const pTo = parseDate(toIso)
  if (!pFrom || !pTo) return 0
  const d1 = Date.UTC(pFrom.year, pFrom.month, pFrom.day)
  const d2 = Date.UTC(pTo.year, pTo.month, pTo.day)
  return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1
}

interface PresetOption {
  id: string
  label: string
  getRange: (todayIso: string) => { from: string; to: string }
}

const PRESETS: PresetOption[] = [
  {
    id: 'today',
    label: 'Today',
    getRange: (today) => ({ from: today, to: today }),
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    getRange: (today) => {
      const y = addDays(today, -1)
      return { from: y, to: y }
    },
  },
  {
    id: 'last7',
    label: 'Last 7 days',
    getRange: (today) => ({ from: addDays(today, -6), to: today }),
  },
  {
    id: 'last30',
    label: 'Last 30 days',
    getRange: (today) => ({ from: addDays(today, -29), to: today }),
  },
  {
    id: 'thisMonth',
    label: 'This month',
    getRange: (today) => {
      const p = parseDate(today)!
      const start = toIso(p.year, p.month, 1)
      const days = getDaysInMonth(p.year, p.month)
      const end = toIso(p.year, p.month, days)
      return { from: start, to: end }
    },
  },
  {
    id: 'lastQuarter',
    label: 'Last quarter',
    getRange: (today) => {
      const p = parseDate(today)!
      const currentQuarter = Math.floor(p.month / 3)
      let qStartMonth: number
      let qYear = p.year
      if (currentQuarter === 0) {
        qYear = p.year - 1
        qStartMonth = 9
      } else {
        qStartMonth = (currentQuarter - 1) * 3
      }
      const start = toIso(qYear, qStartMonth, 1)
      const qEndMonth = qStartMonth + 2
      const end = toIso(qYear, qEndMonth, getDaysInMonth(qYear, qEndMonth))
      return { from: start, to: end }
    },
  },
  {
    id: 'custom',
    label: 'Custom range',
    getRange: () => ({ from: '', to: '' }),
  },
]

export function DateRangePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  className,
  align = 'start',
  clearable = true,
  min,
  max,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const todayIso = React.useMemo(() => {
    const now = new Date()
    return toIso(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const initialRange = value ?? defaultValue ?? { from: '', to: '' }
  const [selectedRange, setSelectedRange] = React.useState<DateRange>(initialRange)
  const currentRange = value ?? selectedRange
  const [pendingRange, setPendingRange] = React.useState<DateRange>(initialRange)
  const [hoverDate, setHoverDate] = React.useState<string | null>(null)
  const [activePreset, setActivePreset] = React.useState<string>('last30')

  // Calendar dual-month view state
  const initialDate = parseDate(initialRange.from) || parseDate(todayIso)!
  const [viewYear, setViewYear] = React.useState<number>(initialDate.year)
  const [viewMonth, setViewMonth] = React.useState<number>(initialDate.month)

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return
    if (nextOpen) {
      setPendingRange(currentRange)
      if (currentRange.from) {
        const p = parseDate(currentRange.from)
        if (p) {
          setViewYear(p.year)
          setViewMonth(p.month)
        }
      }
    }
    setOpen(nextOpen)
  }

  // Dual months: Month 1 (left) and Month 2 (right = Month 1 + 1)
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear
  const nextMonthIndex = viewMonth === 11 ? 0 : viewMonth + 1

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectPreset = (preset: PresetOption) => {
    setActivePreset(preset.id)
    if (preset.id === 'custom') return
    const range = preset.getRange(todayIso)
    setPendingRange(range)
    if (range.from) {
      const p = parseDate(range.from)
      if (p) {
        setViewYear(p.year)
        setViewMonth(p.month)
      }
    }
  }

  const handleDateClick = (iso: string) => {
    setActivePreset('custom')
    if (!pendingRange.from || (pendingRange.from && pendingRange.to)) {
      // First click: pick start date
      setPendingRange({ from: iso, to: undefined })
    } else {
      // Second click: pick end date
      if (iso < pendingRange.from) {
        setPendingRange({ from: iso, to: pendingRange.from })
      } else {
        setPendingRange({ from: pendingRange.from, to: iso })
      }
    }
  }

  const handleApply = () => {
    const finalRange: DateRange = {
      from: pendingRange.from,
      to: pendingRange.to || pendingRange.from,
    }
    setSelectedRange(finalRange)
    onChange?.(finalRange)
    setOpen(false)
  }

  const handleCancel = () => {
    setPendingRange(currentRange)
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const empty: DateRange = { from: '', to: '' }
    setSelectedRange(empty)
    setPendingRange(empty)
    onChange?.(empty)
    setOpen(false)
  }

  // Days difference
  const daysCount =
    pendingRange.from && pendingRange.to
      ? getDaysDifference(pendingRange.from, pendingRange.to)
      : pendingRange.from
        ? 1
        : 0

  // Month day generator
  const getMonthDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfWeek(year, month)
    const daysInPrevMonth = getDaysInMonth(
      month === 0 ? year - 1 : year,
      month === 0 ? 11 : month - 1
    )

    const cells: { year: number; month: number; day: number; isCurrentMonth: boolean; iso: string }[] =
      []

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevY = month === 0 ? year - 1 : year
      const prevM = month === 0 ? 11 : month - 1
      const d = daysInPrevMonth - i
      cells.push({
        year: prevY,
        month: prevM,
        day: d,
        isCurrentMonth: false,
        iso: toIso(prevY, prevM, d),
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        year,
        month,
        day: d,
        isCurrentMonth: true,
        iso: toIso(year, month, d),
      })
    }

    // Fill remaining cells to complete grid (up to 42 cells = 6 rows)
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextY = month === 11 ? year + 1 : year
      const nextM = month === 11 ? 0 : month + 1
      cells.push({
        year: nextY,
        month: nextM,
        day: d,
        isCurrentMonth: false,
        iso: toIso(nextY, nextM, d),
      })
    }

    return cells
  }

  const leftMonthDays = React.useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  )
  const rightMonthDays = React.useMemo(
    () => getMonthDays(nextMonthYear, nextMonthIndex),
    [nextMonthYear, nextMonthIndex]
  )

  const isDayInRange = (iso: string) => {
    const from = pendingRange.from
    const to = pendingRange.to || (from && hoverDate ? (hoverDate >= from ? hoverDate : from) : undefined)
    const actualFrom = from && hoverDate && !pendingRange.to && hoverDate < from ? hoverDate : from
    if (!actualFrom || !to) return false
    return iso >= actualFrom && iso <= to
  }

  const isDayStart = (iso: string) => {
    const from = pendingRange.from
    if (!from) return false
    if (!pendingRange.to && hoverDate && hoverDate < from) {
      return iso === hoverDate
    }
    return iso === from
  }

  const isDayEnd = (iso: string) => {
    if (pendingRange.to) return iso === pendingRange.to
    if (pendingRange.from && hoverDate) {
      return hoverDate >= pendingRange.from ? iso === hoverDate : iso === pendingRange.from
    }
    return false
  }

  const isDayDisabled = (iso: string) => {
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  const renderCalendar = (
    year: number,
    month: number,
    days: ReturnType<typeof getMonthDays>,
    isLeft: boolean
  ) => {
    return (
      <div className="flex-1">
        {/* Month Header */}
        <div className="mb-3 flex h-7 items-center justify-between">
          {isLeft ? (
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}

          <span className="text-sm font-semibold text-[#0F1A15]">
            {MONTH_NAMES[month]} {year}
          </span>

          {!isLeft ? (
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}
        </div>

        {/* Weekday headers */}
        <div className="mb-1.5 grid grid-cols-7 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="text-xs font-normal text-[#5A6A62]">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((cell) => {
            const inRange = isDayInRange(cell.iso)
            const isStart = isDayStart(cell.iso)
            const isEnd = isDayEnd(cell.iso)
            const isToday = cell.iso === todayIso
            const isDisabled = isDayDisabled(cell.iso)

            return (
              <div
                key={cell.iso}
                className={cn(
                  'relative flex h-8 items-center justify-center',
                  inRange && !isStart && !isEnd && 'bg-[#EAF7F0]',
                  isStart && inRange && 'rounded-l-md bg-[#EAF7F0]',
                  isEnd && inRange && 'rounded-r-md bg-[#EAF7F0]'
                )}
                onMouseEnter={() => setHoverDate(cell.iso)}
              >
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(cell.iso)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center text-xs font-medium transition-colors outline-none',
                    !cell.isCurrentMonth && 'text-slate-300',
                    cell.isCurrentMonth && 'text-[#0F1A15]',
                    // Selected start or end
                    (isStart || isEnd) &&
                      'rounded-md bg-[#127D48] font-semibold text-white shadow-xs hover:bg-[#0E6339]',
                    // In-between
                    inRange && !isStart && !isEnd && 'text-[#0F1A15] hover:bg-[#D5EFE1]',
                    // Not in range hover
                    !inRange && !isStart && !isEnd && 'rounded-md hover:bg-[#F2F4F7]',
                    // Today outline
                    isToday &&
                      !isStart &&
                      !isEnd &&
                      !inRange &&
                      'rounded-md border border-[#127D48] text-[#127D48] font-semibold',
                    isDisabled && 'cursor-not-allowed opacity-30 hover:bg-transparent'
                  )}
                >
                  {cell.day}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const displayLabel = React.useMemo(() => {
    if (!currentRange.from) return ''
    if (currentRange.from && currentRange.to) {
      return `${formatDisplay(currentRange.from)} – ${formatDisplay(currentRange.to)}`
    }
    return formatDisplay(currentRange.from)
  }, [currentRange])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          data-slot="date-range-picker"
          className={cn(
            'group relative flex h-9 w-full min-w-[240px] items-center justify-between rounded-md border border-[#D0D5DD] bg-white px-3 text-left text-sm shadow-xs transition-colors outline-none select-none',
            'hover:bg-[#F9FAFB] hover:border-slate-300 focus-visible:border-[#127D48] focus-visible:ring-[3px] focus-visible:ring-[#127D48]/20',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate overflow-hidden">
            <CalendarIcon className="size-4 shrink-0 text-[#127D48]" />
            {displayLabel ? (
              <span className="font-medium text-[#0F1A15]">{displayLabel}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>

          <div className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && currentRange.from && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date range"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear()
                  }
                }}
                className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        className="z-50 w-[730px] rounded-xl border border-[#DFE4E1] bg-[#FFFFFF] p-0 shadow-[0px_4px_8px_-2px_#0F171414,0px_2px_4px_-2px_#0F17140A] outline-none select-none"
      >
        <div className="flex">
          {/* Left Presets Sidebar */}
          <div className="w-[160px] shrink-0 border-r border-[#DFE4E1] p-3">
            <div className="flex flex-col gap-1">
              {PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-[#EAF7F0] text-[#127D48]'
                        : 'text-[#344054] hover:bg-[#F2F4F7] hover:text-[#0F1A15]'
                    )}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="size-4 text-[#127D48]" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Dual Calendar Section */}
          <div className="flex flex-1 gap-6 p-5">
            {renderCalendar(viewYear, viewMonth, leftMonthDays, true)}
            {renderCalendar(nextMonthYear, nextMonthIndex, rightMonthDays, false)}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex items-center justify-between border-t border-[#DFE4E1] px-5 py-3">
          <div className="text-xs text-[#5A6A62]">
            {pendingRange.from ? (
              <span>
                {formatDisplay(pendingRange.from)}
                {pendingRange.to ? ` – ${formatDisplay(pendingRange.to)}` : ''}
                {daysCount > 0 ? ` · ${daysCount} day${daysCount > 1 ? 's' : ''}` : ''}
              </span>
            ) : (
              <span>No dates selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              className="h-8 border-[#D0D5DD] px-3 font-semibold text-[#344054]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!pendingRange.from}
              onClick={handleApply}
              className="h-8 px-4 font-semibold text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
