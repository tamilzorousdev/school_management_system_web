import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleOff,
  FileText,
  Fuel,
  Gauge,
  HandCoins,
  History,
  Hourglass,
  IndianRupee,
  MapPinOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
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
  useFuelInsights,
  useFuelLog,
  useMaintenanceMutation,
  type FuelEntry,
  type FuelListParams,
} from '../api'
import {
  FUEL_STATUS,
  FUEL_STATUS_OPTIONS,
  PAYMENT_MODE,
  PAYMENT_MODE_OPTIONS,
  rupees,
} from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { FuelFormModal } from './fuel-form-modal'
import { HistoryModal } from './history-modal'
import { isPhone, openStoredFile } from '../helpers'
import { ActionSheet, BusCell, DateRangeInputs, NoteDialog, type SheetAction } from './shared'

const LIMIT = 20
const SORTS = ['filled_on', 'amount', 'litres'] as const
const REIMBURSED_OPTIONS = [
  { value: 'false', label: 'Not paid back yet' },
  { value: 'true', label: 'Paid back' },
]

type Review = { entry: FuelEntry; action: 'approve' | 'reject' }

const needsPayBack = (entry: FuelEntry) =>
  entry.payment_mode === 'driver_paid' && !entry.reimbursed_at && entry.status === 'approved'

function FuelFlags({ entry }: { entry: FuelEntry }) {
  return (
    <span className='flex flex-wrap gap-1'>
      <Badge tone={FUEL_STATUS[entry.status].tone} dot>
        {FUEL_STATUS[entry.status].label}
      </Badge>
      {!entry.is_full && <Badge tone='neutral'>Part fill</Badge>}
      {entry.price_warning && (
        <Badge tone='warning' title={entry.price_warning}>
          <AlertTriangle className='size-3' />
          Price
        </Badge>
      )}
      {entry.gps_check?.status === 'mismatch' && (
        <Badge
          tone='danger'
          title={`Odometer ${formatNumber(entry.gps_check.odometer_km, 0, 'km')} but GPS ${formatNumber(entry.gps_check.gps_km, 0, 'km')} since the last full fill`}
        >
          <MapPinOff className='size-3' />
          GPS mismatch
        </Badge>
      )}
      {entry.payment_mode === 'driver_paid' && (
        <Badge tone={entry.reimbursed_at ? 'success' : 'info'}>
          {entry.reimbursed_at ? 'Paid back' : 'Driver paid'}
        </Badge>
      )}
    </span>
  )
}

export function FuelTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  adding,
  onAddingChange,
}: TabProps) {
  const busOptions = useBusOptions()
  const [editing, setEditing] = useState<FuelEntry | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<FuelEntry | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [paying, setPaying] = useState<FuelEntry | null>(null)
  const [history, setHistory] = useState<FuelEntry | null>(null)
  const [sheet, setSheet] = useState<FuelEntry | null>(null)
  if (adding && !editOpen && editing) setEditing(null)
  const remove = useMaintenanceMutation((input: { id: number; reason: string }) =>
    maintenanceApi.removeFuel(input.id, input.reason)
  )
  const approve = useMaintenanceMutation((input: { id: number; note: string }) =>
    maintenanceApi.approveFuel(input.id, input.note)
  )
  const reject = useMaintenanceMutation((input: { id: number; note: string }) =>
    maintenanceApi.rejectFuel(input.id, input.note)
  )
  const reimburse = useMaintenanceMutation((id: number) => maintenanceApi.reimburseFuel(id))

  const sort = SORTS.find((item) => item === search.sort)
  const params: FuelListParams = {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    sort,
    order: sort ? search.order : undefined,
    vehicle_id: search.vehicle_id,
    from: search.from,
    to: search.to,
    status: search.fuel_status,
    payment_mode: search.payment_mode,
    reimbursed: search.reimbursed,
  }
  const fuel = useFuelLog(params)
  const insights = useFuelInsights(search.vehicle_id)
  const data = insights.data
  const rows = fuel.data?.items ?? []

  const openEdit = (entry: FuelEntry) => {
    setEditing(entry)
    setEditOpen(true)
  }

  const pendingActive = search.fuel_status === 'pending'
  const payBackActive = search.payment_mode === 'driver_paid' && search.reimbursed === false

  const cards: Insight[] = [
    {
      key: 'pending',
      label: 'Waiting for check',
      value: data?.pending_approvals ?? 0,
      hint: 'Added by drivers',
      icon: Hourglass,
      tone: 'warning',
      active: pendingActive,
      onClick: () =>
        setSearch({
          fuel_status: pendingActive ? undefined : 'pending',
          payment_mode: undefined,
          reimbursed: undefined,
        }),
    },
    {
      key: 'pay_back',
      label: 'To pay back',
      value: rupees(data?.driver_paid_pending ?? 0),
      hint: 'Paid by drivers',
      icon: HandCoins,
      tone: 'info',
      active: payBackActive,
      onClick: () =>
        setSearch(
          payBackActive
            ? { payment_mode: undefined, reimbursed: undefined }
            : { payment_mode: 'driver_paid', reimbursed: false, fuel_status: undefined }
        ),
    },
    {
      key: 'entries',
      label: 'Fills this month',
      value: data?.entries_this_month ?? 0,
      hint: `${formatNumber(data?.litres_this_month ?? 0, 1)} litres`,
      icon: CalendarDays,
      tone: 'primary',
    },
    {
      key: 'amount',
      label: 'Spent this month',
      value: rupees(data?.amount_this_month ?? 0),
      hint: 'Total of fuel bills',
      icon: IndianRupee,
      tone: 'warning',
    },
    {
      key: 'mileage',
      label: 'Average mileage',
      value: formatNumber(data?.avg_km_per_litre, 1, 'km/l'),
      hint: 'Full fills, last 90 days',
      icon: Gauge,
      tone: 'success',
    },
  ]

  const entryActions = (entry: FuelEntry): SheetAction[] =>
    (
      [
        canManage &&
          entry.status === 'pending' && {
            key: 'approve',
            label: 'Approve',
            icon: <Check />,
            onClick: () => setReview({ entry, action: 'approve' }),
            className: 'text-success hover:bg-success/10',
          },
        canManage &&
          entry.status === 'pending' && {
            key: 'reject',
            label: 'Reject',
            icon: <X />,
            onClick: () => setReview({ entry, action: 'reject' }),
            className: 'text-destructive hover:bg-destructive/10',
          },
        canManage &&
          needsPayBack(entry) && {
            key: 'pay',
            label: 'Mark as paid back',
            icon: <HandCoins />,
            onClick: () => setPaying(entry),
            className: 'text-info hover:bg-info/10',
          },
        entry.bill_file && {
          key: 'bill',
          label: 'Open bill',
          icon: <FileText />,
          onClick: () => openStoredFile(entry.bill_file),
        },
        {
          key: 'history',
          label: 'Change history',
          icon: <History />,
          onClick: () => setHistory(entry),
        },
        canManage && {
          key: 'edit',
          label: 'Edit',
          icon: <Pencil />,
          onClick: () => openEdit(entry),
        },
        canManage && {
          key: 'delete',
          label: 'Delete',
          icon: <Trash2 />,
          onClick: () => setDeleting(entry),
          className: 'text-destructive hover:bg-destructive/10',
          destructive: true,
        },
      ] as (SheetAction | false | null)[]
    ).filter((action): action is SheetAction => Boolean(action))

  const actions = (entry: FuelEntry) => (
    <div className='inline-flex flex-wrap justify-end gap-1'>
      {entryActions(entry).map((action) => (
        <Button
          key={action.key}
          variant='ghost'
          size='icon-sm'
          aria-label={`${action.label}: fuel entry of ${formatDate(entry.filled_on)}`}
          title={action.label}
          className={action.className}
          onClick={(event) => {
            event.stopPropagation()
            action.onClick()
          }}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  )

  const onRowClick = (entry: FuelEntry) => {
    if (isPhone()) setSheet(entry)
    else if (canManage) openEdit(entry)
  }

  const columns: Column<FuelEntry>[] = [
    {
      key: 'filled_on',
      header: 'Date',
      sortKey: 'filled_on',
      cell: (entry) => <span className='tabular font-semibold'>{formatDate(entry.filled_on)}</span>,
    },
    { key: 'bus', header: 'Bus', cell: (entry) => <BusCell vehicle={entry.vehicle} /> },
    {
      key: 'litres',
      header: 'Litres',
      sortKey: 'litres',
      align: 'right',
      cell: (entry) => <span className='tabular'>{formatNumber(entry.litres, 1)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortKey: 'amount',
      align: 'right',
      cell: (entry) => (
        <div className='grid'>
          <span className='tabular font-semibold'>{rupees(entry.amount)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            ₹{formatNumber(entry.price_per_litre, 2)}/L
          </span>
        </div>
      ),
    },
    {
      key: 'km_per_litre',
      header: 'km/l',
      align: 'right',
      hideBelow: 'lg',
      cell: (entry) => (
        <div className='grid'>
          <span className='tabular font-semibold'>{formatNumber(entry.km_per_litre, 2)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatNumber(entry.odometer_km, 0, 'km')}
          </span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (entry) => <FuelFlags entry={entry} /> },
    {
      key: 'station',
      header: 'Station and payment',
      hideBelow: 'xl',
      cell: (entry) => (
        <div className='grid min-w-0'>
          <span className='truncate'>{entry.fuel_station?.name ?? entry.station ?? '—'}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {[PAYMENT_MODE[entry.payment_mode], entry.filled_by?.name].filter(Boolean).join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-44',
      cell: actions,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.vehicle_id ||
    search.from ||
    search.to ||
    search.fuel_status ||
    search.payment_mode ||
    search.reimbursed !== undefined
  )

  return (
    <>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            fuel.data ? `${fuel.data.total} ${fuel.data.total === 1 ? 'entry' : 'entries'}` : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search station or bus'
            label='Search fuel log'
          />
          <FilterSelect
            id='fuel-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.fuel_status}
            options={FUEL_STATUS_OPTIONS}
            onChange={(value) =>
              setSearch({ fuel_status: value as MaintenanceSearch['fuel_status'] })
            }
          />
          <FilterSelect
            id='fuel-payment-filter'
            label='Filter by payment'
            allLabel='All payments'
            value={search.payment_mode}
            options={PAYMENT_MODE_OPTIONS}
            onChange={(value) =>
              setSearch({ payment_mode: value as MaintenanceSearch['payment_mode'] })
            }
          />
          <FilterSelect
            id='fuel-reimbursed-filter'
            label='Filter by pay back'
            allLabel='Paid back or not'
            value={search.reimbursed === undefined ? undefined : String(search.reimbursed)}
            options={REIMBURSED_OPTIONS}
            onChange={(value) => setSearch({ reimbursed: value ? value === 'true' : undefined })}
          />
          <FilterSelect
            id='fuel-bus-filter'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(entry) => entry.id}
          loading={fuel.isFetching}
          error={fuel.isError ? fuel.error.message : null}
          onRetry={() => fuel.refetch()}
          onRowClick={onRowClick}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<MaintenanceSearch>)}
          empty={{
            icon: filtered ? CircleOff : Fuel,
            title: filtered ? 'No fuel entries match these filters' : 'No fuel entries yet',
            description: filtered
              ? 'Try another bus, status or dates, or clear the filters.'
              : 'Log each fill from the fuel bill, or let drivers add them from the app for you to check.',
            action: !filtered && canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add fuel entry
              </Button>
            ),
          }}
          card={(entry) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-bold'>{formatDate(entry.filled_on)}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {entry.vehicle.name} · {entry.vehicle.registration_no}
                  </span>
                </div>
                <span className='tabular font-bold'>{rupees(entry.amount)}</span>
              </div>
              <FuelFlags entry={entry} />
              <div className='tabular grid grid-cols-3 gap-2 text-xs'>
                <span>{formatNumber(entry.litres, 1, 'L')}</span>
                <span>{formatNumber(entry.km_per_litre, 2, 'km/l')}</span>
                <span>{formatNumber(entry.odometer_km, 0, 'km')}</span>
              </div>
              <span className='truncate text-xs text-muted-foreground'>
                {[
                  entry.fuel_station?.name ?? entry.station,
                  PAYMENT_MODE[entry.payment_mode],
                  entry.filled_by?.name,
                  entry.bill_file ? 'Bill attached' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {entry.price_warning && (
                <span className='text-xs text-warning'>{entry.price_warning}</span>
              )}
              {entry.review_note && (
                <span className='text-xs text-muted-foreground'>Note: {entry.review_note}</span>
              )}
              {(entry.status === 'pending' || needsPayBack(entry)) && canManage && (
                <span className='text-xs font-semibold text-primary'>
                  Tap to {entry.status === 'pending' ? 'approve or reject' : 'mark as paid back'}
                </span>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: fuel.data?.total ?? 0,
            label: 'entries',
            onPageChange,
          }}
        />
      </Card>
      <FuelFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        entry={editing}
        defaultVehicleId={search.vehicle_id}
      />
      <NoteDialog
        open={Boolean(review)}
        onOpenChange={(open) => !open && setReview(null)}
        title={review?.action === 'reject' ? 'Reject this fuel entry?' : 'Approve this fuel entry?'}
        description={
          review
            ? `${formatDate(review.entry.filled_on)} · ${review.entry.vehicle.name} · ${formatNumber(review.entry.litres, 1)} L for ${rupees(review.entry.amount)}${review.entry.filled_by ? ` by ${review.entry.filled_by.name}` : ''}.`
            : ''
        }
        label={review?.action === 'reject' ? 'Why is it rejected?' : 'Note'}
        placeholder={
          review?.action === 'reject' ? 'Bill photo does not match the amount' : 'Bill checked'
        }
        required={review?.action === 'reject'}
        destructive={review?.action === 'reject'}
        confirmText={review?.action === 'reject' ? 'Reject entry' : 'Approve entry'}
        onConfirm={async (note) => {
          if (!review) return
          if (review.action === 'reject') {
            await reject.mutateAsync({ id: review.entry.id, note })
            alerts.success('Fuel entry rejected')
          } else {
            await approve.mutateAsync({ id: review.entry.id, note })
            alerts.success('Fuel entry approved')
          }
          setReview(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(paying)}
        onOpenChange={(open) => !open && setPaying(null)}
        title='Mark as paid back?'
        description={
          paying
            ? `${rupees(paying.amount)} paid by ${paying.filled_by?.name ?? 'the driver'} on ${formatDate(paying.filled_on)} has been given back to them.`
            : ''
        }
        confirmText='Mark as paid back'
        loading={reimburse.isPending}
        onConfirm={async () => {
          if (!paying) return
          try {
            await reimburse.mutateAsync(paying.id)
            alerts.success('Marked as paid back')
            setPaying(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <NoteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete this fuel entry?'
        description={
          deleting
            ? `${formatDate(deleting.filled_on)} · ${deleting.vehicle.name} · ${formatNumber(deleting.litres, 1)} L for ${rupees(deleting.amount)}. Mileage of the next fill is worked out again.`
            : ''
        }
        label='Reason'
        placeholder='Entered twice'
        confirmText='Delete entry'
        destructive
        onConfirm={async (reason) => {
          if (!deleting) return
          await remove.mutateAsync({ id: deleting.id, reason })
          alerts.success('Fuel entry deleted')
          setDeleting(null)
        }}
      />
      <ActionSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => !open && setSheet(null)}
        title={sheet ? `Fuel entry of ${formatDate(sheet.filled_on)}` : ''}
        description={
          sheet
            ? `${sheet.vehicle.name} · ${formatNumber(sheet.litres, 1)} L for ${rupees(sheet.amount)}`
            : undefined
        }
        actions={sheet ? entryActions(sheet) : []}
      />
      <HistoryModal
        open={Boolean(history)}
        onOpenChange={(open) => !open && setHistory(null)}
        entity='fuel'
        entityId={history?.id}
        title={
          history ? `Fuel entry of ${formatDate(history.filled_on)} · ${history.vehicle.name}` : ''
        }
      />
    </>
  )
}
