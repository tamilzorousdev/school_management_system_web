import { useState } from 'react'
import { CalendarClock, CircleOff, ListChecks, PenLine, Plus, Power } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { TrashIcon } from '@/components/common/icon'
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
  if (!schedule.is_active)
    return (
      <Badge tone='neutral' className='font-medium'>
        Switched off
      </Badge>
    )
  const status = DUE_STATUS[schedule.status]
  return (
    <Badge tone={status.tone} dot className='font-medium'>
      {status.label}
    </Badge>
  )
}

export function DueLeft({ schedule }: { schedule: Schedule }) {
  const parts = [daysText(schedule.days_left), kmText(schedule.km_left)].filter(Boolean)
  return (
    <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
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
  onLimitChange,
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

  const limit = search.limit ?? LIMIT
  const params: ScheduleListParams = {
    page: search.page,
    limit,
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
          className={
            schedule.is_active
              ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              : 'text-[#127D48] hover:bg-[#EAF7F0] dark:text-emerald-400 dark:hover:bg-emerald-950/50'
          }
          onClick={(event) => {
            event.stopPropagation()
            void switchActive(schedule)
          }}
        >
          <Power className='size-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${schedule.title} for ${schedule.vehicle.name}`}
          title='Edit'
          className='text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          onClick={(event) => {
            event.stopPropagation()
            openEdit(schedule)
          }}
        >
          <PenLine className='size-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${schedule.title} for ${schedule.vehicle.name}`}
          title='Delete'
          className='text-[#D92D20] hover:bg-destructive/10 hover:text-[#B42318] dark:text-red-400 dark:hover:bg-destructive/10 dark:hover:text-red-300'
          onClick={(event) => {
            event.stopPropagation()
            setDeleting(schedule)
          }}
        >
          <TrashIcon className='size-4' />
        </Button>
      </div>
    )

  const columns: Column<Schedule>[] = [
    {
      key: 'title',
      header: 'SERVICE',
      cell: (schedule) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {schedule.title}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {SERVICE_CATEGORY[schedule.category]} · every {every(schedule)}
          </span>
        </div>
      ),
    },
    { key: 'bus', header: 'BUS', cell: (schedule) => <BusCell vehicle={schedule.vehicle} /> },
    {
      key: 'status',
      header: 'STATUS',
      cell: (schedule) => (
        <div className='grid justify-items-start gap-1'>
          <DueBadge schedule={schedule} />
          {schedule.is_active && <DueLeft schedule={schedule} />}
        </div>
      ),
    },
    {
      key: 'next',
      header: 'NEXT DUE',
      hideBelow: 'lg',
      cell: (schedule) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {nextDue(schedule)}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'LAST DONE',
      hideBelow: 'xl',
      cell: (schedule) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
            {formatDate(schedule.last_done_on)}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
            {formatNumber(schedule.last_done_km, 0, 'km')}
          </span>
        </div>
      ),
    },
    {
      key: 'current',
      header: 'BUS NOW',
      hideBelow: 'xl',
      align: 'right',
      cell: (schedule) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {formatNumber(schedule.current_km, 0, 'km')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
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
          <span className='text-sm font-bold text-slate-900 dark:text-slate-100'>
            Standard service plan
          </span>
          <span className='text-sm text-muted-foreground'>
            Engine oil every 10,000 km or 6 months, tyre rotation every 15,000 km, brake check every
            3 months and a general service every 6 months. Buses keep any rule they already have.
          </span>
        </div>
        {canManage && (
          <Button variant='outline' size='sm' onClick={() => setApplying(true)}>
            <ListChecks className='size-3.5' />
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
            compact
            showShortcut={false}
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
              <Button variant='primary' size='sm' onClick={() => onAddingChange(true)}>
                <Plus className='size-3.5' />
                Add rule
              </Button>
            ),
          }}
          card={(schedule) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                    {schedule.title}
                  </span>
                  <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
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
            limit,
            total: schedules.data?.total ?? 0,
            label: 'rules',
            onPageChange,
            onLimitChange,
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
