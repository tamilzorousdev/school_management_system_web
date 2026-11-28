import { useState } from 'react'
import {
  Ban,
  CheckCircle2,
  CircleOff,
  ClipboardCheck,
  ImageIcon,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { today } from '@/features/attendance/labels'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  maintenanceApi,
  useChecks,
  useChecksToday,
  useFleetSettings,
  useMaintenanceMutation,
  type PreTripCheck,
  type PreTripListParams,
  type PreTripTodayRow,
} from '../api'
import { CHECK_STATE, CHECK_STATE_OPTIONS } from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { openStoredFile } from '../helpers'
import { BusCell, NoteDialog } from './shared'

const LIMIT = 20

const stateOf = (check: PreTripCheck) =>
  check.blocked ? CHECK_STATE.blocked : check.failed_count ? CHECK_STATE.failed : CHECK_STATE.ok

function CheckBadge({ check }: { check: PreTripCheck }) {
  const state = stateOf(check)
  return (
    <Badge tone={state.tone} dot className='font-medium'>
      {check.failed_count && !check.blocked
        ? `${check.failed_count} not OK`
        : check.cleared_at && check.critical_failed
          ? 'Cleared'
          : state.label}
    </Badge>
  )
}

function boardState(row: PreTripTodayRow): { label: string; tone: BadgeTone } {
  if (row.off_road) return { label: 'Off road', tone: 'danger' }
  if (!row.check) return { label: 'Not done', tone: 'neutral' }
  if (row.check.blocked) return { label: 'Blocked', tone: 'danger' }
  if (row.check.failed_count) return { label: `${row.check.failed_count} not OK`, tone: 'warning' }
  return { label: 'Done, all OK', tone: 'success' }
}

export function PreTripTab({
  search,
  setSearch,
  onPageChange,
  onLimitChange,
  onClear,
  canManage,
}: TabProps) {
  const busOptions = useBusOptions()
  const [viewing, setViewing] = useState<PreTripCheck | null>(null)
  const board = useChecksToday()
  const settings = useFleetSettings()
  const limit = search.limit ?? LIMIT
  const params: PreTripListParams = {
    page: search.page,
    limit,
    vehicle_id: search.vehicle_id,
    date: search.date,
    state: search.state,
  }
  const checks = useChecks(params)
  const rows = checks.data?.items ?? []
  const boardRows = board.data ?? []
  const done = boardRows.filter((row) => row.check).length

  const columns: Column<PreTripCheck>[] = [
    {
      key: 'date',
      header: 'DATE',
      cell: (check) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 tabular-nums dark:text-slate-100'>
          {formatDate(check.check_date)}
        </span>
      ),
    },
    { key: 'bus', header: 'BUS', cell: (check) => <BusCell vehicle={check.vehicle} /> },
    { key: 'state', header: 'RESULT', cell: (check) => <CheckBadge check={check} /> },
    {
      key: 'by',
      header: 'CHECKED BY',
      hideBelow: 'lg',
      cell: (check) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
            {check.checked_by.name}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 tabular-nums dark:text-slate-400'>
            {formatDateTime(check.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'failed',
      header: 'NOT OK',
      hideBelow: 'lg',
      cell: (check) => (
        <span className='line-clamp-1 text-[13px] leading-[18px] text-slate-500 dark:text-slate-400'>
          {check.items
            .filter((item) => !item.ok)
            .map((item) => item.label)
            .join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'odometer',
      header: 'ODOMETER',
      align: 'right',
      hideBelow: 'xl',
      cell: (check) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {formatNumber(check.odometer_km, 0, 'km')}
        </span>
      ),
    },
  ]

  const filtered = Boolean(search.vehicle_id || search.date || search.state)

  return (
    <>
      <Card className='grid gap-3 p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='grid gap-0.5'>
            <span className='text-sm font-bold text-slate-900 dark:text-slate-100'>
              Today’s checks
            </span>
            <span className='text-sm text-muted-foreground'>
              {board.isPending
                ? 'Loading…'
                : `${done} of ${boardRows.length} ${boardRows.length === 1 ? 'bus' : 'buses'} checked. `}
              {settings.data &&
                (settings.data.pre_trip_check_required
                  ? 'A bus cannot start its first trip until the check is done.'
                  : 'The check is optional (change this in Settings).')}
            </span>
          </div>
        </div>
        {board.isPending ? (
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            <Skeleton className='h-20' />
            <Skeleton className='h-20' />
            <Skeleton className='h-20' />
          </div>
        ) : boardRows.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No active buses.</p>
        ) : (
          <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {boardRows.map((row) => {
              const state = boardState(row)
              const Icon = row.off_road
                ? Ban
                : !row.check
                  ? CircleOff
                  : row.check.blocked
                    ? ShieldAlert
                    : row.check.failed_count
                      ? XCircle
                      : CheckCircle2
              return (
                <li key={row.vehicle.id}>
                  <button
                    type='button'
                    disabled={!row.check}
                    onClick={() => row.check && setViewing(row.check)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                      row.check && 'hover:bg-muted/50',
                      (row.off_road || row.check?.blocked) && 'border-destructive/40'
                    )}
                    aria-label={`${row.vehicle.name}: ${state.label}`}
                  >
                    <Icon
                      className={cn(
                        'size-5 shrink-0',
                        state.tone === 'success' && 'text-success',
                        state.tone === 'warning' && 'text-warning',
                        state.tone === 'danger' && 'text-destructive',
                        state.tone === 'neutral' && 'text-muted-foreground'
                      )}
                    />
                    <span className='grid min-w-0 flex-1'>
                      <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                        {row.vehicle.name}
                      </span>
                      <span className='truncate font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                        {row.vehicle.registration_no}
                      </span>
                    </span>
                    <Badge tone={state.tone} className='font-medium'>
                      {state.label}
                    </Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            checks.data
              ? `${checks.data.total} ${checks.data.total === 1 ? 'check' : 'checks'}`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <FilterSelect
            id='check-state-filter'
            label='Filter by result'
            allLabel='All results'
            value={search.state}
            options={CHECK_STATE_OPTIONS}
            onChange={(value) => setSearch({ state: value as MaintenanceSearch['state'] })}
          />
          <FilterSelect
            id='check-bus-filter'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
          <DatePicker
            size='sm'
            placeholder='Any day'
            value={search.date ?? ''}
            max={today()}
            onChange={(value: string) => setSearch({ date: value || undefined })}
            className='w-full sm:w-40'
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(check) => check.id}
          loading={checks.isFetching}
          error={checks.isError ? checks.error.message : null}
          onRetry={() => checks.refetch()}
          onRowClick={setViewing}
          empty={{
            icon: filtered ? CircleOff : ClipboardCheck,
            title: filtered ? 'No checks match these filters' : 'No pre-trip checks yet',
            description: filtered
              ? 'Try another bus, day or result, or clear the filters.'
              : 'Drivers tick the 10-point check in the app before the first trip of the day.',
          }}
          card={(check) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-bold'>{formatDate(check.check_date)}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {check.vehicle.name} · {check.vehicle.registration_no}
                  </span>
                </div>
                <CheckBadge check={check} />
              </div>
              <span className='text-xs text-muted-foreground'>
                By {check.checked_by.name}
                {check.failed_count
                  ? ` · not OK: ${check.items
                      .filter((item) => !item.ok)
                      .map((item) => item.label)
                      .join(', ')}`
                  : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit,
            total: checks.data?.total ?? 0,
            label: 'checks',
            onPageChange,
            onLimitChange,
          }}
        />
      </Card>
      <CheckDetailModal
        check={viewing}
        canManage={canManage}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </>
  )
}

function CheckDetailModal({
  check,
  onOpenChange,
  canManage,
}: {
  check: PreTripCheck | null
  onOpenChange: (open: boolean) => void
  canManage: boolean
}) {
  const [clearing, setClearing] = useState(false)
  const clear = useMaintenanceMutation((input: { id: number; note: string }) =>
    maintenanceApi.clearCheck(input.id, input.note)
  )
  return (
    <>
      <AppModal
        open={Boolean(check)}
        onOpenChange={onOpenChange}
        title='Pre-trip check'
        description={
          check
            ? `${check.vehicle.name} · ${check.vehicle.registration_no} · ${formatDate(check.check_date)} by ${check.checked_by.name}`
            : undefined
        }
        size='lg'
        footer={
          <div className='flex flex-wrap justify-end gap-2'>
            {check?.photo_file && (
              <Button variant='outline' size='sm' onClick={() => openStoredFile(check.photo_file)}>
                <ImageIcon className='size-3.5' />
                Open photo
              </Button>
            )}
            {check?.blocked && canManage && (
              <Button variant='primary' size='sm' onClick={() => setClearing(true)}>
                <ShieldCheck className='size-3.5' />
                Clear for trips
              </Button>
            )}
            <Button variant='secondary' size='sm' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        }
      >
        {check && (
          <div className='grid gap-3'>
            {check.blocked && (
              <p className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
                A safety item failed. This bus cannot start trips until someone in the office clears
                it.
              </p>
            )}
            {check.cleared_at && (
              <p className='rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success'>
                Cleared by {check.cleared_by?.name ?? 'the office'} on{' '}
                {formatDateTime(check.cleared_at)}
                {check.clear_note ? `: ${check.clear_note}` : ''}
              </p>
            )}
            <ul className='grid gap-1.5 sm:grid-cols-2'>
              {check.items.map((item) => (
                <li
                  key={item.item}
                  className={cn(
                    'flex items-start gap-2 rounded-md border p-2.5 text-sm',
                    !item.ok && 'border-destructive/40 bg-destructive/5'
                  )}
                >
                  {item.ok ? (
                    <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-success' />
                  ) : (
                    <XCircle className='mt-0.5 size-4 shrink-0 text-destructive' />
                  )}
                  <span className='grid min-w-0'>
                    <span className='font-semibold'>
                      {item.label}
                      {item.critical && (
                        <span className='ml-1.5 text-xs font-medium text-muted-foreground'>
                          Safety
                        </span>
                      )}
                    </span>
                    {item.note && (
                      <span className='text-xs break-words text-muted-foreground'>{item.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className='text-xs text-muted-foreground'>
              Odometer {formatNumber(check.odometer_km, 0, 'km')}
              {check.ticket_id
                ? ` · repair ticket #${check.ticket_id} was opened for the failed items`
                : ''}
            </p>
          </div>
        )}
      </AppModal>
      <NoteDialog
        open={clearing}
        onOpenChange={setClearing}
        title='Clear this bus for trips?'
        description='Say what was done about the failed safety items. The note is kept with the check.'
        label='What was done'
        placeholder='Brakes adjusted at the garage, checked by the in-charge'
        required
        confirmText='Clear for trips'
        onConfirm={async (note) => {
          if (!check) return
          await clear.mutateAsync({ id: check.id, note })
          alerts.success('Bus cleared for trips')
          setClearing(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
