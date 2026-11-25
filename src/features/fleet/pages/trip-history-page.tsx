import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, ClipboardCheck, History, PlayCircle, Route as RouteIcon } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { useBusOptions, useBusRoutes } from '@/features/transport/api'
import { formatDate } from '@/lib/format'
import { useTrips, type Trip } from '../api'
import { TripChecklistModal } from '../components/trip-checklist-modal'
import { TrackingBadge, TripStatusBadge } from '../components/trips-panel'
import {
  END_REASON,
  TRIP_FLAG_OPTIONS,
  TRIP_KIND,
  TRIP_STATUS_OPTIONS,
  clock,
  durationText,
} from '../labels'
import type { TripHistorySearch } from '../search'

const route = getRouteApi('/_app/fleet/history')
const LIMIT = 20

const tripSeconds = (trip: Trip) =>
  trip.ended_at
    ? Math.max(0, (new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 1000)
    : null

function BoardingFlags({ trip }: { trip: Trip }) {
  if (!trip.flags) return <span className='text-xs text-muted-foreground'>After the trip ends</span>
  const { not_alighted, not_boarded } = trip.flags
  if (!not_alighted && !not_boarded) return <Badge tone='success'>All marked</Badge>
  return (
    <span className='flex flex-wrap gap-1'>
      {not_alighted > 0 && <Badge tone='danger'>{not_alighted} not marked off</Badge>}
      {not_boarded > 0 && <Badge tone='warning'>{not_boarded} never got on</Badge>}
    </span>
  )
}

export function TripHistoryPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/fleet/history' })
  const trips = useTrips({ ...search, limit: LIMIT }, false)
  const routes = useBusRoutes()
  const busOptions = useBusOptions()
  const rows = trips.data?.items ?? []
  const [checklistTrip, setChecklistTrip] = useState<number | null>(null)

  const setSearch = (patch: Partial<TripHistorySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const open = (trip: Trip) =>
    trip.status === 'ended'
      ? navigate({ to: '/fleet/trips/$tripId/playback', params: { tripId: trip.id } })
      : navigate({ to: '/fleet/trips/$tripId', params: { tripId: trip.id } })

  useShortcut('app.refresh', () => void trips.refetch())

  const filtered = Boolean(
    search.date || search.route_id || search.vehicle_id || search.status || search.flag
  )

  const columns: Column<Trip>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (trip) => (
        <div className='grid'>
          <span className='font-semibold'>{formatDate(trip.trip_date)}</span>
          <span className='text-xs text-muted-foreground'>{TRIP_KIND[trip.kind]}</span>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      cell: (trip) => <span className='font-bold'>{trip.route.name}</span>,
    },
    {
      key: 'bus',
      header: 'Bus',
      cell: (trip) => (
        <div className='grid'>
          <span className='font-semibold'>{trip.vehicle.name}</span>
          <span className='font-mono text-xs text-muted-foreground'>
            {trip.vehicle.registration_no}
          </span>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      cell: (trip) => (
        <div className='grid'>
          <span className='tabular'>
            {clock(trip.started_at)} – {trip.ended_at ? clock(trip.ended_at) : 'now'}
          </span>
          <span className='text-xs text-muted-foreground'>{durationText(tripSeconds(trip))}</span>
        </div>
      ),
    },
    {
      key: 'stops',
      header: 'Stops',
      hideBelow: 'lg',
      cell: (trip) => (
        <span className='tabular'>
          {trip.stops_done} of {trip.stops_total}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (trip) => (
        <div className='grid justify-items-start gap-1'>
          <span className='flex flex-wrap gap-1'>
            <TripStatusBadge trip={trip} />
            <TrackingBadge trip={trip} />
          </span>
          {trip.end_reason && END_REASON[trip.end_reason] && (
            <span className='text-xs text-muted-foreground'>{END_REASON[trip.end_reason]}</span>
          )}
          {trip.swept_at && (
            <span className='text-xs text-muted-foreground'>Swept {clock(trip.swept_at)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'boarding',
      header: 'Boarding',
      cell: (trip) => <BoardingFlags trip={trip} />,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-56',
      cell: (trip) => (
        <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant='outline'
            aria-label={`Boarding checklist for trip ${trip.route.name}`}
            onClick={(event) => {
              event.stopPropagation()
              setChecklistTrip(trip.id)
            }}
          >
            <ClipboardCheck />
            Checklist
          </Button>
          <Button
            size='sm'
            variant='outline'
            aria-label={`${trip.status === 'ended' ? 'Replay' : 'Open'} trip ${trip.route.name}`}
            onClick={(event) => {
              event.stopPropagation()
              void open(trip)
            }}
          >
            {trip.status === 'ended' ? <PlayCircle /> : <RouteIcon />}
            {trip.status === 'ended' ? 'Replay' : 'Live'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Trip history'
        description='Every trip by date, route and bus. Open an ended trip to replay where the bus went, when it reached each stop and any safety events.'
      />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            trips.data ? `${trips.data.total} ${trips.data.total === 1 ? 'trip' : 'trips'}` : ''
          }
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <Input
            type='date'
            aria-label='Trip date'
            max={today()}
            value={search.date ?? ''}
            onChange={(event) => setSearch({ date: event.target.value || undefined })}
            className='w-full sm:w-44'
          />
          <FilterSelect
            id='history-route'
            label='Filter by route'
            allLabel='All routes'
            value={search.route_id ? String(search.route_id) : undefined}
            options={(routes.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: item.code,
            }))}
            onChange={(value) => setSearch({ route_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='history-bus'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='history-status'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={TRIP_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as TripHistorySearch['status'] })}
          />
          <FilterSelect
            id='history-flag'
            label='Filter by boarding problem'
            allLabel='All trips'
            value={search.flag}
            options={TRIP_FLAG_OPTIONS}
            onChange={(value) => setSearch({ flag: value as TripHistorySearch['flag'] })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(trip) => trip.id}
          loading={trips.isFetching}
          error={trips.isError ? trips.error.message : null}
          onRetry={() => trips.refetch()}
          onRowClick={(trip) => void open(trip)}
          empty={{
            icon: filtered ? CircleOff : History,
            title: filtered ? 'No trips match these filters' : 'No trips yet',
            description: filtered
              ? 'Try another date, route or bus, or clear the filters.'
              : 'Trips appear here once drivers start them from the app.',
          }}
          card={(trip) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='truncate font-bold'>{trip.route.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {trip.vehicle.name} · {TRIP_KIND[trip.kind]}
                  </span>
                </div>
                <TripStatusBadge trip={trip} />
              </div>
              <span className='tabular text-xs text-muted-foreground'>
                {formatDate(trip.trip_date)} · {clock(trip.started_at)} –{' '}
                {trip.ended_at ? clock(trip.ended_at) : 'now'} · {trip.stops_done} of{' '}
                {trip.stops_total} stops
              </span>
              <BoardingFlags trip={trip} />
              <Button
                size='sm'
                variant='outline'
                className='justify-self-start'
                onClick={(event) => {
                  event.stopPropagation()
                  setChecklistTrip(trip.id)
                }}
              >
                <ClipboardCheck />
                Checklist
              </Button>
              <span className='flex items-center gap-1.5 text-xs font-semibold text-primary'>
                {trip.status === 'ended' ? (
                  <PlayCircle className='size-3.5' />
                ) : (
                  <RouteIcon className='size-3.5' />
                )}
                {trip.status === 'ended' ? 'Replay trip' : 'Watch live'}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: trips.data?.total ?? 0,
            label: 'trips',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>
      <TripChecklistModal
        tripId={checklistTrip}
        onOpenChange={(open) => !open && setChecklistTrip(null)}
      />
    </Page>
  )
}
