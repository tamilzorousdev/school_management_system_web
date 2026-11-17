import { getRouteApi, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Download,
  MapPin,
  Moon,
  Pencil,
  Printer,
  SearchX,
  Sun,
  UsersRound,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRouteRoster, type RosterStudent, type RouteRoster } from '../api'
import { MODE_LABELS } from '../labels'

const route = getRouteApi('/_app/transport/routes/$routeId/students')

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

function exportCsv(roster: RouteRoster) {
  const header = [
    'Stop no.',
    'Stop',
    'Trip',
    'Time',
    'Student',
    'Admission no.',
    'Class',
    'Uses the bus for',
    'Parent',
    'Parent mobile',
  ]
  const lines = roster.stops.flatMap((stop) =>
    (
      [
        ['Morning pickup', stop.pickup_time, stop.pickup_students],
        ['Evening drop', stop.drop_time, stop.drop_students],
      ] as const
    ).flatMap(([trip, time, students]) =>
      students.map((student) =>
        [
          String(stop.sequence),
          stop.name,
          trip,
          time ?? '',
          student.full_name,
          student.admission_no,
          student.class_section ?? '',
          MODE_LABELS[student.mode],
          student.guardian_name ?? '',
          student.guardian_mobile ?? '',
        ]
          .map(csvCell)
          .join(',')
      )
    )
  )
  const blob = new Blob([[header.map(csvCell).join(','), ...lines].join('\n')], {
    type: 'text/csv',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `route-${roster.code}-students.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function RouteRosterPage() {
  const { routeId } = route.useParams()
  const roster = useRouteRoster(routeId)

  useShortcut('app.refresh', () => void roster.refetch())

  if (roster.isPending) return <RosterSkeleton />

  if (roster.isError) {
    return (
      <Page>
        <Card>
          {roster.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Route not found'
              description='It may have been deleted, or the link is wrong.'
              action={
                <Button asChild variant='outline'>
                  <Link to='/transport' search={{ tab: 'routes' }}>
                    Back to routes
                  </Link>
                </Button>
              }
            />
          ) : (
            <ErrorState message={roster.error.message} onRetry={() => roster.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  const data = roster.data
  const capacity = data.vehicle?.capacity ?? null
  const riders = new Set(
    data.stops.flatMap((stop) => [...stop.pickup_students, ...stop.drop_students].map((s) => s.id))
  ).size

  return (
    <Page>
      <Link
        to='/transport'
        search={{ tab: 'students', route_id: data.id }}
        className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden'
      >
        <ArrowLeft className='size-4' />
        Students on the bus
      </Link>

      <PageHeader
        eyebrow='Route student list'
        title={`${data.code} · ${data.name}`}
        description={
          data.vehicle
            ? `${data.vehicle.registration_no} · ${data.vehicle.name} · ${riders} ${riders === 1 ? 'student' : 'students'} on this route`
            : `No bus on this route yet · ${riders} ${riders === 1 ? 'student' : 'students'}`
        }
        actions={
          <div className='flex flex-wrap gap-2 print:hidden'>
            <Button variant='outline' onClick={() => window.print()}>
              <Printer />
              Print
            </Button>
            <Button variant='outline' onClick={() => exportCsv(data)} disabled={!riders}>
              <Download />
              CSV
            </Button>
            <Button variant='outline' asChild>
              <Link to='/transport/routes/$routeId' params={{ routeId: data.id }}>
                <Pencil />
                Route builder
              </Link>
            </Button>
          </div>
        }
      />

      <div className='grid gap-3 sm:grid-cols-2'>
        <SeatCard
          icon={Sun}
          label='Morning pickup'
          route={data.morning_riders}
          bus={data.bus_morning_riders}
          capacity={capacity}
        />
        <SeatCard
          icon={Moon}
          label='Evening drop'
          route={data.evening_riders}
          bus={data.bus_evening_riders}
          capacity={capacity}
        />
      </div>

      {data.stops.length === 0 ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title='This route has no stops yet'
            description='Add stops in the route builder, then assign students to them.'
          />
        </Card>
      ) : (
        <ol className='grid gap-4'>
          {data.stops.map((stop) => (
            <li key={stop.id} id={`stop-${stop.id}`} className='scroll-mt-20 break-inside-avoid'>
              <Card className='overflow-hidden'>
                <div className='flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5'>
                  <span className='grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                    {stop.sequence}
                  </span>
                  <span className='grid min-w-0 flex-1'>
                    <span className='truncate font-bold'>{stop.name}</span>
                    {stop.landmark && (
                      <span className='truncate text-xs text-muted-foreground'>
                        {stop.landmark}
                      </span>
                    )}
                  </span>
                  <span className='tabular text-xs text-muted-foreground'>
                    Pickup {stop.pickup_time ?? '—'} · Drop {stop.drop_time ?? '—'}
                  </span>
                </div>
                <div className='grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0'>
                  <StudentList icon={Sun} title='Picked up here' students={stop.pickup_students} />
                  <StudentList icon={Moon} title='Dropped here' students={stop.drop_students} />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </Page>
  )
}

function SeatCard({
  icon: Icon,
  label,
  route: onRoute,
  bus,
  capacity,
}: {
  icon: typeof Sun
  label: string
  route: number
  bus: number
  capacity: number | null
}) {
  const percent = capacity ? Math.min(100, Math.round((bus / capacity) * 100)) : 0
  const full = capacity !== null && bus >= capacity
  return (
    <Card className='gap-2 p-4'>
      <div className='flex items-center gap-2 text-sm font-semibold'>
        <Icon className='size-4 text-muted-foreground' />
        {label}
        <span className='tabular ml-auto'>
          {onRoute} on this route
          {capacity !== null && (
            <span className='text-muted-foreground'>
              {' '}
              · {bus}/{capacity} on the bus
            </span>
          )}
        </span>
      </div>
      {capacity !== null && (
        <div className='h-2 overflow-hidden rounded-full bg-muted'>
          <div
            className={cn('h-full rounded-full', full ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {full && <p className='text-xs font-medium text-destructive'>No seats left on this trip</p>}
    </Card>
  )
}

function StudentList({
  icon: Icon,
  title,
  students,
}: {
  icon: typeof Sun
  title: string
  students: RosterStudent[]
}) {
  return (
    <div className='grid content-start gap-2 p-4 sm:px-5'>
      <h3 className='flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase'>
        <Icon className='size-3.5' />
        {title}
        <Badge tone={students.length ? 'info' : 'neutral'}>{students.length}</Badge>
      </h3>
      {students.length === 0 ? (
        <p className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <UsersRound className='size-4' />
          Nobody
        </p>
      ) : (
        <ul className='grid divide-y'>
          {students.map((student) => (
            <li key={student.id} className='flex flex-wrap items-start gap-x-3 gap-y-0.5 py-2'>
              <span className='grid min-w-0 flex-1'>
                <span className='truncate font-semibold'>{student.full_name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  <span className='font-mono'>{student.admission_no}</span>
                  {student.class_section ? ` · ${student.class_section}` : ''}
                  {student.mode !== 'both' ? ` · ${MODE_LABELS[student.mode]}` : ''}
                </span>
              </span>
              {student.guardian_mobile && (
                <span className='tabular text-xs text-muted-foreground'>
                  {student.guardian_name ? `${student.guardian_name} · ` : ''}+91{' '}
                  {student.guardian_mobile}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RosterSkeleton() {
  return (
    <Page>
      <Skeleton className='h-5 w-40' />
      <Skeleton className='h-16 w-full' />
      <div className='grid gap-3 sm:grid-cols-2'>
        <Skeleton className='h-20' />
        <Skeleton className='h-20' />
      </div>
      <Skeleton className='h-40 w-full' />
      <Skeleton className='h-40 w-full' />
    </Page>
  )
}
