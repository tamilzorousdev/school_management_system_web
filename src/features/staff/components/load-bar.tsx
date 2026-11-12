import { cn } from '@/lib/utils'
import { loadTone } from '../labels'

const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive' }
const TEXT = { success: 'text-foreground', warning: 'text-warning', danger: 'text-destructive' }

export function LoadBar({
  load,
  max,
  className,
  label = true,
}: {
  load: number
  max: number
  className?: string
  label?: boolean
}) {
  const tone = loadTone(load, max)
  const percent = max > 0 ? Math.min(100, Math.round((load / max) * 100)) : 0
  return (
    <div className={cn('grid min-w-24 gap-1', className)}>
      {label && (
        <span className={cn('tabular text-xs font-semibold', TEXT[tone])}>
          {load}
          <span className='font-normal text-muted-foreground'> / {max} periods a week</span>
        </span>
      )}
      <div
        role='progressbar'
        aria-label={`${load} of ${max} periods a week`}
        aria-valuenow={load}
        aria-valuemin={0}
        aria-valuemax={max}
        className='h-1.5 w-full overflow-hidden rounded-full bg-muted'
      >
        <div
          className={cn('h-full rounded-full transition-[width]', BAR[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
