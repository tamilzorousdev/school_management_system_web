import { Star } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TicketUpdate } from '../api'
import type { Tone } from '../labels'

export function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className='text-xs text-muted-foreground'>—</span>
  return (
    <span className='inline-flex items-center gap-0.5' aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3.5',
            index < rating ? 'fill-current text-warning' : 'text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  )
}

export function UpdateTimeline({
  updates,
  statuses,
}: {
  updates: TicketUpdate[]
  statuses: Record<string, Tone>
}) {
  if (!updates.length) {
    return <p className='text-sm text-muted-foreground'>Nothing logged yet.</p>
  }
  return (
    <ol className='grid gap-3 border-l pl-4'>
      {updates.map((update, index) => (
        <li key={`${update.created_at}-${index}`} className='relative grid gap-0.5'>
          <span className='absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary' />
          <span className='text-sm font-semibold'>
            {update.status ? (statuses[update.status]?.label ?? update.status) : 'Note'}
          </span>
          {update.note && <span className='text-sm whitespace-pre-wrap'>{update.note}</span>}
          <span className='text-xs text-muted-foreground'>
            {[formatDateTime(update.created_at), update.actor_name && `by ${update.actor_name}`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ol>
  )
}
