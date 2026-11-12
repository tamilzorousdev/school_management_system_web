import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClasses } from '../api'

export function ClassPicker({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string
  value: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
}) {
  const classes = useClasses()
  const chosen = new Set(value)
  const toggle = (classId: number) =>
    onChange(chosen.has(classId) ? value.filter((item) => item !== classId) : [...value, classId])

  return (
    <div id={id} role='group' aria-label='Classes' className='flex flex-wrap gap-1.5'>
      {(classes.data ?? []).map((schoolClass) => {
        const on = chosen.has(schoolClass.id)
        return (
          <button
            key={schoolClass.id}
            type='button'
            role='checkbox'
            aria-checked={on}
            disabled={disabled}
            onClick={() => toggle(schoolClass.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors',
              on
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
              disabled && 'cursor-default opacity-70'
            )}
          >
            {on && <Check className='size-3.5' />}
            Class {schoolClass.name}
          </button>
        )
      })}
    </div>
  )
}
