import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Map as MapIcon,
  Pencil,
  Plus,
  Radio,
  Route as RouteIcon,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { today } from '@/features/attendance/labels'
import { useTrips } from '@/features/fleet/api'
import { run } from '@/features/setup/form-actions'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/common/combobox'
import {
  transportApi,
  useBusRoutes,
  useTransportMutation,
  type BusRoute,
  type RouteFlag,
} from '../api'
import { ROUTE_FLAG_LABELS, routeWindow, toOptions } from '../labels'
import { RouteFormModal } from './route-form-modal'

function TripSeats({
  label,
  riders,
  capacity,
}: {
  label: string
  riders: number
  capacity?: number
}) {
  return (
    <span
      className={cn(
        'tabular font-semibold',
        capacity !== undefined && riders > capacity && 'text-destructive'
      )}
    >
      <span className='font-normal text-muted-foreground'>{label} </span>
      {riders}
      {capacity !== undefined && (
        <span className='font-normal text-muted-foreground'>/{capacity}</span>
      )}
    </span>
  )
}

function Riders({ route }: { route: BusRoute }) {
  const capacity = route.vehicle?.capacity
  return (
    <span className='grid gap-0.5 text-sm whitespace-nowrap'>
      <TripSeats label='Morning' riders={route.morning_riders} capacity={capacity} />
      <TripSeats label='Evening' riders={route.evening_riders} capacity={capacity} />
    </span>
  )
}

export function RoutesTab({ canManage }: { canManage: boolean }) {
  const navigate = useNavigate()
  const [flag, setFlag] = useState<RouteFlag>()
  const routes = useBusRoutes(flag)
  const [editing, setEditing] = useState<BusRoute | 'new' | null>(null)
  const [removing, setRemoving] = useState<BusRoute | null>(null)
  const remove = useTransportMutation((id: number) => transportApi.removeRoute(id))
  const rows = routes.data ?? []
  const activeTrips = useTrips({ page: 1, limit: 50, date: today(), status: 'active' }, false)
  const liveTripOf = (routeId: number) =>
    activeTrips.data?.items.find((trip) => trip.route.id === routeId)

  const openBuilder = (id: number) =>
    navigate({ to: '/transport/routes/$routeId', params: { routeId: id } })

  const actions = (route: BusRoute) => {
    const liveTrip = liveTripOf(route.id)
    return (
      <span className='flex flex-wrap items-center justify-end gap-1'>
        {liveTrip && (
          <Button
            size='sm'
            variant='outline'
            aria-label={`Open live trip on route ${route.code}`}
            onClick={() =>
              navigate({ to: '/fleet/trips/$tripId', params: { tripId: liveTrip.id } })
            }
          >
            <Radio className='text-success' />
            Open live trip
          </Button>
        )}
        <Button size='sm' variant='outline' onClick={() => openBuilder(route.id)}>
          <MapIcon />
          Open builder
        </Button>
        <Button
          size='sm'
          variant='outline'
          aria-label={`Student list for route ${route.code}`}
          onClick={() =>
            navigate({ to: '/transport/routes/$routeId/students', params: { routeId: route.id } })
          }
        >
          <UsersRound />
          Students
        </Button>
        {canManage && (
          <>
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={`Edit route ${route.code}`}
              onClick={() => setEditing(route)}
            >
              <Pencil />
            </Button>
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={`Delete route ${route.code}`}
              className='text-destructive hover:bg-destructive/10'
              onClick={() => setRemoving(route)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </span>
    )
  }

  const title = (route: BusRoute) => (
    <span className='flex min-w-0 items-center gap-2'>
      <Badge tone='info' className='font-mono'>
        {route.code}
      </Badge>
      <span className='truncate font-bold'>{route.name}</span>
      {!route.is_active && <Badge>Not running</Badge>}
      {route.problems > 0 && (
        <Badge tone='danger'>
          {route.problems} time {route.problems === 1 ? 'problem' : 'problems'}
        </Badge>
      )}
    </span>
  )

  const columns: Column<BusRoute>[] = [
    { key: 'route', header: 'Route', cell: title },
    {
      key: 'bus',
      header: 'Bus',
      cell: (route) =>
        route.vehicle ? (
          <span className='font-mono text-xs font-semibold'>{route.vehicle.registration_no}</span>
        ) : (
          <span className='text-muted-foreground'>No bus</span>
        ),
    },
    {
      key: 'stops',
      header: 'Stops',
      cell: (route) => <span className='tabular'>{route.stops}</span>,
    },
    { key: 'students', header: 'Students', cell: (route) => <Riders route={route} /> },
    {
      key: 'first',
      header: 'Morning · Evening',
      hideBelow: 'lg',
      cell: (route) => <span className='tabular text-xs'>{routeWindow(route.timings)}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar summary={routes.data ? `${rows.length} routes` : ''}>
        <Combobox
          id='route-flag'
          label='Show routes'
          value={flag}
          options={toOptions(ROUTE_FLAG_LABELS)}
          allLabel='All routes'
          placeholder='All routes'
          onChange={(value) => setFlag(value as RouteFlag | undefined)}
        />
        {canManage && (
          <Button onClick={() => setEditing('new')}>
            <Plus />
            New route
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(route) => route.id}
        loading={routes.isFetching}
        error={routes.isError ? routes.error.message : null}
        onRetry={() => routes.refetch()}
        empty={{
          icon: RouteIcon,
          title: 'No routes yet',
          description: 'Create a route, then add its stops on the map.',
          action: canManage && (
            <Button onClick={() => setEditing('new')}>
              <Plus />
              New route
            </Button>
          ),
        }}
        card={(route) => (
          <div className='grid gap-2'>
            {title(route)}
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              <span>
                Bus{' '}
                <span className='font-mono font-semibold text-foreground'>
                  {route.vehicle?.registration_no ?? 'No bus'}
                </span>
              </span>
              <span>
                <span className='tabular font-semibold text-foreground'>{route.stops}</span> stops
              </span>
              <span>
                Students <Riders route={route} />
              </span>
              <span className='tabular font-semibold text-foreground'>
                {routeWindow(route.timings)}
              </span>
            </div>
            {actions(route)}
          </div>
        )}
      />
      {editing && (
        <RouteFormModal
          route={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onCreated={(created) => openBuilder(created.id)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete route ${removing?.code ?? ''}?`}
        description={
          removing?.students
            ? `${removing.students} students use this route. Move them to another route before deleting it.`
            : 'The route and its stops are deleted.'
        }
        confirmText='Delete route'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing)
            await run(() => remove.mutateAsync(removing.id), `Route ${removing.code} deleted`)
          setRemoving(null)
        }}
      />
    </Card>
  )
}
