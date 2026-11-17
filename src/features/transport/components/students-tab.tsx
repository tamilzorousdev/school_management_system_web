import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightLeft, CircleOff, ListOrdered, Plus, UserMinus, UsersRound } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useClasses } from '@/features/setup/api'
import { run } from '@/features/setup/form-actions'
import {
  transportApi,
  useBusRoutes,
  useRiders,
  useRouteDetail,
  useTransportMutation,
  type Rider,
  type RiderSort,
  type TransportMode,
} from '../api'
import { MODE_LABELS, MODE_OPTIONS, rupees } from '../labels'
import { AssignTransportModal } from './assign-transport-modal'

const LIMIT = 20

interface Filters {
  search?: string
  page: number
  route_id?: number
  stop_id?: number
  class_id?: number
  mode?: TransportMode
  sort?: RiderSort
  order?: 'asc' | 'desc'
}

export function StudentsTab({
  filters,
  canManage,
  onChange,
}: {
  filters: Filters
  canManage: boolean
  onChange: (patch: Partial<Filters>) => void
}) {
  const riders = useRiders({ ...filters, limit: LIMIT })
  const routes = useBusRoutes()
  const classes = useClasses()
  const detail = useRouteDetail(filters.route_id)
  const [editing, setEditing] = useState<Rider | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Rider | null>(null)
  const remove = useTransportMutation((studentId: number) => transportApi.removeRider(studentId))
  const rows = riders.data?.items ?? []
  const filtered = Boolean(
    filters.search || filters.route_id || filters.stop_id || filters.class_id || filters.mode
  )

  const actions = (rider: Rider) =>
    canManage && (
      <span className='flex flex-wrap justify-end gap-1 lg:flex-nowrap'>
        <Button
          size='sm'
          variant='outline'
          aria-label={`Change stop for ${rider.student.full_name}`}
          onClick={() => setEditing(rider)}
        >
          <ArrowRightLeft />
          Change
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-label={`Take ${rider.student.full_name} off the bus`}
          className='text-destructive hover:bg-destructive/10'
          onClick={() => setRemoving(rider)}
        >
          <UserMinus />
          Remove
        </Button>
      </span>
    )

  const student = (rider: Rider) => (
    <span className='grid min-w-0'>
      <span className='truncate font-bold'>{rider.student.full_name}</span>
      <span className='truncate font-mono text-xs text-muted-foreground'>
        {rider.student.admission_no}
      </span>
      {rider.student.class_section && (
        <span className='truncate text-xs text-muted-foreground'>
          Class {rider.student.class_section}
        </span>
      )}
    </span>
  )

  const stop = (rider: Rider) =>
    rider.drop_stop ? (
      <span className='grid gap-0.5'>
        <span>
          <span className='text-xs text-muted-foreground'>Pickup </span>
          <span className='font-semibold'>{rider.stop.name}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {' '}
            {rider.stop.pickup_time ?? ''}
          </span>
        </span>
        <span>
          <span className='text-xs text-muted-foreground'>Drop </span>
          <span className='font-semibold'>{rider.drop_stop.name}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {' '}
            {rider.drop_stop.drop_time ?? ''}
          </span>
        </span>
      </span>
    ) : (
      <span className='grid'>
        <span className='font-semibold'>{rider.stop.name}</span>
        <span className='tabular text-xs text-muted-foreground'>
          Pickup {rider.stop.pickup_time ?? '—'} · Drop {rider.stop.drop_time ?? '—'}
        </span>
      </span>
    )

  const columns: Column<Rider>[] = [
    { key: 'student', header: 'Student', sortKey: 'name', cell: student },
    {
      key: 'class',
      header: 'Class',
      sortKey: 'class',
      hideBelow: 'xl',
      cell: (rider) => rider.student.class_section ?? '—',
    },
    { key: 'route', header: 'Route', cell: (rider) => rider.route.name, hideBelow: 'lg' },
    { key: 'stop', header: 'Stop', sortKey: 'stop', cell: stop },
    {
      key: 'mode',
      header: 'Uses the bus for',
      cell: (rider) => <Badge tone='info'>{MODE_LABELS[rider.mode]}</Badge>,
    },
    {
      key: 'fee',
      header: 'Fee a month',
      hideBelow: 'xl',
      align: 'right',
      cell: (rider) => <span className='tabular'>{rupees(rider.monthly_fee)}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={riders.data ? `${riders.data.total} students` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  route_id: undefined,
                  stop_id: undefined,
                  class_id: undefined,
                  mode: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={filters.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Student name or admission no.'
          label='Search students on the bus'
        />
        <FilterSelect
          id='transport-route-filter'
          label='Filter by route'
          allLabel='All routes'
          value={filters.route_id ? String(filters.route_id) : undefined}
          options={(routes.data ?? []).map((route) => ({
            value: String(route.id),
            label: `${route.code} · ${route.name}`,
            hint: String(route.students),
          }))}
          onChange={(value) =>
            onChange({ route_id: value ? Number(value) : undefined, stop_id: undefined })
          }
        />
        {filters.route_id && (
          <FilterSelect
            id='transport-stop-filter'
            label='Filter by stop'
            allLabel='All stops'
            value={filters.stop_id ? String(filters.stop_id) : undefined}
            options={(detail.data?.stop_list ?? []).map((item) => ({
              value: String(item.id),
              label: `${item.sequence}. ${item.name}`,
              hint: String(item.students),
            }))}
            onChange={(value) => onChange({ stop_id: value ? Number(value) : undefined })}
          />
        )}
        <FilterSelect
          id='transport-class-filter'
          label='Filter by class'
          allLabel='All classes'
          value={filters.class_id ? String(filters.class_id) : undefined}
          options={(classes.data ?? []).map((item) => ({
            value: String(item.id),
            label: item.name,
          }))}
          onChange={(value) => onChange({ class_id: value ? Number(value) : undefined })}
        />
        <FilterSelect
          id='transport-mode-filter'
          label='Filter by trips'
          allLabel='Any trips'
          value={filters.mode}
          options={MODE_OPTIONS}
          onChange={(value) =>
            onChange({ mode: (value || undefined) as TransportMode | undefined })
          }
        />
        {filters.route_id && (
          <Button variant='outline' asChild>
            <Link to='/transport/routes/$routeId/students' params={{ routeId: filters.route_id }}>
              <ListOrdered />
              Route list
            </Link>
          </Button>
        )}
        {canManage && (
          <Button onClick={() => setAdding(true)}>
            <Plus />
            Assign student
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(rider) => rider.id}
        loading={riders.isFetching}
        error={riders.isError ? riders.error.message : null}
        onRetry={() => riders.refetch()}
        sort={{ sort: filters.sort, order: filters.order ?? 'asc' }}
        onSortChange={(next) => onChange(next as Partial<Filters>)}
        empty={{
          icon: filtered ? CircleOff : UsersRound,
          title: filtered ? 'No students match these filters' : 'No students on the bus yet',
          description: filtered
            ? 'Try another name, or clear the filters.'
            : 'Assign students to a route and stop, or add them from the route builder.',
          action: !filtered && canManage && (
            <Button onClick={() => setAdding(true)}>
              <Plus />
              Assign student
            </Button>
          ),
        }}
        card={(rider) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              {student(rider)}
              <Badge tone='info'>{MODE_LABELS[rider.mode]}</Badge>
            </div>
            <span className='text-xs text-muted-foreground'>{rider.route.name}</span>
            {stop(rider)}
            {actions(rider)}
          </div>
        )}
        pagination={{
          page: filters.page,
          limit: LIMIT,
          total: riders.data?.total ?? 0,
          label: 'students',
          onPageChange: (page) => onChange({ page }),
        }}
      />
      <AssignTransportModal
        open={adding || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false)
            setEditing(null)
          }
        }}
        rider={editing}
        defaultRouteId={filters.route_id}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Take ${removing?.student.full_name ?? ''} off the bus?`}
        description='The student no longer has a bus stop. Parents and the bus crew are told, and parents stop getting bus alerts.'
        confirmText='Remove from bus'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing)
            await run(
              () => remove.mutateAsync(removing.student.id),
              `${removing.student.full_name} taken off the bus`
            )
          setRemoving(null)
        }}
      />
    </Card>
  )
}
