import { useState } from 'react'
import { DoorOpen, Hand, UserRoundX, Users } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTime } from '@/lib/format'
import { useStudentsToday, type AwayReason, type TodayAway, type TodayRider } from '../api'

type View = 'early' | 'away' | 'hold'

const AWAY_TONE: Record<AwayReason, BadgeTone> = {
  leave: 'warning',
  half_day: 'info',
  od: 'info',
  absent: 'danger',
  no_bus: 'neutral',
  early_leave: 'warning',
}

function RiderLine({ rider }: { rider: TodayRider }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
        {rider.student.name}
      </span>
      <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
        {[rider.class_section, rider.bus?.name ?? rider.route.name, rider.stop]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  )
}

function AwayBadge({ trip, away }: { trip: string; away: TodayAway | null }) {
  if (!away) return null
  return (
    <Badge tone={AWAY_TONE[away.reason]} className='font-medium' title={away.note}>
      {trip}: {away.note}
    </Badge>
  )
}

function Empty({ text }: { text: string }) {
  return <p className='px-4 py-4 text-sm text-muted-foreground'>{text}</p>
}

export function StudentsTodayPanel({ day, live }: { day: string; live: boolean }) {
  const query = useStudentsToday(day, live)
  const [view, setView] = useState<View>('early')
  const data = query.data
  const summary = data?.summary

  const views: { key: View; label: string; count: number; icon: typeof DoorOpen }[] = [
    {
      key: 'early',
      label: 'Early leave today',
      count: (summary?.early_leave ?? 0) + (summary?.early_leave_waiting ?? 0),
      icon: DoorOpen,
    },
    {
      key: 'away',
      label: 'Not coming',
      count: data?.away.length ?? 0,
      icon: UserRoundX,
    },
    { key: 'hold', label: 'Passes on hold', count: summary?.passes_on_hold ?? 0, icon: Hand },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <h2 className='flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100'>
          <Users className='size-4 text-primary' />
          Bus students today
        </h2>
        {summary && (
          <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
            {summary.coming} of {summary.riders} coming · {summary.away_pickup} not on pickup ·{' '}
            {summary.away_drop} not on drop
          </span>
        )}
      </div>

      <div role='group' aria-label='Show' className='flex flex-wrap gap-2 border-b px-4 py-3'>
        {views.map((item) => (
          <Button
            key={item.key}
            size='sm'
            variant={view === item.key ? 'primary' : 'secondary'}
            aria-pressed={view === item.key}
            onClick={() => setView(item.key)}
          >
            <item.icon className='size-3.5' />
            {item.label}
            <span className='tabular'>({item.count})</span>
          </Button>
        ))}
      </div>

      {query.isPending && !data ? (
        <div className='grid gap-2 p-4'>
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
        </div>
      ) : query.isError && !data ? (
        <Empty text={query.error.message} />
      ) : view === 'early' ? (
        data?.early_leaves.length ? (
          <ul aria-label='Early leave today' className='grid max-h-96 divide-y overflow-y-auto'>
            {data.early_leaves.map((row) => (
              <li
                key={row.student.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3'
              >
                <RiderLine rider={row} />
                <div className='grid justify-items-end gap-1 text-right text-xs'>
                  {row.status === 'released' ? (
                    <Badge tone='warning'>
                      Gone home{row.released_at ? ` at ${formatTime(row.released_at)}` : ''}
                    </Badge>
                  ) : (
                    <Badge tone='info'>Approved · waiting at the gate</Badge>
                  )}
                  <span className='text-muted-foreground'>
                    {[
                      row.pickup_name &&
                        `With ${row.pickup_name}${row.pickup_relation ? ` (${row.pickup_relation})` : ''}`,
                      row.reason,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text='No bus student leaves early today.' />
        )
      ) : view === 'away' ? (
        data?.away.length ? (
          <ul aria-label='Not coming' className='grid max-h-96 divide-y overflow-y-auto'>
            {data.away.map((row) => (
              <li
                key={row.student.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3'
              >
                <RiderLine rider={row} />
                <div className='flex flex-wrap justify-end gap-1'>
                  <AwayBadge trip='Pickup' away={row.pickup} />
                  <AwayBadge trip='Drop' away={row.drop} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text='Every bus student is coming today.' />
        )
      ) : data?.on_hold.length ? (
        <ul aria-label='Passes on hold' className='grid max-h-96 divide-y overflow-y-auto'>
          {data.on_hold.map((row) => (
            <li
              key={row.student.id}
              className='flex flex-wrap items-center justify-between gap-2 px-4 py-3'
            >
              <RiderLine rider={row} />
              <div className='grid justify-items-end gap-1 text-right text-xs'>
                <Badge tone='danger'>
                  {row.hold_kind === 'fee' ? 'Bus fee pending' : 'Held by the office'}
                </Badge>
                {row.pass_note && <span className='text-muted-foreground'>{row.pass_note}</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text='No bus pass is on hold.' />
      )}
    </Card>
  )
}
