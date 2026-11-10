import * as React from 'react'
import { Clock } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface TimePickerProps {
  id?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  className?: string
  minuteStep?: number
  clearable?: boolean
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const pad = (value: number) => String(value).padStart(2, '0')

function parseTime(text: string): { hours: number; minutes: number } | null {
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

function formatTime12(value?: string | null) {
  const parsed = value ? parseTime(value) : null
  if (!parsed) return ''
  const hour12 = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12
  return `${pad(hour12)}:${pad(parsed.minutes)} ${parsed.hours < 12 ? 'AM' : 'PM'}`
}

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
  minuteStep = 5,
  clearable = true,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(formatTime12(value))
  const [editing, setEditing] = React.useState(false)
  const parsed = parseTime(value)
  const shown = editing ? text : formatTime12(value)
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, index) => index * minuteStep
  )

  const emit = (next: string) => onChange?.(next)
  const pick = (hours: number, mins: number) => emit(toValue(hours, mins))
  const current = parsed ?? { hours: 9, minutes: 0 }
  const isPm = current.hours >= 12
  const hour12 = current.hours % 12 === 0 ? 12 : current.hours % 12

  const setHour = (hour: number) => pick((hour % 12) + (isPm ? 12 : 0), current.minutes)
  const setMinute = (mins: number) => pick(current.hours, mins)
  const setMeridiem = (pm: boolean) => pick((current.hours % 12) + (pm ? 12 : 0), current.minutes)
  const setNow = () => {
    const now = new Date()
    pick(now.getHours(), now.getMinutes())
  }

  const cell = (active: boolean) =>
    cn(
      'h-8 rounded-md text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      active
        ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
        : 'text-foreground hover:bg-muted'
    )

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-card shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
            invalid && 'border-destructive ring-destructive/20',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <input
            id={id}
            name={name}
            type='text'
            inputMode='numeric'
            autoComplete='off'
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            placeholder={placeholder}
            value={shown}
            className='h-full w-full min-w-0 flex-1 bg-transparent pr-1 pl-3 text-sm whitespace-nowrap tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed'
            onFocus={() => {
              setText(formatTime12(value))
              setEditing(true)
            }}
            onChange={(event) => {
              setText(event.target.value)
              if (event.target.value.trim() === '') emit('')
              const next = parseTime(event.target.value)
              if (next) emit(toValue(next.hours, next.minutes))
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && !open) {
                event.preventDefault()
                setOpen(true)
              }
            }}
          />
          <button
            type='button'
            aria-label='Choose time'
            disabled={disabled}
            className='mr-1 grid size-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none'
            onClick={() => setOpen((current) => !current)}
          >
            <Clock className='size-4' />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className='w-[19rem] p-0'
        onOpenAutoFocus={(event) => event.preventDefault()}
        aria-label='Choose time'
      >
        <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold tracking-tight tabular-nums'>
              {parsed ? `${pad(hour12)}:${pad(current.minutes)}` : '--:--'}
            </span>
            <span className='text-sm font-semibold text-muted-foreground'>
              {parsed ? (isPm ? 'PM' : 'AM') : ''}
            </span>
          </div>
          <div className='flex rounded-lg bg-muted p-0.5' role='group' aria-label='AM or PM'>
            {[false, true].map((pm) => (
              <button
                key={String(pm)}
                type='button'
                aria-pressed={Boolean(parsed) && isPm === pm}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                  parsed && isPm === pm
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setMeridiem(pm)}
              >
                {pm ? 'PM' : 'AM'}
              </button>
            ))}
          </div>
        </div>
        <div className='grid gap-3 p-3'>
          <div className='grid gap-1.5'>
            <span className='px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase'>
              Hour
            </span>
            <div className='grid grid-cols-6 gap-1'>
              {HOURS.map((hour) => (
                <button
                  key={hour}
                  type='button'
                  aria-label={`${hour} o'clock`}
                  aria-pressed={Boolean(parsed) && hour12 === hour}
                  className={cell(Boolean(parsed) && hour12 === hour)}
                  onClick={() => setHour(hour)}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>
          <div className='grid gap-1.5'>
            <span className='px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase'>
              Minute
            </span>
            <div className='grid grid-cols-6 gap-1'>
              {minutes.map((mins) => (
                <button
                  key={mins}
                  type='button'
                  aria-label={`${pad(mins)} minutes`}
                  aria-pressed={Boolean(parsed) && current.minutes === mins}
                  className={cell(Boolean(parsed) && current.minutes === mins)}
                  onClick={() => setMinute(mins)}
                >
                  {pad(mins)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className='flex items-center justify-between gap-2 border-t px-3 py-2'>
          <button
            type='button'
            className='rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10'
            onClick={setNow}
          >
            Now
          </button>
          <div className='flex gap-1'>
            {clearable && (
              <button
                type='button'
                className='rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground'
                onClick={() => emit('')}
              >
                Clear
              </button>
            )}
            <button
              type='button'
              className='rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90'
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
