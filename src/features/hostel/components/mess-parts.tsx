import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CheckChips<T extends string>({
  label,
  options,
  value,
  onChange,
  invalid,
  disabled,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T[]
  onChange: (value: T[]) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const toggle = (option: T) =>
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : options
            .map((item) => item.value)
            .filter((item) => item === option || value.includes(item))
    )
  return (
    <div role='group' aria-label={label} className='flex flex-wrap gap-1.5'>
      {options.map((option) => {
        const checked = value.includes(option.value)
        return (
          <button
            key={option.value}
            type='button'
            role='checkbox'
            aria-checked={checked}
            disabled={disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
              checked
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              invalid && !checked && 'border-destructive/60'
            )}
          >
            <Check className={cn('size-3.5', !checked && 'opacity-0')} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function MarkChoice<T extends string>({
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string
  value: T | null
  options: { value: T; label: string; activeClass: string }[]
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <div role='radiogroup' aria-label={`Mark ${name}`} className='flex flex-wrap gap-1'>
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? option.activeClass
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
