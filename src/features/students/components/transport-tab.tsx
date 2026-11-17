import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  Bus,
  ClipboardCheck,
  History,
  ListOrdered,
  Plus,
  UserMinus,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Section } from '@/features/setup/components/setup-shared'
import { run } from '@/features/setup/form-actions'
import { useStudentTrips, type BoardingMark } from '@/features/fleet/api'
import { BOARDING_METHOD, RIDER_STATUS, TRIP_FLAG, TRIP_KIND, clock } from '@/features/fleet/labels'
import {
  transportApi,
  useBusRoutes,
  useStudentTransport,
  useTransportHistory,
  useTransportMutation,
  type TransportChange,
  type TransportChangePlace,
} from '@/features/transport/api'
import { AssignTransportModal } from '@/features/transport/components/assign-transport-modal'
import { MODE_LABELS, rupees } from '@/features/transport/labels'
import { formatDate, formatDateTime } from '@/lib/format'

const ACTION: Record<
  TransportChange['action'],
  { label: string; tone: 'success' | 'info' | 'danger' }
> = {
  assigned: { label: 'Assigned', tone: 'success' },
  moved: { label: 'Moved', tone: 'info' },
  removed: { label: 'Removed', tone: 'danger' },
}

const markText = (label: string, mark: BoardingMark | null) =>
  mark
    ? `${label} ${clock(mark.at)}${mark.stop ? ` at ${mark.stop.name}` : ''} · ${BOARDING_METHOD[mark.method]}`
    : null

const placeText = (place: TransportChangePlace) =>
  `${place.route.name} · ${place.stop.name}${place.drop_stop ? ` → drop ${place.drop_stop.name}` : ''}`

export function TransportTab({
  studentId,
  studentName,
  canView,
  canManage,
}: {
  studentId: number
  studentName: string
  canView: boolean
  canManage: boolean
}) {
  if (!canView) {
    return (
      <Section title='Bus'>
        <EmptyState
          icon={Bus}
          title='Bus details are hidden'
          description='You need access to Fleet to see this student’s route and stop.'
          className='py-6'
        />
      </Section>
    )
  }
  return <TransportDetails studentId={studentId} studentName={studentName} canManage={canManage} />
}

function TransportDetails({
  studentId,
  studentName,
  canManage,
}: {
  studentId: number
  studentName: string
  canManage: boolean
}) {
  const transport = useStudentTransport(studentId)
  const history = useTransportHistory(studentId)
  const routes = useBusRoutes()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const remove = useTransportMutation(() => transportApi.removeRider(studentId))
  const rider = transport.data ?? null
  const route = rider ? (routes.data ?? []).find((item) => item.id === rider.route.id) : undefined

  return (
    <div className='grid gap-6 xl:grid-cols-[3fr_2fr]'>
      <Section
        title='Bus'
        description='Route, morning pickup and evening drop. Parents and the bus crew are told about every change.'
        action={
          canManage &&
          rider && (
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' variant='outline' onClick={() => setEditing(true)}>
                <ArrowRightLeft />
                Change
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='text-destructive hover:bg-destructive/10'
                onClick={() => setRemoving(true)}
              >
                <UserMinus />
                Remove
              </Button>
            </div>
          )
        }
      >
        {transport.isPending ? (
          <Skeleton className='h-40' />
        ) : transport.isError ? (
          <ErrorState message={transport.error.message} onRetry={() => transport.refetch()} />
        ) : !rider ? (
          <EmptyState
            icon={Bus}
            title='No bus stop yet'
            description='Give this student a route and stop so the driver, attendant and parents can follow the bus.'
            className='py-6'
            action={
              canManage && (
                <Button onClick={() => setEditing(true)}>
                  <Plus />
                  Assign a bus stop
                </Button>
              )
            }
          />
        ) : (
          <div className='grid gap-4'>
            <DetailList
              items={[
                { label: 'Route', value: rider.route.name },
                {
                  label: 'Bus',
                  value: route?.vehicle
                    ? `${route.vehicle.registration_no} · ${route.vehicle.name}`
                    : 'No bus on this route yet',
                },
                {
                  label: 'Morning pickup',
                  value:
                    rider.mode === 'drop'
                      ? 'Does not use the morning bus'
                      : `${rider.stop.name}${rider.stop.pickup_time ? ` · ${rider.stop.pickup_time}` : ''}`,
                },
                {
                  label: 'Evening drop',
                  value:
                    rider.mode === 'pickup'
                      ? 'Does not use the evening bus'
                      : rider.drop_stop
                        ? `${rider.drop_stop.name}${rider.drop_stop.drop_time ? ` · ${rider.drop_stop.drop_time}` : ''}`
                        : `${rider.stop.name}${rider.stop.drop_time ? ` · ${rider.stop.drop_time}` : ''}`,
                },
                { label: 'Uses the bus for', value: MODE_LABELS[rider.mode] },
                { label: 'From', value: formatDate(rider.start_date) },
                { label: 'Fee a month', value: rupees(rider.monthly_fee) },
              ]}
            />
            <Button size='sm' variant='outline' asChild className='justify-self-start'>
              <Link to='/transport/routes/$routeId/students' params={{ routeId: rider.route.id }}>
                <ListOrdered />
                Route student list
              </Link>
            </Button>
          </div>
        )}
      </Section>

      <Section title='Changes' description='Every assignment, move and removal, newest first.'>
        {history.isPending ? (
          <Skeleton className='h-32' />
        ) : history.isError ? (
          <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
        ) : !history.data?.length ? (
          <EmptyState icon={History} title='No changes yet' className='py-6' />
        ) : (
          <ol className='grid gap-3'>
            {history.data.map((change) => (
              <li key={change.id} className='grid gap-1 rounded-xl border p-3 text-sm'>
                <span className='flex flex-wrap items-center gap-2'>
                  <Badge tone={ACTION[change.action].tone}>{ACTION[change.action].label}</Badge>
                  <span className='text-xs text-muted-foreground'>
                    {formatDateTime(change.at)}
                    {change.by ? ` · ${change.by.name}` : ''}
                  </span>
                </span>
                {change.from && change.action !== 'assigned' && (
                  <span className='text-muted-foreground'>From {placeText(change.from)}</span>
                )}
                {change.to && <span className='font-medium'>To {placeText(change.to)}</span>}
                {change.mode && change.action !== 'removed' && change.mode !== 'both' && (
                  <span className='text-xs text-muted-foreground'>{MODE_LABELS[change.mode]}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <BusBoarding studentId={studentId} />

      <AssignTransportModal
        open={editing}
        onOpenChange={setEditing}
        rider={rider}
        student={{ id: studentId, full_name: studentName }}
      />
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Take ${studentName} off the bus?`}
        description='The student no longer has a bus stop. Parents and the bus crew are told, and parents stop getting bus alerts.'
        confirmText='Remove from bus'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          await run(() => remove.mutateAsync(undefined), `${studentName} taken off the bus`)
          setRemoving(false)
        }}
      />
    </div>
  )
}

function BusBoarding({ studentId }: { studentId: number }) {
  const [page, setPage] = useState(1)
  const trips = useStudentTrips(studentId, page)
  const data = trips.data
  return (
    <div className='xl:col-span-2'>
      <Section
        title='Bus boarding'
        description='Each trip in the last 30 days: when and where the student got on and off, as the attendant marked it.'
      >
        {trips.isPending ? (
          <Skeleton className='h-32' />
        ) : trips.isError ? (
          <ErrorState message={trips.error.message} onRetry={() => trips.refetch()} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={ClipboardCheck}
            title='No bus trips yet'
            description='Trips appear here once the driver starts them from the app.'
            className='py-6'
          />
        ) : (
          <div className='grid gap-3'>
            <ol className='grid divide-y rounded-xl border'>
              {data.items.map((trip) => {
                const marks = [markText('On', trip.boarded), markText('Off', trip.alighted)].filter(
                  Boolean
                )
                return (
                  <li
                    key={trip.trip_id}
                    className='flex flex-wrap items-start gap-x-3 gap-y-1 p-3 text-sm'
                  >
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='font-semibold'>
                        {formatDate(trip.trip_date)} · {TRIP_KIND[trip.kind]}
                      </span>
                      <span className='text-xs text-muted-foreground'>{trip.route.name}</span>
                      {marks.map((text) => (
                        <span key={text} className='text-xs text-muted-foreground'>
                          {text}
                        </span>
                      ))}
                    </span>
                    <span className='flex flex-wrap justify-end gap-1'>
                      {trip.flag ? (
                        <Badge tone={TRIP_FLAG[trip.flag].tone}>{TRIP_FLAG[trip.flag].label}</Badge>
                      ) : (
                        <Badge tone={RIDER_STATUS[trip.status].tone}>
                          {trip.status === 'away' && trip.away_note
                            ? trip.away_note
                            : RIDER_STATUS[trip.status].label}
                        </Badge>
                      )}
                    </span>
                  </li>
                )
              })}
            </ol>
            {data.total_pages > 1 && (
              <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                <span>
                  Page {data.page} of {data.total_pages}
                </span>
                <span className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Newer
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={!data.has_next}
                    onClick={() => setPage(page + 1)}
                  >
                    Older
                  </Button>
                </span>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}
