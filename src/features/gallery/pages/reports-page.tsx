import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BarChart3, FileSpreadsheet, FileText } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { useAcademicYears } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import { galleryApi, useGalleryReport, type ExportFormat } from '../api'
import { GalleryTabs } from '../components/gallery-tabs'
import { formatStorage, REPORT_OPTIONS } from '../labels'
import type { GalleryReportsSearch } from '../search'

const route = getRouteApi('/_app/gallery/reports')

type Row = Record<string, string | number | null>

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function formatCell(key: string, value: string | number | null) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number' && key.endsWith('bytes')) return formatStorage(value)
  if (typeof value === 'string' && DATE_TIME.test(value)) return formatDateTime(value)
  if (typeof value === 'number') return value.toLocaleString()
  return value
}

export function GalleryReportsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/reports' })
  const me = useMe().data
  const canView = can(me, 'gallery.view')
  const years = useAcademicYears()
  const params = { academic_year_id: search.academic_year_id, from: search.from, to: search.to }
  const report = useGalleryReport(search.report, params)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const meta = REPORT_OPTIONS.find((option) => option.value === search.report)

  const setSearch = (patch: Partial<GalleryReportsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => void report.refetch())

  const exportReport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await downloadFile(
        galleryApi.reportExportUrl(search.report),
        `gallery-${search.report}.${format}`,
        {
          ...params,
          format,
        }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setExporting(null)
    }
  }

  const data = report.data
  const rows = (data?.rows ?? []) as Row[]
  const columns: Column<Row>[] = (data?.columns ?? []).map((column, index) => ({
    key: column.key,
    header: column.label,
    align: rows.some((row) => typeof row[column.key] === 'number') ? 'right' : 'left',
    hideBelow: index > 4 ? 'xl' : index > 3 ? 'lg' : undefined,
    cell: (row) => <span className='tabular'>{formatCell(column.key, row[column.key])}</span>,
  }))
  const filtered = Boolean(search.academic_year_id || search.from || search.to)

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Reports' />
        <EmptyState icon={BarChart3} title='No access to gallery reports' />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Reports'
        description='Usage by class and section, uploads, storage, deletions and cleanup runs. Download any report as Excel or CSV.'
      />
      <GalleryTabs active='/gallery/reports' />

      <Card className='overflow-hidden'>
        <CardHeader className='pb-4'>
          <div className='grid gap-0.5'>
            <CardTitle>{data?.title ?? meta?.label ?? 'Report'}</CardTitle>
            <CardDescription>{meta?.hint}</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              loading={exporting === 'xlsx'}
              onClick={() => void exportReport('xlsx')}
            >
              <FileSpreadsheet />
              Excel
            </Button>
            <Button
              variant='outline'
              size='sm'
              loading={exporting === 'csv'}
              onClick={() => void exportReport('csv')}
            >
              <FileText />
              CSV
            </Button>
          </div>
        </CardHeader>
        <ListToolbar
          summary={data ? `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}` : ''}
          onClear={
            filtered
              ? () => navigate({ search: { report: search.report }, replace: true })
              : undefined
          }
        >
          <FilterSelect
            id='gallery-report'
            label='Report'
            allLabel={meta?.label ?? 'Choose a report'}
            value={search.report}
            options={REPORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className='sm:w-56'
            onChange={(value) =>
              value && setSearch({ report: value as GalleryReportsSearch['report'] })
            }
          />
          <FilterSelect
            id='gallery-report-year'
            label='Filter by academic year'
            allLabel='Year being viewed'
            value={search.academic_year_id ? String(search.academic_year_id) : undefined}
            options={(years.data ?? []).map((year) => ({
              value: String(year.id),
              label: year.name,
              hint: year.is_current ? 'Current' : undefined,
            }))}
            onChange={(value) => setSearch({ academic_year_id: value ? Number(value) : undefined })}
          />
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              aria-label='From date'
              placeholder='From'
              value={search.from ?? ''}
              max={search.to}
              className='w-36'
              onChange={(event) => setSearch({ from: event.target.value || undefined })}
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input
              type='date'
              aria-label='To date'
              placeholder='To'
              value={search.to ?? ''}
              min={search.from}
              className='w-36'
              onChange={(event) => setSearch({ to: event.target.value || undefined })}
            />
          </div>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => rows.indexOf(row)}
          loading={report.isFetching}
          error={report.isError ? report.error.message : null}
          onRetry={() => report.refetch()}
          empty={{
            icon: BarChart3,
            title: 'Nothing to show',
            description: filtered
              ? 'Try another date range or year.'
              : 'This report fills in as the gallery is used.',
          }}
          card={(row) => (
            <dl className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm'>
              {(data?.columns ?? []).map((column) => (
                <div key={column.key} className='grid min-w-0'>
                  <dt className='text-[11px] font-semibold text-muted-foreground'>
                    {column.label}
                  </dt>
                  <dd className='tabular truncate font-medium'>
                    {formatCell(column.key, row[column.key])}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        />
      </Card>
    </Page>
  )
}
