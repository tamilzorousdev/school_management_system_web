import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  CircleOff,
  ListOrdered,
  Pause,
  Play,
  Plus,
  UsersRound,
} from 'lucide-react'
import { TrashIcon } from '@/components/common/icon'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
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
  limit: number
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
  const riders = useRiders({ ...filters, limit: filters.limit ?? LIMIT })
  const routes = useBusRoutes()
  const classes = useClasses()
  const detail = useRouteDetail(filters.route_id)
  const [editing, setEditing] = useState<Rider | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Rider | null>(null)
  const [holding, setHolding] = useState<Rider | null>(null)
  const remove = useTransportMutation((studentId: number) => transportApi.removeRider(studentId))
  const pass = useTransportMutation(
    (input: { studentId: number; status: 'active' | 'on_hold'; note: string | null }) =>
      transportApi.setPass(input.studentId, input.status, input.note)
  )
  const activate = async (rider: Rider) => {
    try {
      await pass.mutateAsync({ studentId: rider.student.id, status: 'active', note: null })
      alerts.success(`${rider.student.full_name}'s bus pass is active again`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }
  const rows = riders.data?.items ?? []
  const filtered = Boolean(
    filters.search || filters.route_id || filters.stop_id || filters.class_id || filters.mode
  )

  const actions = (rider: Rider) =>
    canManage && (
      <span className='flex flex-wrap justify-end gap-1 lg:flex-nowrap'>
        {rider.pass_status === 'on_hold' ? (
          <Button
            size='sm'
            variant='secondary'
            aria-label={`Make ${rider.student.full_name}'s bus pass active`}
            onClick={() => void activate(rider)}
          >
            <Play className='size-3.5' />
            Activate pass
          </Button>
        ) : (
          <Button
            size='sm'
            variant='secondary'
            aria-label={`Put ${rider.student.full_name}'s bus pass on hold`}
            onClick={() => setHolding(rider)}
          >
            <Pause className='size-3.5' />
            Hold pass
          </Button>
        )}
        <Button
          size='sm'
          variant='outline'
          aria-label={`Change stop for ${rider.student.full_name}`}
          onClick={() => setEditing(rider)}
        >
          <ArrowRightLeft className='size-3.5' />
          Change
        </Button>
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label={`Take ${rider.student.full_name} off the bus`}
          title='Remove from bus'
          className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] dark:text-red-400 dark:hover:bg-destructive/10 dark:hover:text-red-300'
          onClick={() => setRemoving(rider)}
        >
          <TrashIcon className='size-4' />
        </Button>
      </span>
    )

  const student = (rider: Rider) => (
    <span className='grid min-w-0'>
      <span className='flex min-w-0 items-center gap-1.5'>
        <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
          {rider.student.full_name}
        </span>
        {rider.pass_status === 'on_hold' && (
          <Badge tone='warning' className='font-medium' title={rider.pass_note ?? undefined}>
            Pass on hold
          </Badge>
        )}
      </span>
      <span className='truncate font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
        {rider.student.admission_no}
      </span>
      {rider.student.class_section && (
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
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
    { key: 'student', header: 'STUDENT', sortKey: 'name', cell: student },
    {
      key: 'class',
      header: 'CLASS',
      sortKey: 'class',
      hideBelow: 'xl',
      cell: (rider) => (
        <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
          {rider.student.class_section ?? '—'}
        </span>
      ),
    },
    {
      key: 'route',
      header: 'ROUTE',
      cell: (rider) => (
        <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
          {rider.route.name}
        </span>
      ),
      hideBelow: 'lg',
    },
    { key: 'stop', header: 'STOP', sortKey: 'stop', cell: stop },
    {
      key: 'mode',
      header: 'USES THE BUS FOR',
      cell: (rider) => (
        <Badge tone='info' className='font-medium'>
          {MODE_LABELS[rider.mode]}
        </Badge>
      ),
    },
    {
      key: 'fee',
      header: 'FEE A MONTH',
      hideBelow: 'xl',
      align: 'right',
      cell: (rider) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
          {rupees(rider.monthly_fee)}
        </span>
      ),
    },
    { key: 'actions', header: 'ACTION', align: 'right', cell: actions },
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
          compact
          showShortcut={false}
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
          <Button variant='outline' size='sm' asChild>
            <Link to='/transport/routes/$routeId/students' params={{ routeId: filters.route_id }}>
              <ListOrdered className='size-3.5' />
              Route list
            </Link>
          </Button>
        )}
        {canManage && (
          <Button variant='primary' size='sm' onClick={() => setAdding(true)}>
            <Plus className='size-3.5' />
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
            <Button variant='primary' size='sm' onClick={() => setAdding(true)}>
              <Plus className='size-3.5' />
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
          limit: filters.limit ?? LIMIT,
          total: riders.data?.total ?? 0,
          label: 'students',
          onPageChange: (page) => onChange({ page }),
          onLimitChange: (limit) => onChange({ limit, page: 1 }),
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
        confirmText='Remove'
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
      {holding && (
        <HoldPassModal
          rider={holding}
          onHold={(note) =>
            pass.mutateAsync({ studentId: holding.student.id, status: 'on_hold', note })
          }
          onClose={() => setHolding(null)}
        />
      )}
    </Card>
  )
}

function HoldPassModal({
  rider,
  onHold,
  onClose,
}: {
  rider: Rider
  onHold: (note: string | null) => Promise<unknown>
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Put ${rider.student.full_name}'s bus pass on hold?`}
      description='The driver sees only "Bus pass on hold – contact office", never fees, and must not leave the child behind. Parents get an in-app note.'
      formId='hold-pass-form'
      submitText='Hold pass'
      loading={saving}
    >
      <form
        id='hold-pass-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          try {
            await onHold(note.trim() || null)
            alerts.success(`${rider.student.full_name}'s bus pass is on hold`)
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          } finally {
            setSaving(false)
          }
        }}
      >
        <FormField
          id='hold-note'
          label='Note for the parents'
          hint='Optional. The driver does not see it.'
        >
          <Textarea
            id='hold-note'
            rows={3}
            maxLength={255}
            value={note}
            placeholder='Transport fee due since October'
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
