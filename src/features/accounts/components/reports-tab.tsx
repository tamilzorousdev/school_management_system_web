import { useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ReportColumn, ReportValue } from '@/features/fees/api'
import { alerts } from '@/lib/alerts'
import { downloadFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import {
  reportFileUrl,
  useAccountReport,
  type AccountKind,
  type AccountReportParams,
  type AccountReportType,
} from '../api'
import { rupees } from '../labels'
import type { AccountsTabProps } from '../search'

const REPORTS: { value: AccountReportType; label: string; hint: string }[] = [
  {
    value: 'monthly',
    label: 'Income vs expense',
    hint: 'Fees, library fines and other income against school, bus and salary costs, month by month',
  },
  {
    value: 'categories',
    label: 'By category',
    hint: 'Where the money came from and where it went, with each category’s share',
  },
  {
    value: 'register',
    label: 'Register',
    hint: 'Every approved expense and income entry, by date',
  },
]

const KIND_OPTIONS = [
  { value: 'expense', label: 'Expenses only' },
  { value: 'income', label: 'Income only' },
]

type Row = Record<string, ReportValue> & { __key: string }

function display(column: ReportColumn, value: ReportValue | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  if (column.kind === 'money') return rupees(Number(value))
  if (column.kind === 'percent') return `${Number(value).toFixed(1)}%`
  if (column.kind === 'date') return formatDate(String(value))
  return String(value)
}

const SECONDARY = ['library_fines', 'other_income', 'bus_costs', 'reference', 'added_by', 'share']
const numeric = (column: ReportColumn) => column.kind !== 'text' && column.kind !== 'date'

export function ReportsTab({ search, setSearch }: AccountsTabProps) {
  const type = search.report ?? 'monthly'
  const [downloading, setDownloading] = useState(false)
  const params: AccountReportParams = {
    from: search.from,
    to: search.to,
    kind: type === 'register' ? search.kind : undefined,
  }
  const report = useAccountReport(type, params)
  const current = REPORTS.find((item) => item.value === type)!
  const filtered = Boolean(search.from || search.to || (type === 'register' && search.kind))

  useShortcut('app.refresh', () => void report.refetch())

  const columns: Column<Row>[] = (report.data?.columns ?? []).map((column, index) => ({
    key: column.key,
    header: column.label,
    align: numeric(column) ? 'right' : undefined,
    hideBelow: SECONDARY.includes(column.key) ? 'xl' : undefined,
    cell: (row) => (
      <span
        className={
          column.key === 'net'
            ? `tabular font-bold whitespace-nowrap ${Number(row.net) < 0 ? 'text-destructive' : 'text-success'}`
            : numeric(column)
              ? 'tabular whitespace-nowrap'
              : index === 0
                ? 'font-semibold whitespace-nowrap'
                : 'text-muted-foreground'
        }
      >
        {display(column, row[column.key])}
      </span>
    ),
  }))
  const rows: Row[] = (report.data?.rows ?? []).map((row, index) => ({
    ...row,
    __key: String(index),
  }))
  const totals = report.data?.totals
  const surplus = type === 'categories' ? totals?.amount : totals?.net

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Income and expense reports</h2>
          <p className='text-xs text-muted-foreground'>
            {current.hint}
            {report.data?.from && report.data.to
              ? ` · ${formatDate(report.data.from)} to ${formatDate(report.data.to)}`
              : ''}
          </p>
        </div>
        <Button
          size='sm'
          variant='outline'
          loading={downloading}
          disabled={!report.data?.rows.length}
          onClick={async () => {
            setDownloading(true)
            try {
              await downloadFile(
                reportFileUrl(type),
                `${report.data?.title ?? 'Income and expense'}.xlsx`,
                { ...params }
              )
            } catch (error) {
              alerts.error(error instanceof Error ? error.message : 'Could not download the report')
            } finally {
              setDownloading(false)
            }
          }}
        >
          <Download />
          Download Excel
        </Button>
      </div>
      <div
        role='tablist'
        aria-label='Report'
        className='flex gap-1.5 overflow-x-auto border-b px-4 py-2'
      >
        {REPORTS.map((item) => (
          <button
            key={item.value}
            type='button'
            role='tab'
            aria-selected={item.value === type}
            onClick={() => setSearch({ report: item.value })}
            className={
              item.value === type
                ? 'shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                : 'shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground'
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <ListToolbar
        summary={report.data ? `${report.data.rows.length} rows` : ''}
        onClear={
          filtered
            ? () => setSearch({ from: undefined, to: undefined, kind: undefined })
            : undefined
        }
      >
        <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
          <span className='w-10 shrink-0 sm:w-auto'>From</span>
          <Input
            type='date'
            aria-label='From date'
            value={search.from ?? report.data?.from ?? ''}
            max={search.to}
            className='h-9 sm:w-40'
            onChange={(event) => setSearch({ from: event.target.value || undefined })}
          />
        </label>
        <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
          <span className='w-10 shrink-0 sm:w-auto'>To</span>
          <Input
            type='date'
            aria-label='To date'
            value={search.to ?? report.data?.to ?? ''}
            min={search.from}
            className='h-9 sm:w-40'
            onChange={(event) => setSearch({ to: event.target.value || undefined })}
          />
        </label>
        {type === 'register' && (
          <FilterSelect
            id='account-report-kind'
            label='Filter by type'
            allLabel='Expenses and income'
            value={search.kind}
            options={KIND_OPTIONS}
            onChange={(value) => setSearch({ kind: value as AccountKind | undefined })}
          />
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.__key}
        loading={report.isFetching}
        error={report.isError ? report.error.message : null}
        onRetry={() => report.refetch()}
        empty={{
          icon: BarChart3,
          title: 'Nothing to show',
          description: filtered
            ? 'Try other dates or clear the filters.'
            : 'Approved expenses and income, fee payments and payroll show up here.',
        }}
        card={(row) => {
          const all = report.data?.columns ?? []
          const [first, ...rest] = all
          return (
            <div className='grid gap-1.5'>
              {first && <span className='font-semibold'>{display(first, row[first.key])}</span>}
              <dl className='grid grid-cols-2 gap-x-3 gap-y-1 text-xs'>
                {rest.map((column) => (
                  <div key={column.key} className='flex justify-between gap-2'>
                    <dt className='text-muted-foreground'>{column.label}</dt>
                    <dd className='tabular text-right font-semibold'>
                      {display(column, row[column.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        }}
      />
      {totals && report.data && rows.length > 0 && (
        <div className='border-t bg-muted/40 px-4 py-3'>
          <dl className='flex flex-wrap gap-x-6 gap-y-1 text-sm'>
            {type === 'categories' ? (
              <div className='flex items-baseline gap-1.5'>
                <dt className='text-xs text-muted-foreground'>Surplus (income less expense)</dt>
                <dd
                  className={`tabular font-bold ${Number(surplus) < 0 ? 'text-destructive' : 'text-success'}`}
                >
                  {rupees(Number(surplus ?? 0))}
                </dd>
              </div>
            ) : (
              report.data.columns
                .filter((column) => column.kind === 'money')
                .filter((column) => totals[column.key] !== null && totals[column.key] !== undefined)
                .map((column) => (
                  <div key={column.key} className='flex items-baseline gap-1.5'>
                    <dt className='text-xs text-muted-foreground'>{column.label}</dt>
                    <dd
                      className={
                        column.key === 'net'
                          ? `tabular font-bold ${Number(totals.net) < 0 ? 'text-destructive' : 'text-success'}`
                          : 'tabular font-bold'
                      }
                    >
                      {display(column, totals[column.key])}
                    </dd>
                  </div>
                ))
            )}
          </dl>
          {report.data.note && (
            <p className='mt-1 text-xs text-muted-foreground'>{report.data.note}</p>
          )}
        </div>
      )}
    </Card>
  )
}
