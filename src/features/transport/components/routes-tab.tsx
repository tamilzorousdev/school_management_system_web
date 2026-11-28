import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  Map as MapIcon,
  PenLine,
  Plus,
  Radio,
  Route as RouteIcon,
  Undo2,
  UsersRound,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { TrashIcon } from '@/components/common/icon'
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
import { SwapBusModal } from './swap-bus-modal'

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
  const [swapping, setSwapping] = useState<BusRoute | null>(null)
  const undoSwap = useTransportMutation((id: number) => transportApi.clearSwap(id))
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
            <Radio className='size-3.5 text-success' />
            Open live trip
          </Button>
        )}
        <Button size='sm' variant='outline' onClick={() => openBuilder(route.id)}>
          <MapIcon className='size-3.5' />
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
          <UsersRound className='size-3.5' />
          Students
        </Button>
        {canManage && route.is_active && route.vehicle && !route.swap_today && (
          <Button size='sm' variant='outline' onClick={() => setSwapping(route)}>
            <ArrowLeftRight className='size-3.5' />
            Bus for a day
          </Button>
        )}
        {canManage && route.swap_today && (
          <Button
            size='sm'
            variant='outline'
            loading={undoSwap.isPending && undoSwap.variables === route.id}
            onClick={() =>
              void run(() => undoSwap.mutateAsync(route.id), `${route.code} back to its usual bus`)
            }
          >
            <Undo2 className='size-3.5' />
            Usual bus today
          </Button>
        )}
        {canManage && (
          <>
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={`Edit route ${route.code}`}
              title='Edit'
              className='text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              onClick={() => setEditing(route)}
            >
              <PenLine className='size-4' />
            </Button>
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={`Delete route ${route.code}`}
              title='Delete'
              className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] dark:text-red-400 dark:hover:bg-destructive/10 dark:hover:text-red-300'
              onClick={() => setRemoving(route)}
            >
              <TrashIcon className='size-4' />
            </Button>
          </>
        )}
      </span>
    )
  }

  const title = (route: BusRoute) => (
    <span className='flex min-w-0 items-center gap-2'>
      <Badge tone='info' className='font-mono font-medium'>
        {route.code}
      </Badge>
      <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
        {route.name}
      </span>
      {!route.is_active && <Badge className='font-medium'>Not running</Badge>}
      {route.problems > 0 && (
        <Badge tone='danger' className='font-medium'>
          {route.problems} time {route.problems === 1 ? 'problem' : 'problems'}
        </Badge>
      )}
    </span>
  )

  const columns: Column<BusRoute>[] = [
    { key: 'route', header: 'ROUTE', cell: title },
    {
      key: 'bus',
      header: 'BUS',
      cell: (route) => (
        <span className='grid gap-1'>
          {route.vehicle ? (
            <span
              className={cn(
                'font-mono text-[12px] leading-[16px] font-semibold text-slate-900 dark:text-slate-100',
                route.swap_today && 'text-slate-400 line-through'
              )}
            >
              {route.vehicle.registration_no}
            </span>
          ) : (
            <span className='text-[13px] leading-[18px] text-slate-400'>No bus</span>
          )}
          {route.swap_today && (
            <Badge tone='warning' className='font-medium' title={route.swap_today.reason ?? undefined}>
              Today: {route.swap_today.vehicle.name}
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: 'stops',
      header: 'STOPS',
      cell: (route) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {route.stops}
        </span>
      ),
    },
    { key: 'students', header: 'STUDENTS', cell: (route) => <Riders route={route} /> },
    {
      key: 'first',
      header: 'MORNING · EVENING',
      hideBelow: 'lg',
      cell: (route) => (
        <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
          {routeWindow(route.timings)}
        </span>
      ),
    },
    { key: 'actions', header: 'ACTION', align: 'right', cell: actions },
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
          <Button variant='primary' size='sm' onClick={() => setEditing('new')}>
            <Plus className='size-3.5' />
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
            <Button variant='primary' size='sm' onClick={() => setEditing('new')}>
              <Plus className='size-3.5' />
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
      {swapping && <SwapBusModal route={swapping} onClose={() => setSwapping(null)} />}
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
