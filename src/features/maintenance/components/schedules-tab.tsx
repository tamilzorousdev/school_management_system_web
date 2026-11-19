import { useState } from 'react'
import { CalendarClock, CircleOff, ListChecks, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatNumber } from '@/lib/format'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useSchedules,
  type Schedule,
  type ScheduleListParams,
} from '../api'
import {
  DUE_STATUS,
  DUE_STATUS_OPTIONS,
  SERVICE_CATEGORY,
  SERVICE_CATEGORY_OPTIONS,
  daysText,
  kmText,
} from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { ScheduleFormModal } from './schedule-form-modal'
import { BusCell } from './shared'

const LIMIT = 20

export function DueBadge({ schedule }: { schedule: Schedule }) {
  if (!schedule.is_active) return <Badge tone='neutral'>Switched off</Badge>
  const status = DUE_STATUS[schedule.status]
  return (
    <Badge tone={status.tone} dot>
      {status.label}
    </Badge>
  )
}

export function DueLeft({ schedule }: { schedule: Schedule }) {
  const parts = [daysText(schedule.days_left), kmText(schedule.km_left)].filter(Boolean)
  return (
    <span className='tabular text-xs text-muted-foreground'>
      {parts.length ? parts.join(' · ') : 'Not enough readings yet'}
    </span>
  )
}

const every = (schedule: Schedule) =>
  [
    schedule.every_km ? formatNumber(schedule.every_km, 0, 'km') : null,
    schedule.every_months
      ? `${schedule.every_months} ${schedule.every_months === 1 ? 'month' : 'months'}`
      : null,
  ]
    .filter(Boolean)
    .join(' or ')

const nextDue = (schedule: Schedule) =>
  [
    schedule.next_due_on ? formatDate(schedule.next_due_on) : null,
    schedule.next_due_km !== null ? formatNumber(schedule.next_due_km, 0, 'km') : null,
  ]
    .filter(Boolean)
    .join(' · ') || '—'

export function SchedulesTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  adding,
  onAddingChange,
}: TabProps) {
  const busOptions = useBusOptions()
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<Schedule | null>(null)
  const [applying, setApplying] = useState(false)
  if (adding && !editOpen && editing) setEditing(null)

  const remove = useMaintenanceMutation((id: number) => maintenanceApi.removeSchedule(id))
  const toggle = useMaintenanceMutation((schedule: Schedule) =>
    maintenanceApi.updateSchedule(schedule.id, { is_active: !schedule.is_active })
  )
  const apply = useMaintenanceMutation((vehicleIds: number[] | undefined) =>
    maintenanceApi.applyStandard(vehicleIds)
  )

  const params: ScheduleListParams = {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    vehicle_id: search.vehicle_id,
    status: search.due,
    category: search.category,
  }
  const schedules = useSchedules(params)
  const rows = schedules.data?.items ?? []

  const openEdit = (schedule: Schedule) => {
    setEditing(schedule)
    setEditOpen(true)
  }

  const switchActive = async (schedule: Schedule) => {
    try {
      await toggle.mutateAsync(schedule)
      alerts.success(schedule.is_active ? 'Service rule switched off' : 'Service rule switched on')
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const actions = (schedule: Schedule) =>
    canManage && (
      <div className='inline-flex gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`${schedule.is_active ? 'Switch off' : 'Switch on'} ${schedule.title} for ${schedule.vehicle.name}`}
          title={schedule.is_active ? 'Switch off' : 'Switch on'}
          className={schedule.is_active ? undefined : 'text-success hover:bg-success/10'}
          onClick={(event) => {
            event.stopPropagation()
            void switchActive(schedule)
          }}
        >
          <Power />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${schedule.title} for ${schedule.vehicle.name}`}
          onClick={(event) => {
            event.stopPropagation()
            openEdit(schedule)
          }}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${schedule.title} for ${schedule.vehicle.name}`}
          className='text-destructive hover:bg-destructive/10'
          onClick={(event) => {
            event.stopPropagation()
            setDeleting(schedule)
          }}
        >
          <Trash2 />
        </Button>
      </div>
    )

  const columns: Column<Schedule>[] = [
    {
      key: 'title',
      header: 'Service',
      cell: (schedule) => (
        <div className='grid min-w-0'>
          <span className='font-bold'>{schedule.title}</span>
          <span className='text-xs text-muted-foreground'>
            {SERVICE_CATEGORY[schedule.category]} · every {every(schedule)}
          </span>
        </div>
      ),
    },
    { key: 'bus', header: 'Bus', cell: (schedule) => <BusCell vehicle={schedule.vehicle} /> },
    {
      key: 'status',
      header: 'Status',
      cell: (schedule) => (
        <div className='grid justify-items-start gap-1'>
          <DueBadge schedule={schedule} />
          {schedule.is_active && <DueLeft schedule={schedule} />}
        </div>
      ),
    },
    {
      key: 'next',
      header: 'Next due',
      hideBelow: 'lg',
      cell: (schedule) => <span className='tabular'>{nextDue(schedule)}</span>,
    },
    {
      key: 'last',
      header: 'Last done',
      hideBelow: 'xl',
      cell: (schedule) => (
        <div className='grid'>
          <span className='tabular'>{formatDate(schedule.last_done_on)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatNumber(schedule.last_done_km, 0, 'km')}
          </span>
        </div>
      ),
    },
    {
      key: 'current',
      header: 'Bus now',
      hideBelow: 'xl',
      align: 'right',
      cell: (schedule) => (
        <span className='tabular'>{formatNumber(schedule.current_km, 0, 'km')}</span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-28',
      cell: actions,
    },
  ]

  const filtered = Boolean(search.search || search.vehicle_id || search.due || search.category)
  const applyBus = search.vehicle_id
    ? busOptions.find((option) => option.value === String(search.vehicle_id))
    : undefined

  return (
    <>
      <Card className='flex flex-wrap items-center justify-between gap-3 p-4'>
        <div className='grid min-w-0 flex-1 gap-0.5'>
          <span className='font-semibold'>Standard service plan</span>
          <span className='text-sm text-muted-foreground'>
            Engine oil every 10,000 km or 6 months, tyre rotation every 15,000 km, brake check every
            3 months and a general service every 6 months. Buses keep any rule they already have.
          </span>
        </div>
        {canManage && (
          <Button variant='outline' onClick={() => setApplying(true)}>
            <ListChecks />
            Apply standard plan
          </Button>
        )}
      </Card>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            schedules.data
              ? `${schedules.data.total} ${schedules.data.total === 1 ? 'rule' : 'rules'}, most urgent first`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search service or bus'
            label='Search service rules'
          />
          <FilterSelect
            id='schedule-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.due}
            options={DUE_STATUS_OPTIONS}
            onChange={(value) => setSearch({ due: value as MaintenanceSearch['due'] })}
          />
          <FilterSelect
            id='schedule-category-filter'
            label='Filter by service'
            allLabel='All services'
            value={search.category}
            options={SERVICE_CATEGORY_OPTIONS}
            onChange={(value) => setSearch({ category: value as MaintenanceSearch['category'] })}
          />
          <FilterSelect
            id='schedule-bus-filter'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(schedule) => schedule.id}
          loading={schedules.isFetching}
          error={schedules.isError ? schedules.error.message : null}
          onRetry={() => schedules.refetch()}
          onRowClick={canManage ? openEdit : undefined}
          empty={{
            icon: filtered ? CircleOff : CalendarClock,
            title: filtered ? 'No service rules match these filters' : 'No service rules yet',
            description: filtered
              ? 'Try another bus, service or status, or clear the filters.'
              : 'Apply the standard plan to every bus in one click, or add your own rule.',
            action: !filtered && canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add rule
              </Button>
            ),
          }}
          card={(schedule) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-bold'>{schedule.title}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {schedule.vehicle.name} · {schedule.vehicle.registration_no}
                  </span>
                </div>
                <DueBadge schedule={schedule} />
              </div>
              {schedule.is_active && <DueLeft schedule={schedule} />}
              <span className='tabular text-xs text-muted-foreground'>
                Every {every(schedule)} · next {nextDue(schedule)}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: schedules.data?.total ?? 0,
            label: 'rules',
            onPageChange,
          }}
        />
      </Card>
      <ScheduleFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        schedule={editing}
        defaultVehicleId={search.vehicle_id}
      />
      <ConfirmDialog
        open={applying}
        onOpenChange={setApplying}
        title='Apply the standard plan?'
        description={
          applyBus
            ? `Adds the standard service rules to ${applyBus.label}. Rules it already has are kept.`
            : 'Adds the standard service rules to every active bus. Rules a bus already has are kept.'
        }
        confirmText='Apply plan'
        loading={apply.isPending}
        onConfirm={async () => {
          try {
            const result = await apply.mutateAsync(
              search.vehicle_id ? [search.vehicle_id] : undefined
            )
            alerts.success(
              result.added
                ? `Added ${result.added} ${result.added === 1 ? 'rule' : 'rules'} to ${result.buses} ${result.buses === 1 ? 'bus' : 'buses'}`
                : 'Every bus already has these rules'
            )
            setApplying(false)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete this service rule?'
        description={
          deleting
            ? `${deleting.title} for ${deleting.vehicle.name}. Past services stay in the history. Switch it off instead to keep the rule.`
            : ''
        }
        confirmText='Delete rule'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Service rule deleted')
            setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </>
  )
}
