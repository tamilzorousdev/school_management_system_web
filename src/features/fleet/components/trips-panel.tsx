import { Link } from '@tanstack/react-router'
import { Bus, Play, Route as RouteIcon } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Trip } from '../api'
import {
  END_REASON,
  TRIP_KIND,
  TRIP_STATUS,
  TRIP_TRACKING,
  clock,
  destinationLabel,
  etaText,
} from '../labels'

interface TripsPanelProps {
  trips: Trip[] | undefined
  loading: boolean
  error: string | null
  onRetry: () => void
  canManage: boolean
  onStart: () => void
  className?: string
}

export function TripStatusBadge({ trip }: { trip: Pick<Trip, 'status'> }) {
  const status = TRIP_STATUS[trip.status]
  return (
    <Badge tone={status.tone} dot pulse={trip.status === 'active'} className='font-medium'>
      {status.label}
    </Badge>
  )
}

export function TrackingBadge({ trip }: { trip: Pick<Trip, 'tracking'> }) {
  if (!trip.tracking) return null
  const tracking = TRIP_TRACKING[trip.tracking]
  return (
    <Badge tone={tracking.tone} title={tracking.hint} className='font-medium'>
      {tracking.label}
    </Badge>
  )
}

function TripRow({ trip }: { trip: Trip }) {
  const label = `${trip.route.name}, ${TRIP_KIND[trip.kind]}`
  return (
    <li className='grid gap-2 border-b px-4 py-3 last:border-0'>
      <div className='flex min-w-0 items-start justify-between gap-3'>
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-bold'>{trip.route.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {trip.vehicle.name} · {TRIP_KIND[trip.kind]} · Started {clock(trip.started_at)}
          </span>
        </div>
        <span className='flex shrink-0 items-center gap-1'>
          <TrackingBadge trip={trip} />
          <TripStatusBadge trip={trip} />
        </span>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='tabular text-xs text-muted-foreground'>
          <span className='font-semibold text-foreground'>
            {trip.stops_done} of {trip.stops_total}
          </span>{' '}
          stops done
          {trip.status === 'active' && trip.destination_eta_seconds !== null && (
            <>
              {' · '}
              {destinationLabel(trip.kind)} in{' '}
              <span className='font-semibold text-foreground'>
                {etaText(trip.destination_eta_seconds)}
              </span>
            </>
          )}
          {trip.status === 'ended' && (
            <>
              {' · '}Ended {clock(trip.ended_at)}
              {trip.end_reason && END_REASON[trip.end_reason]
                ? ` · ${END_REASON[trip.end_reason]}`
                : ''}
              {trip.swept_at ? ` · Swept ${clock(trip.swept_at)}` : ''}
            </>
          )}
        </span>
        <Button size='sm' variant='outline' asChild>
          <Link
            to='/fleet/trips/$tripId'
            params={{ tripId: trip.id }}
            aria-label={`Open trip ${label}`}
          >
            <RouteIcon />
            Open
          </Link>
        </Button>
      </div>
    </li>
  )
}

export function TripsPanel({
  trips,
  loading,
  error,
  onRetry,
  canManage,
  onStart,
  className,
}: TripsPanelProps) {
  const active = trips?.filter((trip) => trip.status === 'active').length ?? 0
  return (
    <Card className={className}>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
        <div className='grid'>
          <h2 className='flex items-center gap-2 font-bold'>
            <Bus className='size-4 text-primary' />
            Trips today
          </h2>
          {trips && (
            <span className='text-xs text-muted-foreground'>
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} · {active} on the road
            </span>
          )}
        </div>
        {canManage && (
          <Button size='sm' onClick={onStart}>
            <Play />
            Start trip
          </Button>
        )}
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {error && !trips ? (
          <ErrorState message={error} onRetry={onRetry} className='py-8' />
        ) : loading && !trips ? (
          <div className='grid gap-2 p-4'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-16' />
            ))}
          </div>
        ) : !trips?.length ? (
          <EmptyState
            icon={Bus}
            title='No trips yet today'
            description='A trip starts when the driver taps Start in the app.'
            action={
              canManage && (
                <Button variant='outline' onClick={onStart}>
                  <Play />
                  Start trip
                </Button>
              )
            }
          />
        ) : (
          <ul aria-label='Trips today'>
            {trips.map((trip) => (
              <TripRow key={trip.id} trip={trip} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
