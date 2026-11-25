import { cn } from '@/lib/utils'
import { WEEKDAY_ORDER, WEEKDAYS } from './duty-helpers'

export function WeekdayPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value: number[]
  onChange: (value: number[]) => void
  invalid?: boolean
}) {
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((item) => item !== day) : [...value, day])
  return (
    <div
      id={id}
      role='group'
      aria-label='Weekdays'
      aria-invalid={invalid || undefined}
      className='flex flex-wrap gap-1'
    >
      {WEEKDAY_ORDER.map((day) => {
        const active = value.includes(day)
        return (
          <button
            key={day}
            type='button'
            aria-pressed={active}
            onClick={() => toggle(day)}
            className={cn(
              'h-8 min-w-11 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
              active
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              invalid && !active && 'border-destructive/50'
            )}
          >
            {WEEKDAYS[day]}
          </button>
        )
      })}
    </div>
  )
}
