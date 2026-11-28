import { useState } from 'react'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BusFront,
  CircleCheck,
  CircleOff,
  CirclePause,
  ClipboardList,
  Route as RouteIcon,
  ShieldCheck,
  Timer,
  UserRoundCheck,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TRIP_TRACKING, clock } from '@/features/fleet/labels'
import { cn } from '@/lib/utils'
import { useOperationsBoard, type BoardException, type BoardStatus, type BoardTrip } from '../api'
import { OpsDayBar } from '../components/ops-day'
import { StudentsTodayPanel } from '../components/students-today-panel'
import { BOARD_STATUS, EXCEPTION_KIND, opsDay } from '../labels'
import type { OpsDaySearch } from '../search'

const route = getRouteApi('/_app/transport/operations')

type StatusFilter = Exclude<BoardStatus, 'late_start'>

const ICON_TONE: Record<BadgeTone, string> = {
  danger: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  neutral: 'bg-muted text-muted-foreground',
}

const EDGE_TONE: Record<BadgeTone, string> = {
  danger: 'border-l-destructive',
  warning: 'border-l-warning',
  info: 'border-l-info',
  success: 'border-l-success',
  neutral: 'border-l-border',
}

const matchesFilter = (trip: BoardTrip, filter: StatusFilter | null) =>
  !filter || trip.status === filter || (filter === 'not_started' && trip.status === 'late_start')

const KIND_LABEL = { pickup: 'Pickup', drop: 'Drop' } as const

function ExceptionRow({ item }: { item: BoardException }) {
  const kind = EXCEPTION_KIND[item.kind]
  const Icon = kind.icon
  const sos = item.kind === 'sos'
  return (
    <li
      className={cn(
        'flex flex-wrap items-start gap-3 border-b border-l-4 px-4 py-3 last:border-b-0',
        EDGE_TONE[kind.tone],
        sos && 'bg-destructive/5'
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg',
          sos ? 'bg-destructive text-destructive-foreground' : ICON_TONE[kind.tone]
        )}
      >
        <Icon className='size-4' />
      </span>
      <div className='grid min-w-0 flex-1 gap-1'>
        <Badge tone={kind.tone} className='justify-self-start font-medium'>
          {kind.label}
        </Badge>
        <span className='text-[13px] leading-[18px] text-slate-700 break-words dark:text-slate-300'>
          {item.message}
        </span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {item.incident_id && (
          <Button size='sm' variant='outline' asChild>
            <Link to='/transport/incidents' search={{ page: 1, id: item.incident_id }}>
              Open incident
            </Link>
          </Button>
        )}
        {item.trip_id && (
          <Button size='sm' variant='outline' asChild>
            <Link to='/fleet/trips/$tripId' params={{ tripId: item.trip_id }}>
              Open trip
            </Link>
          </Button>
        )}
        {sos && !item.trip_id && (
          <Button size='sm' variant='outline' asChild>
            <Link to='/fleet/alerts' search={{ page: 1, kind: 'sos', active: true }}>
              Open alerts
            </Link>
          </Button>
        )}
      </div>
    </li>
  )
}

function ExceptionsPanel({
  items,
  loading,
}: {
  items: BoardException[] | undefined
  loading: boolean
}) {
  const sorted = [...(items ?? [])].sort(
    (a, b) => EXCEPTION_KIND[a.kind].rank - EXCEPTION_KIND[b.kind].rank
  )
  return (
    <Card className='overflow-hidden'>
      <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
        <h2 className='flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100'>
          <ClipboardList className='size-4 text-primary' />
          Exceptions
        </h2>
        {items && (
          <Badge tone={items.length ? 'danger' : 'success'} className='font-medium'>
            {items.length ? `${items.length} need attention` : 'All clear'}
          </Badge>
        )}
      </div>
      {loading && !items ? (
        <div className='grid gap-2 p-4'>
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
        </div>
      ) : sorted.length === 0 ? (
        <p className='flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground'>
          <ShieldCheck className='size-4 text-success' />
          Nothing needs attention right now.
        </p>
      ) : (
        <ul aria-label='Exceptions' className='grid max-h-96 overflow-y-auto'>
          {sorted.map((item, index) => (
            <ExceptionRow
              key={`${item.kind}-${item.trip_id ?? item.incident_id ?? index}`}
              item={item}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

function RouteCell({ trip }: { trip: BoardTrip }) {
  return (
    <div className='grid min-w-0 gap-1'>
      <span className='flex items-center gap-2'>
        <span className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300'>
          {trip.route_code}
        </span>
        <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
          {trip.route.name}
        </span>
      </span>
      <Badge
        tone={trip.kind === 'pickup' ? 'info' : 'neutral'}
        className='justify-self-start font-medium'
      >
        {KIND_LABEL[trip.kind]}
      </Badge>
    </div>
  )
}

function StatusCell({ trip }: { trip: BoardTrip }) {
  const status = BOARD_STATUS[trip.status]
  return (
    <div className='grid justify-items-start gap-1'>
      <Badge tone={status.tone} dot pulse={trip.status === 'running'} className='font-medium'>
        {status.label}
      </Badge>
      {trip.tracking && (
        <Badge
          tone={TRIP_TRACKING[trip.tracking].tone}
          title={TRIP_TRACKING[trip.tracking].hint}
          className='font-medium'
        >
          {TRIP_TRACKING[trip.tracking].label}
        </Badge>
      )}
    </div>
  )
}

function StopsCell({ trip }: { trip: BoardTrip }) {
  const percent = trip.stops_total ? Math.round((trip.stops_done / trip.stops_total) * 100) : 0
  return (
    <div className='grid min-w-28 gap-1'>
      <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
        {trip.stops_done}/{trip.stops_total}
      </span>
      <span
        role='progressbar'
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label='Stops done'
        className='h-1.5 overflow-hidden rounded-full bg-muted'
      >
        <span className='block h-full rounded-full bg-primary' style={{ width: `${percent}%` }} />
      </span>
      {trip.current_stop && (
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          At {trip.current_stop}
        </span>
      )}
    </div>
  )
}

function RidersCell({ trip }: { trip: BoardTrip }) {
  return (
    <div className='grid'>
      <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
        {trip.boarded}/{trip.expected}
      </span>
      {trip.away > 0 && (
        <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {trip.away} away
        </span>
      )}
      {(trip.not_at_stop > 0 || trip.boarded_on_hold > 0) && (
        <span className='mt-0.5 flex flex-wrap gap-1'>
          {trip.not_at_stop > 0 && (
            <Badge
              tone='warning'
              className='font-medium'
              title='The bus came and the child was not at the stop'
            >
              {trip.not_at_stop} not at stop
            </Badge>
          )}
          {trip.boarded_on_hold > 0 && (
            <Badge tone='warning' className='font-medium' title='Got on with the bus pass on hold'>
              {trip.boarded_on_hold} on hold
            </Badge>
          )}
        </span>
      )}
    </div>
  )
}

function SweepCell({ trip }: { trip: BoardTrip }) {
  if (trip.status !== 'completed') return <span className='text-slate-400'>—</span>
  return trip.swept_at ? (
    <Badge tone='success' className='font-medium' title='No child left on the bus'>
      <CircleCheck className='size-3' />
      {clock(trip.swept_at)}
    </Badge>
  ) : (
    <Badge tone='danger' className='font-medium'>
      Missing
    </Badge>
  )
}

const delayText = (trip: BoardTrip) =>
  trip.delay_minutes ? (
    `${trip.delay_minutes} min`
  ) : (
    <span className='text-muted-foreground'>—</span>
  )

export function OperationsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/transport/operations' })
  const { day, live } = opsDay(search.date)
  const board = useOperationsBoard(day, live)
  const [filter, setFilter] = useState<StatusFilter | null>(null)
  const data = board.data
  const rows = (data?.trips ?? []).filter((trip) => matchesFilter(trip, filter))

  const setSearch = (patch: Partial<OpsDaySearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => void board.refetch())

  const toggle = (next: StatusFilter | null) =>
    setFilter((current) => (current === next ? null : next))

  const cards: Insight[] = [
    {
      key: 'total',
      label: 'Trips',
      value: data?.summary.total ?? 0,
      hint: 'Pickup and drop',
      icon: RouteIcon,
      tone: 'primary',
      active: filter === null,
      onClick: () => setFilter(null),
    },
    {
      key: 'not_started',
      label: 'Not started',
      value: data?.summary.not_started ?? 0,
      hint: 'Includes late starts',
      icon: CirclePause,
      tone: 'neutral',
      active: filter === 'not_started',
      onClick: () => toggle('not_started'),
    },
    {
      key: 'running',
      label: 'Running',
      value: data?.summary.running ?? 0,
      hint: 'On the road',
      icon: BusFront,
      tone: 'success',
      active: filter === 'running',
      onClick: () => toggle('running'),
    },
    {
      key: 'delayed',
      label: 'Delayed',
      value: data?.summary.delayed ?? 0,
      hint: 'Behind the plan',
      icon: Timer,
      tone: 'warning',
      active: filter === 'delayed',
      onClick: () => toggle('delayed'),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: data?.summary.completed ?? 0,
      hint: 'Ended today',
      icon: CircleCheck,
      tone: 'info',
      active: filter === 'completed',
      onClick: () => toggle('completed'),
    },
    {
      key: 'drivers',
      label: 'Drivers checked in',
      value: data ? `${data.drivers.checked_in}/${data.drivers.total}` : '0/0',
      hint: data?.drivers.late ? `${data.drivers.late} late` : 'None late',
      icon: UserRoundCheck,
      tone: data?.drivers.late ? 'warning' : 'success',
      onClick: () =>
        navigate({ to: '/transport/driver-attendance', search: { date: search.date } }),
    },
  ]

  const openTrip = (trip: BoardTrip) =>
    trip.trip_id
      ? navigate({ to: '/fleet/trips/$tripId', params: { tripId: trip.trip_id } })
      : undefined

  const columns: Column<BoardTrip>[] = [
    { key: 'route', header: 'ROUTE', cell: (trip) => <RouteCell trip={trip} /> },
    {
      key: 'bus',
      header: 'BUS & DRIVER',
      cell: (trip) => (
        <div className='grid min-w-0'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {trip.vehicle?.name ?? 'No bus'}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {trip.driver?.name ?? 'No driver'}
          </span>
        </div>
      ),
    },
    {
      key: 'planned',
      header: 'PLANNED',
      cell: (trip) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
            {trip.planned_start ?? '—'}
          </span>
          {trip.started_at && (
            <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              Started {clock(trip.started_at)}
            </span>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'STATUS', cell: (trip) => <StatusCell trip={trip} /> },
    { key: 'stops', header: 'STOPS', cell: (trip) => <StopsCell trip={trip} /> },
    { key: 'riders', header: 'BOARDED', cell: (trip) => <RidersCell trip={trip} /> },
    {
      key: 'delay',
      header: 'DELAY',
      hideBelow: 'lg',
      cell: (trip) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {delayText(trip)}
        </span>
      ),
    },
    { key: 'sweep', header: 'SWEEP', hideBelow: 'lg', cell: (trip) => <SweepCell trip={trip} /> },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      cell: (trip) =>
        trip.trip_id ? (
          <Button size='sm' variant='outline' asChild>
            <Link
              to='/fleet/trips/$tripId'
              params={{ tripId: trip.trip_id }}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Open trip ${trip.route.name} ${KIND_LABEL[trip.kind]}`}
            >
              <RouteIcon className='size-3.5' />
              Open
            </Link>
          </Button>
        ) : null,
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Transport operations'
        description='Every route’s pickup and drop for the day: whether it started on time, where the bus is, who boarded and whether the driver checked the bus was empty at the end.'
        actions={
          <OpsDayBar id='ops-date' day={day} live={live} onChange={(date) => setSearch({ date })} />
        }
      />

      {board.isError && !data ? (
        <Card>
          <ErrorState message={board.error.message} onRetry={() => board.refetch()} />
        </Card>
      ) : (
        <>
          <ExceptionsPanel items={data?.exceptions} loading={board.isPending} />

          <StudentsTodayPanel day={day} live={live} />

          <InsightCards items={cards} loading={board.isPending} />

          <Card className='overflow-hidden'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
              <h2 className='text-sm font-bold text-slate-900 dark:text-slate-100'>
                {filter ? `${BOARD_STATUS[filter].label} trips` : 'All trips'}
              </h2>
              <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
                {rows.length} {rows.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(trip) => `${trip.route.id}-${trip.kind}`}
              loading={board.isFetching && !data}
              onRowClick={(trip) => void openTrip(trip)}
              empty={{
                icon: filter ? CircleOff : RouteIcon,
                title: filter ? 'No trips with this status' : 'No routes run on this day',
                description: filter
                  ? 'Pick another card to see other trips.'
                  : 'Active routes with a bus appear here with their pickup and drop.',
              }}
              card={(trip) => (
                <div className='grid gap-2'>
                  <div className='flex items-start justify-between gap-3'>
                    <RouteCell trip={trip} />
                    <StatusCell trip={trip} />
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {trip.vehicle?.name ?? 'No bus'} · {trip.driver?.name ?? 'No driver'} · Planned{' '}
                    {trip.planned_start ?? '—'}
                    {trip.delay_minutes ? ` · ${trip.delay_minutes} min late` : ''}
                  </span>
                  <div className='flex flex-wrap items-start gap-6'>
                    <StopsCell trip={trip} />
                    <RidersCell trip={trip} />
                    <SweepCell trip={trip} />
                  </div>
                </div>
              )}
            />
          </Card>
        </>
      )}
    </Page>
  )
}
