import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stars({ value, label }: { value: number | null; label?: string | null }) {
  if (value === null) return <span className='text-muted-foreground'>—</span>
  const full = Math.round(value)
  return (
    <span
      className='inline-flex items-center gap-1.5 whitespace-nowrap'
      aria-label={`${value} of 5 stars${label ? `, ${label}` : ''}`}
    >
      <span className='inline-flex' aria-hidden>
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={cn(
              'size-3.5',
              index <= full ? 'fill-warning text-warning' : 'text-muted-foreground/40'
            )}
          />
        ))}
      </span>
      <span className='tabular text-xs font-semibold'>{value}</span>
      {label && <span className='text-xs text-muted-foreground'>{label}</span>}
    </span>
  )
}
