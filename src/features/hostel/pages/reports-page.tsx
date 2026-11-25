import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BarChart3, FileSpreadsheet } from 'lucide-react'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState } from '@/components/common/display'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { cn } from '@/lib/utils'
import { useHostelModules, type EnabledModules } from '../api'
import { reportExportPath, reportKeys, type ReportParams } from '../api-reports'
import { ModuleOffState } from '../components/hostel-life-tabs'
import { HostelTabs } from '../components/hostel-tabs'
import { HostelSelect } from '../components/pickers'
import { AttendanceReportView } from '../components/report-attendance'
import { ComplaintsReportView } from '../components/report-complaints'
import { DisciplineReportView } from '../components/report-discipline'
import { FeesReportView } from '../components/report-fees'
import { HealthReportView } from '../components/report-health'
import {
  defaultRange,
  isExportable,
  REPORT_META,
  SNAPSHOT_REPORTS,
} from '../components/report-helpers'
import { LeavesReportView } from '../components/report-leaves'
import { MessReportView } from '../components/report-mess'
import { OccupancyReportView } from '../components/report-occupancy'
import { SummaryReportView } from '../components/report-summary'
import { VisitorsReportView } from '../components/report-visitors'
import { HOSTEL_REPORTS, type HostelReport, type HostelReportsSearch } from '../search'

const route = getRouteApi('/_app/hostel/reports')

const DAY_MS = 86_400_000
const MAX_DAYS = 366

const isOff = (report: HostelReport, enabled?: EnabledModules) => {
  const module = REPORT_META[report].module
  return Boolean(module && enabled && enabled[module] === false)
}

export function HostelReportsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/reports' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const allowed = can(me, 'hostel.reports')
  const modules = useHostelModules(allowed)
  const [exporting, setExporting] = useState(false)

  const fallback = defaultRange()
  const from = search.from ?? fallback.from
  const to = search.to ?? fallback.to
  const report = search.report
  const meta = REPORT_META[report]
  const snapshot = SNAPSHOT_REPORTS.includes(report)
  const enabled = modules.data?.enabled_modules
  const days = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1
  const rangeParams: ReportParams = { hostel_id: search.hostel_id, from, to }
  const snapshotParams: ReportParams = { hostel_id: search.hostel_id }
  const filtered = Boolean(search.hostel_id || search.from || search.to)

  const setSearch = (patch: Partial<HostelReportsSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => void queryClient.invalidateQueries({ queryKey: reportKeys.all }))

  if (me && !allowed) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel reports' />
        <EmptyState
          icon={BarChart3}
          title='No access to hostel reports'
          description='Ask the school admin for the hostel reports permission.'
        />
      </Page>
    )
  }

  const exportReport = async () => {
    if (!isExportable(report)) return
    setExporting(true)
    try {
      await downloadFile(
        reportExportPath(report),
        snapshot ? `hostel-${report}.xlsx` : `hostel-${report}-${from}-to-${to}.xlsx`,
        { ...(snapshot ? snapshotParams : rangeParams) }
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setExporting(false)
    }
  }

  const summary = snapshot
    ? report === 'fees'
      ? 'Academic year being viewed · dates do not apply'
      : 'Snapshot of right now · dates do not apply'
    : `${days} ${days === 1 ? 'day' : 'days'}`

  const tabs = HOSTEL_REPORTS.map((value) => ({
    value,
    label: REPORT_META[value].label,
    icon: REPORT_META[value].icon,
  }))

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Hostel reports'
        description='Occupancy, roll call, leave, visitors, fees, discipline, complaints, mess and health in one place.'
        actions={
          isExportable(report) ? (
            <Button variant='outline' loading={exporting} onClick={() => void exportReport()}>
              <FileSpreadsheet />
              Export to Excel
            </Button>
          ) : undefined
        }
      />
      <HostelTabs active='/hostel/reports' />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={summary}
          onClear={
            filtered ? () => void navigate({ search: { report }, replace: true }) : undefined
          }
        >
          <HostelSelect
            id='reports-hostel'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
          />
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <DatePicker
              id='reports-from'
              value={from}
              max={to}
              placeholder='From date'
              disabled={snapshot}
              clearable={Boolean(search.from)}
              className='sm:w-40'
              onChange={(value: string) => setSearch({ from: value || undefined })}
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <DatePicker
              id='reports-to'
              value={to}
              min={from}
              placeholder='To date'
              align='end'
              disabled={snapshot}
              clearable={Boolean(search.to)}
              className='sm:w-40'
              onChange={(value: string) => setSearch({ to: value || undefined })}
            />
          </div>
          {!snapshot && days > MAX_DAYS && (
            <Badge tone='danger'>Pick at most {MAX_DAYS} days</Badge>
          )}
        </ListToolbar>
      </Card>

      <div className='grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]'>
        <div className='min-w-0 lg:hidden'>
          <PageTabs
            label='Reports'
            tabs={tabs}
            value={report}
            onChange={(value) => setSearch({ report: value })}
          />
        </div>

        <nav aria-label='Reports' className='hidden lg:block'>
          <ul className='sticky top-20 grid gap-1'>
            {HOSTEL_REPORTS.map((value) => {
              const item = REPORT_META[value]
              const active = value === report
              return (
                <li key={value}>
                  <button
                    type='button'
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setSearch({ report: value })}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                      active ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        active ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='flex items-center gap-2 text-sm font-semibold'>
                        {item.label}
                        {isOff(value, enabled) && <Badge>Off</Badge>}
                      </span>
                      <span className='text-xs text-muted-foreground'>{item.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className='grid min-w-0 content-start gap-6'>
          <div className='grid gap-0.5'>
            <h2 className='flex items-center gap-2 text-lg font-bold'>
              <meta.icon className='size-5 text-primary' />
              {meta.label}
            </h2>
            <p className='text-sm text-muted-foreground'>{meta.description}</p>
          </div>
          {meta.module && isOff(report, enabled) ? (
            <ModuleOffState module={meta.module} />
          ) : (
            <ReportView
              report={report}
              rangeParams={rangeParams}
              snapshotParams={snapshotParams}
              onOpen={(value) => setSearch({ report: value })}
            />
          )}
        </section>
      </div>
    </Page>
  )
}

function ReportView({
  report,
  rangeParams,
  snapshotParams,
  onOpen,
}: {
  report: HostelReport
  rangeParams: ReportParams
  snapshotParams: ReportParams
  onOpen: (report: HostelReport) => void
}) {
  switch (report) {
    case 'summary':
      return <SummaryReportView params={rangeParams} onOpen={onOpen} />
    case 'occupancy':
      return <OccupancyReportView params={snapshotParams} />
    case 'attendance':
      return <AttendanceReportView params={rangeParams} />
    case 'leaves':
      return <LeavesReportView params={rangeParams} />
    case 'visitors':
      return <VisitorsReportView params={rangeParams} />
    case 'fees':
      return <FeesReportView params={snapshotParams} />
    case 'discipline':
      return <DisciplineReportView params={rangeParams} />
    case 'complaints':
      return <ComplaintsReportView params={rangeParams} />
    case 'mess':
      return <MessReportView params={rangeParams} />
    case 'health':
      return <HealthReportView params={rangeParams} />
  }
}
