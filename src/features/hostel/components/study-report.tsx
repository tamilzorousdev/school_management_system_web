import { Link } from '@tanstack/react-router'
import { BarChart3, CircleOff } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useStudyReport, type StudyReportRow } from '../api-duty'
import { studentLine } from '../labels'
import type { StudySearch } from '../search-life'
import { percentTone } from './duty-helpers'
import { shiftDate, todayIso } from './leave-helpers'

const LIMIT = 20

export function StudyReportTab({
  search,
  onChange,
  onPageChange,
}: {
  search: StudySearch
  onChange: (patch: Partial<StudySearch>) => void
  onPageChange: (page: number) => void
}) {
  const today = todayIso()
  const end = search.to ?? today
  const start = search.from ?? shiftDate(end, -29)
  const report = useStudyReport({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    hostel_id: search.hostel_id,
    from: start,
    to: end,
  })
  const filtered = Boolean(search.search || search.from || search.to)

  const columns: Column<StudyReportRow>[] = [
    {
      key: 'student',
      header: 'Student',
      sortKey: 'name',
      cell: (row) => <StudentLink row={row} />,
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.hostel_name}</span>,
    },
    {
      key: 'sessions',
      header: 'Sessions',
      sortKey: 'sessions',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.sessions}</span>,
    },
    {
      key: 'present',
      header: 'Present',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{row.present}</span>,
    },
    {
      key: 'late',
      header: 'Late',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{row.late}</span>,
    },
    {
      key: 'absent',
      header: 'Absent',
      sortKey: 'absent',
      align: 'right',
      cell: (row) => (
        <span className={row.absent ? 'tabular font-semibold text-destructive' : 'tabular'}>
          {row.absent}
        </span>
      ),
    },
    {
      key: 'excused',
      header: 'Excused',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{row.excused}</span>,
    },
    {
      key: 'percent',
      header: 'Attendance',
      sortKey: 'percent',
      align: 'right',
      cell: (row) => <PercentBadge row={row} />,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={report.data ? `${report.data.total} residents` : ''}
        onClear={
          filtered
            ? () => onChange({ search: undefined, from: undefined, to: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Search name or admission number'
          label='Search residents'
        />
        <DatePicker
          id='study-report-from'
          value={start}
          max={end}
          clearable={false}
          className='w-full sm:w-44'
          onChange={(value: string) => onChange({ from: value || undefined, to: end })}
        />
        <span className='text-xs text-muted-foreground'>to</span>
        <DatePicker
          id='study-report-to'
          value={end}
          min={start}
          max={today}
          clearable={false}
          className='w-full sm:w-44'
          onChange={(value: string) => onChange({ from: start, to: value || undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={report.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.admission_id}
        loading={report.isFetching}
        error={report.isError ? report.error.message : null}
        onRetry={() => report.refetch()}
        sort={{ sort: search.sort ?? 'name', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : BarChart3,
          title: filtered ? 'No residents match' : 'No residents',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Residents staying in the hostel appear here with their study attendance.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <StudentLink row={row} />
              <PercentBadge row={row} />
            </div>
            <span className='tabular text-xs text-muted-foreground'>
              {row.sessions} sessions · {row.present} present · {row.late} late · {row.absent}{' '}
              absent · {row.excused} excused
            </span>
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: report.data?.total ?? 0,
          label: 'residents',
          onPageChange,
        }}
      />
    </Card>
  )
}

function StudentLink({ row }: { row: StudyReportRow }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <Link
        to='/hostel/residents/$admissionId'
        params={{ admissionId: String(row.admission_id) }}
        search={{ tab: 'overview' }}
        className='truncate font-semibold hover:text-primary hover:underline'
      >
        {row.student.name}
      </Link>
      <span className='truncate text-xs text-muted-foreground'>{studentLine(row.student)}</span>
    </div>
  )
}

function PercentBadge({ row }: { row: StudyReportRow }) {
  if (!row.sessions) return <span className='text-xs text-muted-foreground'>No sessions</span>
  return <Badge tone={percentTone(row.percent)}>{row.percent}%</Badge>
}
