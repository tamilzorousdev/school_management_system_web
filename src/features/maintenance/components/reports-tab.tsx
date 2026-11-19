import { useState } from 'react'
import { BarChart3, Download, HandCoins } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
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
  useReport,
  type CostRow,
  type IdleRow,
  type MileageRow,
  type ReimbursementRow,
  type ReportRange,
  type SpendGroup,
  type SpendRow,
} from '../api'
import { rupees } from '../labels'
import type { ReportView, TabProps } from '../search'
import { BusCell, DateRangeInputs } from './shared'

const VIEWS: { value: ReportView; label: string; description: string }[] = [
  {
    value: 'costs',
    label: 'Cost per bus',
    description: 'Fuel, service, repair and other spend of each bus by month, with cost per km.',
  },
  {
    value: 'mileage',
    label: 'Mileage',
    description: 'km per litre of each bus by month against its normal. Low months are marked.',
  },
  {
    value: 'spend',
    label: 'Spend',
    description: 'Where the money went, by category or by garage and fuel station.',
  },
  {
    value: 'idle',
    label: 'Idle fuel',
    description: 'Fuel burnt with the engine on and the bus standing, from the idle alerts.',
  },
  {
    value: 'reimbursements',
    label: 'To pay back',
    description: 'Fuel and expenses paid by drivers that are not yet paid back.',
  },
]

const month = (value: string) => {
  const [year, number] = value.split('-')
  const date = new Date(Date.UTC(Number(year), Number(number) - 1, 1))
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const busKey = (row: { vehicle: { id: number } }, extra = '') => `${row.vehicle.id}-${extra}`

export function ReportsTab({ search, setSearch, canManage }: TabProps) {
  const busOptions = useBusOptions()
  const view = search.report ?? 'costs'
  const group: SpendGroup = search.group ?? 'category'
  const range: ReportRange = { from: search.from, to: search.to, vehicle_id: search.vehicle_id }
  const [downloading, setDownloading] = useState(false)
  const current = VIEWS.find((item) => item.value === view) ?? VIEWS[0]

  const download = async () => {
    setDownloading(true)
    try {
      await maintenanceApi.downloadReport(
        view,
        view === 'spend' ? { ...range, group } : view === 'reimbursements' ? {} : range
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const filtered = Boolean(search.from || search.to || search.vehicle_id)

  return (
    <>
      <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
        <SegmentedControl
          className='w-max'
          label='Report'
          value={view}
          onChange={(value) => setSearch({ report: value })}
          options={VIEWS.map((item) => ({ value: item.value, label: item.label }))}
        />
      </div>
      <Card className='overflow-hidden'>
        <div className='border-b px-4 pt-3'>
          <p className='text-sm text-muted-foreground'>{current.description}</p>
        </div>
        <ListToolbar
          onClear={
            filtered && view !== 'reimbursements'
              ? () => setSearch({ from: undefined, to: undefined, vehicle_id: undefined })
              : undefined
          }
        >
          {view !== 'reimbursements' && (
            <>
              <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
              <FilterSelect
                id='report-bus-filter'
                label='Filter by bus'
                allLabel='All buses'
                value={search.vehicle_id ? String(search.vehicle_id) : undefined}
                options={busOptions}
                onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
              />
            </>
          )}
          {view === 'spend' && (
            <SegmentedControl
              label='Group spend by'
              value={group}
              onChange={(value) => setSearch({ group: value })}
              options={[
                { value: 'category', label: 'By category' },
                { value: 'vendor', label: 'By vendor' },
              ]}
            />
          )}
          <Button variant='outline' onClick={download} loading={downloading}>
            <Download />
            Excel
          </Button>
        </ListToolbar>
        {view === 'costs' && <CostsTable range={range} />}
        {view === 'mileage' && <MileageTable range={range} />}
        {view === 'spend' && <SpendTable range={range} group={group} />}
        {view === 'idle' && <IdleTable range={range} />}
        {view === 'reimbursements' && <ReimbursementsTable canManage={canManage} />}
      </Card>
      {view !== 'reimbursements' && (
        <p className='text-xs text-muted-foreground'>
          With no dates, reports cover the academic year being viewed, up to today.
        </p>
      )}
    </>
  )
}

const emptyReport = {
  icon: BarChart3,
  title: 'Nothing for these dates',
  description: 'Try a wider date range or another bus.',
}

function CostsTable({ range }: { range: ReportRange }) {
  const report = useReport('costs', range, () => maintenanceApi.costs(range))
  const columns: Column<CostRow>[] = [
    { key: 'bus', header: 'Bus', cell: (row) => <BusCell vehicle={row.vehicle} /> },
    {
      key: 'month',
      header: 'Month',
      cell: (row) => <span className='tabular'>{month(row.month)}</span>,
    },
    {
      key: 'fuel',
      header: 'Fuel',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.fuel)}</span>,
    },
    {
      key: 'service',
      header: 'Service',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.service)}</span>,
    },
    {
      key: 'repair',
      header: 'Repair',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.repair)}</span>,
    },
    {
      key: 'other',
      header: 'Other',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{rupees(row.other)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (row) => (
        <div className='grid justify-items-end gap-0.5'>
          <span className='tabular font-bold'>{rupees(row.total)}</span>
          {row.over_budget && <Badge tone='danger'>Over {rupees(row.budget)}</Badge>}
        </div>
      ),
    },
    {
      key: 'km',
      header: 'Per km',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => (
        <div className='grid'>
          <span className='tabular'>
            {row.cost_per_km !== null ? `₹${formatNumber(row.cost_per_km, 2)}` : '—'}
          </span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatNumber(row.km, 0, 'km')}
          </span>
        </div>
      ),
    },
    {
      key: 'seat',
      header: 'Per seat',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{rupees(row.cost_per_seat)}</span>,
    },
  ]
  return (
    <DataTable
      rows={report.data ?? []}
      columns={columns}
      rowKey={(row) => busKey(row, row.month)}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      empty={emptyReport}
      card={(row) => (
        <div className='grid gap-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='grid min-w-0'>
              <span className='font-bold'>{row.vehicle.name}</span>
              <span className='text-xs text-muted-foreground'>{month(row.month)}</span>
            </div>
            <span className='tabular font-bold'>{rupees(row.total)}</span>
          </div>
          {row.over_budget && (
            <span>
              <Badge tone='danger'>Over budget of {rupees(row.budget)}</Badge>
            </span>
          )}
          <span className='tabular text-xs text-muted-foreground'>
            Fuel {rupees(row.fuel)} · service {rupees(row.service)} · repair {rupees(row.repair)} ·
            other {rupees(row.other)}
            {row.cost_per_km !== null ? ` · ₹${formatNumber(row.cost_per_km, 2)}/km` : ''}
          </span>
        </div>
      )}
    />
  )
}

function MileageTable({ range }: { range: ReportRange }) {
  const report = useReport('mileage', range, () => maintenanceApi.mileage(range))
  const columns: Column<MileageRow>[] = [
    { key: 'bus', header: 'Bus', cell: (row) => <BusCell vehicle={row.vehicle} /> },
    {
      key: 'month',
      header: 'Month',
      cell: (row) => <span className='tabular'>{month(row.month)}</span>,
    },
    {
      key: 'litres',
      header: 'Litres',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{formatNumber(row.litres, 1)}</span>,
    },
    {
      key: 'km',
      header: 'km',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{formatNumber(row.km, 0)}</span>,
    },
    {
      key: 'kmpl',
      header: 'km/l',
      align: 'right',
      cell: (row) => (
        <div className='grid justify-items-end gap-0.5'>
          <span className='tabular font-bold'>{formatNumber(row.km_per_litre, 2)}</span>
          {row.low && <Badge tone='danger'>Low</Badge>}
        </div>
      ),
    },
    {
      key: 'normal',
      header: 'Normal',
      align: 'right',
      cell: (row) => (
        <span className='tabular text-muted-foreground'>{formatNumber(row.normal, 2)}</span>
      ),
    },
  ]
  return (
    <DataTable
      rows={report.data ?? []}
      columns={columns}
      rowKey={(row) => busKey(row, row.month)}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      empty={emptyReport}
      card={(row) => (
        <div className='grid gap-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='grid min-w-0'>
              <span className='font-bold'>{row.vehicle.name}</span>
              <span className='text-xs text-muted-foreground'>{month(row.month)}</span>
            </div>
            <span className='flex items-center gap-1.5'>
              {row.low && <Badge tone='danger'>Low</Badge>}
              <span className='tabular font-bold'>{formatNumber(row.km_per_litre, 2, 'km/l')}</span>
            </span>
          </div>
          <span className='tabular text-xs text-muted-foreground'>
            {formatNumber(row.litres, 1, 'L')} · {formatNumber(row.km, 0, 'km')} · normal{' '}
            {formatNumber(row.normal, 2, 'km/l')}
          </span>
        </div>
      )}
    />
  )
}

function SpendTable({ range, group }: { range: ReportRange; group: SpendGroup }) {
  const params = { ...range, group }
  const report = useReport('spend', params, () => maintenanceApi.spend(params))
  const rows = report.data ?? []
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const columns: Column<SpendRow>[] = [
    {
      key: 'label',
      header: group === 'vendor' ? 'Vendor' : 'Category',
      cell: (row) => <span className='font-semibold'>{row.label}</span>,
    },
    {
      key: 'entries',
      header: 'Entries',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.entries}</span>,
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular text-muted-foreground'>
          {total ? `${formatNumber((row.amount / total) * 100, 1)}%` : '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className='tabular font-bold'>{rupees(row.amount)}</span>,
    },
  ]
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.key}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      empty={emptyReport}
      card={(row) => (
        <div className='flex items-start justify-between gap-2'>
          <div className='grid min-w-0'>
            <span className='font-bold'>{row.label}</span>
            <span className='text-xs text-muted-foreground'>
              {row.entries} {row.entries === 1 ? 'entry' : 'entries'}
              {total ? ` · ${formatNumber((row.amount / total) * 100, 1)}%` : ''}
            </span>
          </div>
          <span className='tabular font-bold'>{rupees(row.amount)}</span>
        </div>
      )}
    />
  )
}

function IdleTable({ range }: { range: ReportRange }) {
  const report = useReport('idle', range, () => maintenanceApi.idle(range))
  const columns: Column<IdleRow>[] = [
    { key: 'bus', header: 'Bus', cell: (row) => <BusCell vehicle={row.vehicle} /> },
    {
      key: 'alerts',
      header: 'Idle alerts',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{row.alerts}</span>,
    },
    {
      key: 'minutes',
      header: 'Minutes',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.minutes, 0)}</span>,
    },
    {
      key: 'litres',
      header: 'Litres',
      align: 'right',
      cell: (row) => <span className='tabular'>{formatNumber(row.litres, 1)}</span>,
    },
    {
      key: 'amount',
      header: 'Cost',
      align: 'right',
      cell: (row) => <span className='tabular font-bold'>{rupees(row.amount)}</span>,
    },
  ]
  return (
    <DataTable
      rows={report.data ?? []}
      columns={columns}
      rowKey={(row) => row.vehicle.id}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      empty={{ ...emptyReport, description: 'No idle alerts in these dates.' }}
      card={(row) => (
        <div className='flex items-start justify-between gap-2'>
          <div className='grid min-w-0'>
            <span className='font-bold'>{row.vehicle.name}</span>
            <span className='tabular text-xs text-muted-foreground'>
              {row.alerts} alerts · {formatNumber(row.minutes, 0)} min ·{' '}
              {formatNumber(row.litres, 1, 'L')}
            </span>
          </div>
          <span className='tabular font-bold'>{rupees(row.amount)}</span>
        </div>
      )}
    />
  )
}

function ReimbursementsTable({ canManage }: { canManage: boolean }) {
  const report = useReport('reimbursements', {}, maintenanceApi.reimbursements)
  const [paying, setPaying] = useState<ReimbursementRow | null>(null)
  const pay = useMaintenanceMutation(async (row: ReimbursementRow) => {
    if (row.type === 'fuel') await maintenanceApi.reimburseFuel(row.id)
    else await maintenanceApi.reimburseExpense(row.id)
  })
  const rows = report.data ?? []
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const payButton = (row: ReimbursementRow) =>
    canManage && (
      <Button
        size='sm'
        variant='outline'
        onClick={(event) => {
          event.stopPropagation()
          setPaying(row)
        }}
      >
        <HandCoins />
        Paid back
      </Button>
    )
  const columns: Column<ReimbursementRow>[] = [
    {
      key: 'on',
      header: 'Date',
      cell: (row) => <span className='tabular font-semibold'>{formatDate(row.on)}</span>,
    },
    { key: 'bus', header: 'Bus', cell: (row) => <BusCell vehicle={row.vehicle} /> },
    {
      key: 'title',
      header: 'For',
      cell: (row) => (
        <span className='flex flex-wrap items-center gap-1.5'>
          <Badge tone={row.type === 'fuel' ? 'info' : 'neutral'}>
            {row.type === 'fuel' ? 'Fuel' : 'Expense'}
          </Badge>
          {row.title}
        </span>
      ),
    },
    {
      key: 'paid_by',
      header: 'Paid by',
      hideBelow: 'lg',
      cell: (row) => <span>{row.paid_by?.name ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className='tabular font-bold'>{rupees(row.amount)}</span>,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-32',
      cell: payButton,
    },
  ]
  return (
    <>
      {rows.length > 0 && (
        <p className='border-b px-4 py-2 text-sm'>
          <strong className='tabular'>{rupees(total)}</strong> to pay back across {rows.length}{' '}
          {rows.length === 1 ? 'entry' : 'entries'}
        </p>
      )}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => `${row.type}-${row.id}`}
        loading={report.isFetching}
        error={report.isError ? report.error.message : null}
        onRetry={() => report.refetch()}
        empty={{
          icon: HandCoins,
          title: 'Nothing to pay back',
          description: 'Fuel and expenses paid by drivers show here until they are paid back.',
        }}
        card={(row) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0'>
                <span className='font-bold'>{row.title}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {formatDate(row.on)} · {row.vehicle.name}
                  {row.paid_by ? ` · ${row.paid_by.name}` : ''}
                </span>
              </div>
              <span className='tabular font-bold'>{rupees(row.amount)}</span>
            </div>
            <div>{payButton(row)}</div>
          </div>
        )}
      />
      <ConfirmDialog
        open={Boolean(paying)}
        onOpenChange={(open) => !open && setPaying(null)}
        title='Mark as paid back?'
        description={
          paying
            ? `${rupees(paying.amount)} for ${paying.title} paid by ${paying.paid_by?.name ?? 'the driver'} on ${formatDate(paying.on)}.`
            : ''
        }
        confirmText='Mark as paid back'
        loading={pay.isPending}
        onConfirm={async () => {
          if (!paying) return
          try {
            await pay.mutateAsync(paying)
            alerts.success('Marked as paid back')
            setPaying(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </>
  )
}
