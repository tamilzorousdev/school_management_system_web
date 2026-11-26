import { BellRing, CalendarCheck, Clock, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AoCard } from '../api'
import { AO_FLAG, attendanceLine, rupees } from '../labels'
import { Chips, Stat } from './shared'

function PendingLine({ label, count }: { label: string; count: number }) {
  return (
    <div className='grid min-w-0 rounded-md border border-[#DFE4E1] bg-muted/20 px-1.5 py-1 text-center'>
      <span className='text-[10.5px] leading-tight font-semibold text-muted-foreground'>{label}</span>
      <span className={cn('tabular text-xs font-bold', count > 0 && 'text-warning')}>{count}</span>
    </div>
  )
}

export function AoStats({ card }: { card: AoCard }) {
  return (
    <div className='grid gap-2.5'>
      <div className='grid grid-cols-2 gap-1.5'>
        <PendingLine label='Gate passes' count={card.pending.gate_passes} />
        <PendingLine label='Fee requests' count={card.pending.fee_requests} />
        <PendingLine label='Leave' count={card.pending.leave_requests} />
        <PendingLine label='Grievances' count={card.pending.grievances} />
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <Stat
          icon={Clock}
          label='Pending approvals'
          value={
            <>
              {card.pending.total}
              {' · '}
              <span className={card.pending.overdue > 0 ? 'text-destructive' : ''}>
                {card.pending.overdue} over 1 day
              </span>
            </>
          }
          tone={card.pending.overdue > 0 ? 'danger' : undefined}
        />
        <Stat
          icon={IndianRupee}
          label='Collected today · month'
          value={`${rupees(card.fees_collected_today)} · ${rupees(card.fees_collected_month)}`}
        />
        <Stat
          icon={IndianRupee}
          label='Fee due in wings'
          value={rupees(card.fee_due)}
          tone={card.fee_due > 0 ? 'warning' : undefined}
        />
        <Stat
          icon={CalendarCheck}
          label='Attendance today'
          value={attendanceLine(card.attendance)}
          tone={
            card.attendance.sections_total &&
            card.attendance.sections_marked < card.attendance.sections_total
              ? 'warning'
              : undefined
          }
        />
      </div>
      <Chips
        items={card.flags.map((flag) => ({
          key: flag,
          label: AO_FLAG[flag]?.label ?? flag,
          tone: AO_FLAG[flag]?.tone ?? 'neutral',
        }))}
      />
    </div>
  )
}

export function AoCardView({
  card,
  now,
  onOpen,
  onRemind,
  reminding,
}: {
  card: AoCard
  now: number
  onOpen: () => void
  onRemind: () => void
  reminding: boolean
}) {
  return (
    <div className='grid min-w-0 content-start gap-2.5 rounded-lg border border-[#DFE4E1] bg-white p-3.5 shadow-xs dark:bg-card dark:border-border'>
      <button
        type='button'
        onClick={onOpen}
        aria-label={`Open ${card.user.name}`}
        className='grid min-w-0 gap-0.5 rounded text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40'
      >
        <span className='truncate text-sm sm:text-[15px] font-bold tracking-tight hover:text-primary'>
          {card.user.name}
        </span>
        <span className='truncate text-[11px] text-muted-foreground'>
          {card.is_head ? 'Head AO · whole school' : card.wings.map((wing) => wing.name).join(', ')}
        </span>
        <span
          className={cn('text-[11px]', card.inactive ? 'text-destructive font-medium' : 'text-muted-foreground')}
        >
          Last active {card.last_active_at ? timeAgo(card.last_active_at, now) : 'never'}
        </span>
      </button>
      <AoStats card={card} />
      <div className='flex flex-wrap gap-2'>
        <Button size='sm' variant='outline' className='h-7.5 px-2.5 text-xs' onClick={onOpen}>
          Open
        </Button>
        <Button
          size='sm'
          variant='ghost'
          className='h-7.5 px-2.5 text-xs'
          disabled={!card.pending.total}
          loading={reminding}
          onClick={onRemind}
        >
          <BellRing className='size-3.5' />
          Remind
        </Button>
      </div>
    </div>
  )
}
