import * as React from 'react'
import { Clock, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TimePickerProps {
  id?: string
  name?: string
  value?: string // 'HH:mm' 24-hr format (e.g. '09:30', '14:15')
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  className?: string
  minuteStep?: number
  clearable?: boolean
  timezone?: string
  align?: 'start' | 'center' | 'end'
}

const pad = (value: number) => String(value).padStart(2, '0')

function parseTime(text?: string | null): { hours: number; minutes: number } | null {
  if (!text) return null
  const match = /^\s*(\d{1,2})(?::?(\d{2}))?\s*([ap]\.?m?\.?)?\s*$/i.exec(text)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2] ?? 0)
  const meridiem = match[3]?.toLowerCase().startsWith('p') ? 'pm' : match[3] ? 'am' : null
  if (minutes > 59) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (meridiem === 'pm' ? 12 : 0)
  } else if (hours > 23) {
    return null
  }
  return { hours, minutes }
}

function toValue(hours: number, minutes: number) {
  return `${pad(hours)}:${pad(minutes)}`
}

function formatTime12(value?: string | null): string {
  const parsed = parseTime(value)
  if (!parsed) return ''
  const hour12 = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12
  return `${pad(hour12)}:${pad(parsed.minutes)} ${parsed.hours < 12 ? 'AM' : 'PM'}`
}

const HOURS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function TimePicker({
  id,
  name,
  value = '',
  onChange,
  placeholder = 'Select time',
  disabled = false,
  invalid = false,
  required = false,
  className,
  minuteStep = 15,
  clearable = true,
  timezone = 'IST (UTC+5:30)',
  align = 'start',
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsed = parseTime(value)
  const initialHour = parsed ? (parsed.hours % 12 === 0 ? 12 : parsed.hours % 12) : 9
  const initialMinute = parsed ? parsed.minutes : 30
  const initialIsPm = parsed ? parsed.hours >= 12 : false

  const [pendingHour, setPendingHour] = React.useState<number>(initialHour)
  const [pendingMinute, setPendingMinute] = React.useState<number>(initialMinute)
  const [pendingIsPm, setPendingIsPm] = React.useState<boolean>(initialIsPm)

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return
    if (nextOpen && value) {
      const p = parseTime(value)
      if (p) {
        setPendingHour(p.hours % 12 === 0 ? 12 : p.hours % 12)
        setPendingMinute(p.minutes)
        setPendingIsPm(p.hours >= 12)
      }
    }
    setOpen(nextOpen)
  }

  // Available minutes based on step (defaults to 15: 00, 15, 30, 45)
  const minutesList = React.useMemo(() => {
    const step = minuteStep > 0 && minuteStep <= 30 ? minuteStep : 15
    const list: number[] = []
    for (let m = 0; m < 60; m += step) {
      list.push(m)
    }
    return list
  }, [minuteStep])

  const handleSet = () => {
    const final24Hours = (pendingHour % 12) + (pendingIsPm ? 12 : 0)
    const timeVal = toValue(final24Hours, pendingMinute)
    onChange?.(timeVal)
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange?.('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          data-slot="time-picker"
          aria-required={required}
          aria-invalid={invalid}
          className={cn(
            'group relative flex h-9 w-full min-w-[140px] items-center justify-between rounded-md border border-[#D0D5DD] bg-white px-3 text-left text-sm shadow-xs transition-colors outline-none select-none',
            'hover:bg-[#F9FAFB] hover:border-slate-300 focus-visible:border-[#127D48] focus-visible:ring-[3px] focus-visible:ring-[#127D48]/20',
            invalid && 'border-destructive focus-visible:ring-destructive/20',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate overflow-hidden">
            <Clock className="size-4 shrink-0 text-[#127D48]" />
            {value ? (
              <span className="font-medium text-[#0F1A15]">{formatTime12(value)}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>

          <div className="ml-1 flex shrink-0 items-center gap-1">
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear time"
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
        className="z-50 w-[218px] rounded-xl border border-[#DFE4E1] bg-[#FFFFFF] p-0 shadow-[0px_4px_8px_-2px_#0F171414,0px_2px_4px_-2px_#0F17140A] outline-none select-none"
      >
        {/* 3 Columns: Hour, Minute, Period */}
        <div className="flex h-[200px] p-2 text-sm">
          {/* Hours Column */}
          <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HOURS_LIST.map((h) => {
              const isSelected = pendingHour === h
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPendingHour(h)}
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-md text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-[#127D48] font-semibold text-white shadow-xs'
                      : 'text-[#344054] hover:bg-[#F2F4F7]'
                  )}
                >
                  {pad(h)}
                </button>
              )
            })}
          </div>

          {/* Minutes Column */}
          <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {minutesList.map((m) => {
              const isSelected = pendingMinute === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPendingMinute(m)}
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-md text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-[#127D48] font-semibold text-white shadow-xs'
                      : 'text-[#344054] hover:bg-[#F2F4F7]'
                  )}
                >
                  {pad(m)}
                </button>
              )
            })}
          </div>

          {/* Period Column (AM / PM) */}
          <div className="flex flex-1 flex-col items-center gap-1 px-1 py-1">
            {[false, true].map((pm) => {
              const isSelected = pendingIsPm === pm
              return (
                <button
                  key={String(pm)}
                  type="button"
                  onClick={() => setPendingIsPm(pm)}
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-md text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-[#127D48] font-semibold text-white shadow-xs'
                      : 'text-[#344054] hover:bg-[#F2F4F7]'
                  )}
                >
                  {pm ? 'PM' : 'AM'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer: Timezone on left, Set button on right */}
        <div className="flex items-center justify-between border-t border-[#DFE4E1] px-3 py-2">
          <span className="text-[11px] font-medium text-[#5A6A62]">{timezone}</span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSet}
            className="h-7 rounded-md px-3 text-xs font-semibold text-white"
          >
            Set
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
