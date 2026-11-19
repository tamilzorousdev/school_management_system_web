import { useState } from 'react'
import { Download } from 'lucide-react'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { PageTabs } from '@/components/common/page-tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  GROUP_BY,
  inventoryApi,
  inventoryFiles,
  useReport,
  type ConsumptionRow,
  type DepreciationRow,
  type GroupBy,
  type GroupRow,
  type InventoryAccess,
  type MaintenanceCostRow,
  type ReportParams,
  type StockValuationRow,
} from '../api'
import {
  downloadInventoryFile,
  GROUP_BY_LABEL,
  idOrUndefined,
  money,
  qty,
  stringId,
} from '../labels'
import { pick, REPORT_VIEWS, type InventorySearch, type InventorySearchPatch } from '../search'
import { CategoryPicker, DepartmentPicker, LocationPicker } from './pickers'
import { ReportTable, type ReportColumn } from './report-table'

type ReportView = (typeof REPORT_VIEWS)[number]

const VIEW_LABELS: Record<ReportView, string> = {
  assets: 'Asset summary',
  depreciation: 'Depreciation',
  maintenance: 'Maintenance cost',
  consumption: 'Consumption',
  valuation: 'Stock valuation',
}

const sum = <T,>(rows: T[], value: (row: T) => number) =>
  rows.reduce((total, row) => total + value(row), 0)

export function ReportsTab({
  search,
  onChange,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const view = pick(REPORT_VIEWS, search.view) ?? 'assets'
  const groupBy: GroupBy = search.group_by ?? 'category'
  const [downloading, setDownloading] = useState<string | null>(null)
  const filters: ReportParams = {
    from: search.from,
    to: search.to,
    category_id: search.category_id,
    location_id: search.location_id,
    department_id: search.department_id,
    as_on: search.as_on,
  }
  const filtered = Object.values(filters).some(Boolean)
  const usesRange = view !== 'assets' && view !== 'valuation'

  const download = async (kind: 'register' | 'movements') => {
    setDownloading(kind)
    await downloadInventoryFile(
      kind === 'register' ? inventoryFiles.registerExport : inventoryFiles.movementsExport,
      kind === 'register' ? 'asset-register.csv' : 'stock-ledger.csv',
      kind === 'register'
        ? inventoryFiles.registerParams({
            category_id: filters.category_id,
            location_id: filters.location_id,
            department_id: filters.department_id,
          })
        : { ...filters }
    )
    setDownloading(null)
  }

  return (
    <div className='grid gap-4'>
      <PageTabs
        label='Reports'
        value={view}
        onChange={(next) => onChange({ view: next })}
        tabs={REPORT_VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }))}
      />
      <Card className='overflow-hidden'>
        <ListToolbar
          onClear={
            filtered
              ? () =>
                  onChange({
                    from: undefined,
                    to: undefined,
                    category_id: undefined,
                    location_id: undefined,
                    department_id: undefined,
                    as_on: undefined,
                  })
              : undefined
          }
        >
          {view === 'assets' && (
            <FilterSelect
              id='report-group-by'
              label='Group by'
              allLabel='By category'
              value={groupBy === 'category' ? undefined : groupBy}
              options={GROUP_BY.filter((value) => value !== 'category').map((value) => ({
                value,
                label: `By ${GROUP_BY_LABEL[value].toLowerCase()}`,
              }))}
              onChange={(value) => onChange({ group_by: (value as GroupBy) ?? undefined })}
            />
          )}
          {usesRange ? (
            <>
              <DateFilter
                label='From'
                value={search.from}
                max={search.to}
                onChange={(from) => onChange({ from })}
              />
              <DateFilter
                label='To'
                value={search.to}
                min={search.from}
                onChange={(to) => onChange({ to })}
              />
            </>
          ) : (
            <DateFilter
              label='As on'
              value={search.as_on}
              onChange={(as_on) => onChange({ as_on })}
            />
          )}
          <CategoryPicker
            id='report-category'
            label='Category'
            allLabel='All categories'
            kind={view === 'consumption' || view === 'valuation' ? 'stock' : 'asset'}
            value={stringId(search.category_id)}
            onChange={(value) => onChange({ category_id: idOrUndefined(value) })}
          />
          {(view === 'assets' || view === 'depreciation') && (
            <LocationPicker
              id='report-location'
              label='Location'
              allLabel='All locations'
              value={stringId(search.location_id)}
              onChange={(value) => onChange({ location_id: idOrUndefined(value) })}
            />
          )}
          {(view === 'assets' || view === 'consumption') && (
            <DepartmentPicker
              id='report-department'
              label='Department'
              allLabel='All departments'
              value={stringId(search.department_id)}
              onChange={(value) => onChange({ department_id: idOrUndefined(value) })}
            />
          )}
        </ListToolbar>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <p className='text-xs text-muted-foreground'>
            {usesRange
              ? 'Leave the dates empty for this academic year.'
              : 'Values as on the chosen date, or today.'}
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              loading={downloading === 'register'}
              onClick={() => void download('register')}
            >
              <Download />
              Asset register (CSV)
            </Button>
            <Button
              size='sm'
              variant='outline'
              loading={downloading === 'movements'}
              onClick={() => void download('movements')}
            >
              <Download />
              Stock ledger (CSV)
            </Button>
          </div>
        </div>
        {view === 'assets' && <GroupReport filters={filters} groupBy={groupBy} />}
        {view === 'depreciation' && <DepreciationReport filters={filters} />}
        {view === 'maintenance' && <MaintenanceReport filters={filters} />}
        {view === 'consumption' && <ConsumptionReport filters={filters} />}
        {view === 'valuation' && <ValuationReport filters={filters} />}
      </Card>
    </div>
  )
}

function DateFilter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value?: string
  min?: string
  max?: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
      <span className='w-12 shrink-0 sm:w-auto'>{label}</span>
      <Input
        type='date'
        aria-label={`${label} date`}
        value={value ?? ''}
        min={min}
        max={max}
        className='h-9 sm:w-40'
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </label>
  )
}

function GroupReport({ filters, groupBy }: { filters: ReportParams; groupBy: GroupBy }) {
  const params = { ...filters, group_by: groupBy }
  const report = useReport('assets', params, () => inventoryApi.groupReport(params))
  const rows = report.data ?? []
  const columns: ReportColumn<GroupRow>[] = [
    {
      key: 'name',
      header: GROUP_BY_LABEL[groupBy],
      cell: (row) => <span className='font-semibold'>{row.name}</span>,
    },
    {
      key: 'assets',
      header: 'Assets',
      numeric: true,
      cell: (row) => qty(row.assets),
      total: qty(sum(rows, (row) => row.assets)),
    },
    {
      key: 'allocated',
      header: 'Allocated',
      numeric: true,
      cell: (row) => qty(row.allocated),
      total: qty(sum(rows, (row) => row.allocated)),
    },
    {
      key: 'maintenance',
      header: 'Under maintenance',
      numeric: true,
      cell: (row) => qty(row.in_maintenance),
      total: qty(sum(rows, (row) => row.in_maintenance)),
    },
    {
      key: 'cost',
      header: 'Cost',
      numeric: true,
      cell: (row) => money(row.cost),
      total: money(sum(rows, (row) => row.cost)),
    },
    {
      key: 'book',
      header: 'Book value',
      numeric: true,
      cell: (row) => money(row.book_value),
      total: money(sum(rows, (row) => row.book_value)),
    },
  ]
  return (
    <ReportTable
      rows={rows}
      columns={columns}
      rowKey={(row, index) => `${row.id ?? 'none'}-${index}`}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      emptyText='No assets match these filters.'
      showTotals
    />
  )
}

function DepreciationReport({ filters }: { filters: ReportParams }) {
  const report = useReport('depreciation', filters, () => inventoryApi.depreciationReport(filters))
  const rows = report.data ?? []
  const columns: ReportColumn<DepreciationRow>[] = [
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <span className='font-semibold'>{row.category.name}</span>,
    },
    {
      key: 'assets',
      header: 'Assets',
      numeric: true,
      cell: (row) => qty(row.assets),
      total: qty(sum(rows, (row) => row.assets)),
    },
    {
      key: 'cost',
      header: 'Cost',
      numeric: true,
      cell: (row) => money(row.cost),
      total: money(sum(rows, (row) => row.cost)),
    },
    {
      key: 'opening',
      header: 'Opening value',
      numeric: true,
      cell: (row) => money(row.opening_value),
      total: money(sum(rows, (row) => row.opening_value)),
    },
    {
      key: 'depreciation',
      header: 'Depreciation',
      numeric: true,
      cell: (row) => money(row.depreciation),
      total: money(sum(rows, (row) => row.depreciation)),
    },
    {
      key: 'closing',
      header: 'Closing value',
      numeric: true,
      cell: (row) => money(row.closing_value),
      total: money(sum(rows, (row) => row.closing_value)),
    },
  ]
  return (
    <ReportTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.category.id}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      emptyText='No assets with a cost and purchase date in this range.'
      showTotals
    />
  )
}

function MaintenanceReport({ filters }: { filters: ReportParams }) {
  const report = useReport('maintenance', filters, () => inventoryApi.maintenanceReport(filters))
  const rows = report.data ?? []
  const columns: ReportColumn<MaintenanceCostRow>[] = [
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <span className='font-semibold'>{row.category.name}</span>,
    },
    {
      key: 'tickets',
      header: 'Tickets',
      numeric: true,
      cell: (row) => qty(row.tickets),
      total: qty(sum(rows, (row) => row.tickets)),
    },
    {
      key: 'resolved',
      header: 'Resolved',
      numeric: true,
      cell: (row) => qty(row.resolved),
      total: qty(sum(rows, (row) => row.resolved)),
    },
    {
      key: 'cost',
      header: 'Cost',
      numeric: true,
      cell: (row) => money(row.cost),
      total: money(sum(rows, (row) => row.cost)),
    },
    {
      key: 'downtime',
      header: 'Average downtime',
      numeric: true,
      cell: (row) =>
        row.average_downtime_days === null ? '—' : `${qty(row.average_downtime_days)} days`,
    },
  ]
  return (
    <ReportTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.category.id}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      emptyText='No maintenance tickets in this range.'
      showTotals
    />
  )
}

function ConsumptionReport({ filters }: { filters: ReportParams }) {
  const report = useReport('consumption', filters, () => inventoryApi.consumptionReport(filters))
  const rows = report.data ?? []
  const columns: ReportColumn<ConsumptionRow>[] = [
    {
      key: 'department',
      header: 'Department',
      cell: (row) => row.department?.name ?? 'Not given',
    },
    {
      key: 'item',
      header: 'Item',
      cell: (row) => <span className='font-semibold'>{row.item.name}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      numeric: true,
      cell: (row) => qty(row.quantity, row.unit),
    },
    {
      key: 'value',
      header: 'Value',
      numeric: true,
      cell: (row) => money(row.value),
      total: money(sum(rows, (row) => row.value)),
    },
  ]
  return (
    <ReportTable
      rows={rows}
      columns={columns}
      rowKey={(row, index) => `${row.department?.id ?? 0}-${row.item.id}-${index}`}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      emptyText='No stock was issued in this range.'
      showTotals
    />
  )
}

function ValuationReport({ filters }: { filters: ReportParams }) {
  const report = useReport('valuation', filters, () => inventoryApi.valuationReport(filters))
  const rows = report.data ?? []
  const columns: ReportColumn<StockValuationRow>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.item.name}</span>
          <span className='text-xs text-muted-foreground'>{row.category.name}</span>
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'On hand',
      numeric: true,
      cell: (row) => (
        <span className={row.low ? 'font-bold text-destructive' : undefined}>
          {qty(row.quantity, row.unit)}
        </span>
      ),
    },
    {
      key: 'reorder',
      header: 'Reorder level',
      numeric: true,
      cell: (row) => qty(row.reorder_level, row.unit),
    },
    {
      key: 'rate',
      header: 'Average rate',
      numeric: true,
      cell: (row) => money(row.average_rate),
    },
    {
      key: 'value',
      header: 'Value',
      numeric: true,
      cell: (row) => money(row.value),
      total: money(sum(rows, (row) => row.value)),
    },
  ]
  return (
    <ReportTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.item.id}
      loading={report.isFetching}
      error={report.isError ? report.error.message : null}
      onRetry={() => report.refetch()}
      emptyText='No stock items yet.'
      showTotals
    />
  )
}
