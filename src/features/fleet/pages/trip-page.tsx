import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  CircleStop,
  ClipboardCheck,
  Clock,
  Flag,
  Gauge,
  ListChecks,
  MapPin,
  PlayCircle,
  Route as RouteIcon,
  ScanLine,
  Users,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatNumber } from '@/lib/format'
import { useLiveEvent, useLiveSubscription } from '@/lib/live/socket'
import { fleetApi, fleetKeys, useTrip, useTripMutation, type TripDetail } from '../api'
import { LiveBadge } from '../components/live-badge'
import { TripMap } from '../components/trip-map'
import { BoardingLog } from '../components/boarding-log'
import { HandoverModal } from '../components/handover-modal'
import { TripChecklistModal } from '../components/trip-checklist-modal'
import { EventLog, NotBoarded, StopTimeline } from '../components/trip-timeline'
import { TripStatusBadge } from '../components/trips-panel'
import {
  END_REASON,
  TRIP_KIND,
  applyEvent,
  applyPosition,
  clock,
  destinationLabel,
  etaText,
  secondsAgo,
  showTripToast,
} from '../labels'

const route = getRouteApi('/_app/fleet/trips/$tripId')

function Tile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='grid min-w-0 content-start gap-1 rounded-lg border bg-card p-3'>
      <span className='flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        <Icon className='size-3.5' />
        {label}
      </span>
      <div className='min-w-0 text-sm font-semibold break-words'>{children}</div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof Clock
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <h2 className='flex items-center gap-2 border-b px-4 py-3 font-bold'>
        <Icon className='size-4 text-primary' />
        {title}
      </h2>
      {children}
    </Card>
  )
}

export function TripPage() {
  const { tripId } = route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canManage = can(useMe().data, 'fleet.manage')
  const live = useLiveSubscription('trip.subscribe', { trip_id: tripId })
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [handingOver, setHandingOver] = useState(false)
  const detail = useTrip(tripId, !live.live)
  const now = useNow(1000)
  const end = useTripMutation((id: number) => fleetApi.endTrip(id))
  const trip = detail.data

  useLiveEvent('trip.position', (message) => {
    if (message.trip_id !== tripId) return
    queryClient.setQueryData<TripDetail>(
      fleetKeys.trip(tripId),
      (current) => applyPosition(current, message),
      { updatedAt: queryClient.getQueryState(fleetKeys.trip(tripId))?.dataUpdatedAt }
    )
  })

  useLiveEvent('trip.event', (message) => {
    if (message.trip_id !== tripId) return
    queryClient.setQueryData<TripDetail>(fleetKeys.trip(tripId), (current) =>
      applyEvent(current, message)
    )
    void queryClient.invalidateQueries({ queryKey: fleetKeys.trip(tripId) })
    void queryClient.invalidateQueries({ queryKey: [...fleetKeys.all, 'trips'] })
    showTripToast(message, trip?.vehicle.name ?? 'The bus', trip?.kind, true)
  })

  const refreshBoardings = (message: { trip_id: number }) => {
    if (message.trip_id === tripId)
      void queryClient.invalidateQueries({ queryKey: fleetKeys.trip(tripId) })
  }
  useLiveEvent('passenger.boarded', refreshBoardings)
  useLiveEvent('passenger.alighted', refreshBoardings)

  const back = () => navigate({ to: '/fleet' })

  if (detail.isError && !trip) {
    return (
      <Page>
        <ErrorState
          message={detail.error.isNotFound ? 'This trip does not exist.' : detail.error.message}
          onRetry={() => detail.refetch()}
        />
        <div className='flex justify-center'>
          <Button variant='outline' onClick={back}>
            <ArrowLeft />
            Bus tracking
          </Button>
        </div>
      </Page>
    )
  }

  const elapsed = Math.max(0, Math.round((now - detail.dataUpdatedAt) / 1000))
  const active = trip?.status === 'active'
  const lastUpdate = secondsAgo(trip?.position?.recorded_at, now)
  const destinationEta =
    trip?.destination_eta_seconds !== null && trip?.destination_eta_seconds !== undefined
      ? Math.max(0, trip.destination_eta_seconds - elapsed)
      : null

  const endTrip = async () => {
    try {
      const result = await end.mutateAsync(tripId)
      queryClient.setQueryData(fleetKeys.trip(tripId), result)
      alerts.success('Trip ended')
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setConfirmEnd(false)
    }
  }

  return (
    <Page className='gap-4'>
      <PageHeader
        eyebrow={trip && !active ? 'Trip' : 'Live trip'}
        title={
          trip ? (
            <span className='min-w-0 break-words'>{trip.route.name}</span>
          ) : (
            <span className='inline-block h-8 w-64 max-w-full animate-pulse rounded-md bg-muted' />
          )
        }
        description={
          trip ? (
            <span className='flex flex-wrap items-center gap-2'>
              <span>
                {trip.vehicle.name} ·{' '}
                <span className='font-mono text-xs'>{trip.vehicle.registration_no}</span> ·{' '}
                {TRIP_KIND[trip.kind]}
              </span>
              <TripStatusBadge trip={trip} />
              {trip.handover_of && (
                <Badge tone='info'>
                  <Link to='/fleet/trips/$tripId' params={{ tripId: trip.handover_of }}>
                    Took over a broken-down bus
                  </Link>
                </Badge>
              )}
              {trip.replaced_by && (
                <Badge tone='warning'>
                  <Link to='/fleet/trips/$tripId' params={{ tripId: trip.replaced_by }}>
                    Handed over after a breakdown
                  </Link>
                </Badge>
              )}
              {trip.delay && (
                <Badge tone='warning' title={trip.delay.reason ?? undefined}>
                  About {trip.delay.minutes} min late
                </Badge>
              )}
              {active && <LiveBadge status={live.status} state={live.state} />}
            </span>
          ) : undefined
        }
        actions={
          <>
            <Button variant='outline' onClick={back}>
              <ArrowLeft />
              Bus tracking
            </Button>
            {trip && (
              <Button variant='outline' onClick={() => setShowChecklist(true)}>
                <ClipboardCheck />
                Boarding checklist
              </Button>
            )}
            {trip?.status === 'ended' && (
              <Button variant='outline' asChild>
                <Link to='/fleet/trips/$tripId/playback' params={{ tripId }}>
                  <PlayCircle />
                  Replay
                </Link>
              </Button>
            )}
            {canManage && active && trip && (
              <Button variant='outline' onClick={() => setHandingOver(true)}>
                <ArrowLeftRight />
                Hand over to another bus
              </Button>
            )}
            {canManage && active && (
              <Button variant='destructive' onClick={() => setConfirmEnd(true)}>
                <CircleStop />
                End trip
              </Button>
            )}
          </>
        }
      />

      {trip ? (
        <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
          <Tile icon={Clock} label='Started'>
            {clock(trip.started_at)}
            {trip.started_by && (
              <span className='block text-xs font-normal text-muted-foreground'>
                by {trip.started_by.name}
              </span>
            )}
          </Tile>
          <Tile icon={Flag} label={active ? `${destinationLabel(trip.kind)} in` : 'Ended'}>
            {active ? (
              etaText(destinationEta)
            ) : (
              <>
                {clock(trip.ended_at)}
                {trip.end_reason && END_REASON[trip.end_reason] && (
                  <span className='block text-xs font-normal text-muted-foreground'>
                    {END_REASON[trip.end_reason]}
                  </span>
                )}
              </>
            )}
          </Tile>
          <Tile icon={ListChecks} label='Stops done'>
            <span className='tabular'>
              {trip.stops_done} of {trip.stops_total}
            </span>
          </Tile>
          <Tile icon={Gauge} label='Bus position'>
            {lastUpdate ? (
              <>
                <span className='tabular' aria-live='off'>
                  Last update {lastUpdate}
                </span>
                <span className='block text-xs font-normal text-muted-foreground'>
                  {formatNumber(trip.position?.speed, 0, 'km/h')}
                  {trip.position?.source === 'phone' ? ' · from driver phone' : ''}
                </span>
              </>
            ) : (
              <span className='text-muted-foreground'>No position yet</span>
            )}
          </Tile>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-20' />
          ))}
        </div>
      )}

      <div className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]'>
        {trip ? (
          <TripMap
            stops={trip.stop_list}
            school={trip.school}
            kind={trip.kind}
            position={trip.position}
            busLabel={trip.vehicle.name}
            className='h-[50vh] min-h-72 lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]'
          />
        ) : (
          <Skeleton className='h-[50vh] min-h-72 rounded-xl lg:h-[calc(100vh-17rem)]' />
        )}
        <Section
          icon={RouteIcon}
          title='Stops'
          className='min-w-0 overflow-hidden lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]'
        >
          <div className='min-h-0 flex-1 overflow-y-auto p-4'>
            {trip ? (
              <StopTimeline trip={trip} elapsed={active ? elapsed : 0} />
            ) : (
              <div className='grid gap-3'>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className='h-16' />
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>

      <div className='grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <Section icon={Bell} title='Events' className='min-w-0 overflow-hidden'>
          {trip ? <EventLog trip={trip} /> : <Skeleton className='m-4 h-24' />}
        </Section>
        <Section icon={ScanLine} title='Boarding' className='min-w-0 overflow-hidden'>
          {trip ? <BoardingLog trip={trip} /> : <Skeleton className='m-4 h-24' />}
        </Section>
        <Section icon={Users} title='Not boarded' className='min-w-0 overflow-hidden'>
          {trip ? <NotBoarded trip={trip} /> : <Skeleton className='m-4 h-24' />}
        </Section>
      </div>

      {trip && !trip.position && active && (
        <p className='flex items-center gap-2 text-xs text-muted-foreground'>
          <MapPin className='size-3.5' />
          The bus appears on the map when its tracker sends the first position.
        </p>
      )}

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title='End this trip?'
        description='Parents stop getting bus alerts for this trip. The driver can start a new trip from the app.'
        confirmText='End trip'
        destructive
        loading={end.isPending}
        onConfirm={() => void endTrip()}
      />
      {handingOver && trip && (
        <HandoverModal
          trip={trip}
          onClose={() => setHandingOver(false)}
          onDone={(result) => {
            setHandingOver(false)
            void navigate({ to: '/fleet/trips/$tripId', params: { tripId: result.new_trip.id } })
          }}
        />
      )}
      <TripChecklistModal tripId={showChecklist ? tripId : null} onOpenChange={setShowChecklist} />
    </Page>
  )
}
