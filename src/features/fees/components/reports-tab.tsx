import { useState } from 'react'
import { BarChart3, Download, FileText } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { downloadFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import { useClasses } from '@/features/setup/api'
import {
  useCollectorOptions,
  useFeeReport,
  useInstallments,
  type BenefitKind,
  type FeeReportParams,
  type FeeReportType,
  type ReportColumn,
  type ReportValue,
} from '../api'
import { BENEFIT_KIND_OPTIONS, rupees } from '../labels'
import type { FeesSearch } from '../search'
import { DaySheetModal } from './day-sheet-modal'

const REPORTS: { value: FeeReportType; label: string; hint: string }[] = [
  {
    value: 'classes',
    label: 'By class',
    hint: 'Billed, concessions, collected and due for each class',
  },
  { value: 'heads', label: 'By fee head', hint: 'Tuition, books, transport and the rest' },
  { value: 'installments', label: 'By installment', hint: 'How each term or month is being paid' },
  {
    value: 'benefits',
    label: 'Concessions given',
    hint: 'Each concession and scholarship with the amount taken off',
  },
  {
    value: 'defaulters',
    label: 'Students due',
    hint: 'Students with a balance, most overdue first',
  },
  {
    value: 'collections',
    label: 'Daily collection',
    hint: 'Money received each day by mode: fees, advances and library fines, less refunds',
  },
  {
    value: 'collectors',
    label: 'By staff',
    hint: 'What each staff member received and refunded, and the cash they should hand over',
  },
]

const DATED: FeeReportType[] = ['collections', 'collectors']

type Row = Record<string, ReportValue> & { __key: string }

function display(column: ReportColumn, value: ReportValue | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  if (column.kind === 'money') return rupees(Number(value))
  if (column.kind === 'percent') return `${Number(value).toFixed(1)}%`
  if (column.kind === 'date') return formatDate(String(value))
  return String(value)
}

const SECONDARY = [
  'students',
  'invoices',
  'discount',
  'paid_invoices',
  'invoices_due',
  'oldest_due',
  'admission_no',
  'active_students',
  'receipts',
  'card',
  'bank_transfer',
  'cheque',
  'online',
  'advance',
]

const numeric = (column: ReportColumn) => column.kind !== 'text' && column.kind !== 'date'

export function ReportsTab({
  search,
  onChange,
}: {
  search: FeesSearch
  onChange: (patch: Partial<FeesSearch>) => void
}) {
  const type = search.report ?? 'classes'
  const classes = useClasses()
  const installments = useInstallments()
  const collectors = useCollectorOptions()
  const [downloading, setDownloading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const dated = DATED.includes(type)
  const params: FeeReportParams = {
    class_id: search.class_id,
    section_id: search.section_id,
    installment: dated || type === 'benefits' ? undefined : search.installment,
    kind: type === 'benefits' ? search.kind : undefined,
    overdue_only: type === 'defaulters' && search.overdue ? true : undefined,
    from: dated ? search.from : undefined,
    to: dated ? search.to : undefined,
    received_by: dated ? search.received_by : undefined,
  }
  const report = useFeeReport(type, params)
  const sections = (classes.data ?? []).find((item) => item.id === search.class_id)?.sections ?? []
  const current = REPORTS.find((item) => item.value === type)!
  const filtered = Boolean(
    search.class_id ||
    search.section_id ||
    search.installment ||
    search.kind ||
    search.overdue ||
    search.from ||
    search.to ||
    search.received_by
  )

  useShortcut('app.refresh', () => void report.refetch())

  const columns: Column<Row>[] = (report.data?.columns ?? []).map((column, index) => ({
    key: column.key,
    header: column.label,
    align: numeric(column) ? 'right' : undefined,
    hideBelow: SECONDARY.includes(column.key) ? 'xl' : undefined,
    cell: (row) => (
      <span
        className={
          numeric(column)
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

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Fee reports</h2>
          <p className='text-xs text-muted-foreground'>
            {current.hint}
            {report.data ? ` · ${report.data.academic_year}` : ''}. Cancelled invoices are left out.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {dated && (
            <Button size='sm' variant='outline' onClick={() => setSheetOpen(true)}>
              <FileText />
              Day-end sheet
            </Button>
          )}
          <Button
            size='sm'
            variant='outline'
            loading={downloading}
            disabled={!report.data?.rows.length}
            onClick={async () => {
              setDownloading(true)
              try {
                await downloadFile(
                  `/admin/fees/reports/${type}/xlsx`,
                  `${report.data?.title ?? 'Fee report'}.xlsx`,
                  { ...params }
                )
              } catch (error) {
                alerts.error(
                  error instanceof Error ? error.message : 'Could not download the report'
                )
              } finally {
                setDownloading(false)
              }
            }}
          >
            <Download />
            Download Excel
          </Button>
        </div>
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
            onClick={() => onChange({ report: item.value })}
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
            ? () =>
                onChange({
                  class_id: undefined,
                  section_id: undefined,
                  installment: undefined,
                  kind: undefined,
                  overdue: undefined,
                  from: undefined,
                  to: undefined,
                  received_by: undefined,
                })
            : undefined
        }
      >
        <FilterSelect
          id='report-class-filter'
          label='Filter by class'
          allLabel='All classes'
          value={search.class_id ? String(search.class_id) : undefined}
          options={(classes.data ?? []).map((item) => ({
            value: String(item.id),
            label: `Class ${item.name}`,
          }))}
          onChange={(value) =>
            onChange({ class_id: value ? Number(value) : undefined, section_id: undefined })
          }
        />
        {sections.length > 0 && (
          <FilterSelect
            id='report-section-filter'
            label='Filter by section'
            allLabel='All sections'
            value={search.section_id ? String(search.section_id) : undefined}
            options={sections.map((section) => ({
              value: String(section.id),
              label: `Section ${section.name}`,
            }))}
            onChange={(value) => onChange({ section_id: value ? Number(value) : undefined })}
          />
        )}
        {!dated && type !== 'benefits' && (
          <FilterSelect
            id='report-installment-filter'
            label='Filter by installment'
            allLabel='All installments'
            value={search.installment}
            options={(installments.data ?? []).map((item) => ({
              value: item.installment,
              label: item.installment,
            }))}
            onChange={(value) => onChange({ installment: value || undefined })}
          />
        )}
        {type === 'benefits' && (
          <FilterSelect
            id='report-kind-filter'
            label='Filter by kind'
            allLabel='Concessions and scholarships'
            value={search.kind}
            options={BENEFIT_KIND_OPTIONS}
            onChange={(value) => onChange({ kind: value as BenefitKind | undefined })}
          />
        )}
        {type === 'defaulters' && (
          <label className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
            <Switch
              aria-label='Overdue only'
              checked={Boolean(search.overdue)}
              onCheckedChange={(checked) => onChange({ overdue: checked || undefined })}
            />
            Overdue only
          </label>
        )}
        {dated && (
          <>
            <FilterSelect
              id='report-collector-filter'
              label='Filter by who received it'
              allLabel='Received by anyone'
              value={search.received_by ? String(search.received_by) : undefined}
              options={collectors.data ?? []}
              onChange={(value) => onChange({ received_by: value ? Number(value) : undefined })}
            />
            <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
              <span className='w-10 shrink-0 sm:w-auto'>From</span>
              <Input
                type='date'
                aria-label='From date'
                value={search.from ?? report.data?.from ?? ''}
                max={search.to}
                className='h-9 sm:w-40'
                onChange={(event) => onChange({ from: event.target.value || undefined })}
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
                onChange={(event) => onChange({ to: event.target.value || undefined })}
              />
            </label>
          </>
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
            ? 'Try other filters or clear them.'
            : 'Raise invoices or record payments to see this report.',
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
      <DaySheetModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultDate={search.to}
        defaultCollector={search.received_by}
      />
      {totals && report.data && rows.length > 0 && (
        <div className='border-t bg-muted/40 px-4 py-3'>
          <dl className='flex flex-wrap gap-x-6 gap-y-1 text-sm'>
            {report.data.columns
              .filter((column) => column.kind === 'money' || column.kind === 'percent')
              .filter((column) => totals[column.key] !== null && totals[column.key] !== undefined)
              .map((column) => (
                <div key={column.key} className='flex items-baseline gap-1.5'>
                  <dt className='text-xs text-muted-foreground'>{column.label}</dt>
                  <dd className='tabular font-bold'>{display(column, totals[column.key])}</dd>
                </div>
              ))}
          </dl>
          {report.data.note && (
            <p className='mt-1 text-xs text-muted-foreground'>{report.data.note}</p>
          )}
        </div>
      )}
    </Card>
  )
}
