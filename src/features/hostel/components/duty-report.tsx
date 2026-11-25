import { BarChart3 } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useDutyReport, type DutyReportRow } from '../api-duty'
import { percentTone } from './duty-helpers'
import { shiftDate, todayIso } from './leave-helpers'

const attendance = (row: DutyReportRow) =>
  row.scheduled ? Math.round((row.attended / row.scheduled) * 1000) / 10 : 0

export function DutyReportTab({
  hostelId,
  from,
  to,
  onRangeChange,
}: {
  hostelId?: number
  from?: string
  to?: string
  onRangeChange: (range: { from?: string; to?: string }) => void
}) {
  const today = todayIso()
  const end = to ?? today
  const start = from ?? shiftDate(end, -29)
  const report = useDutyReport({ hostel_id: hostelId, from: start, to: end })
  const rows = report.data ?? []

  const columns: Column<DutyReportRow>[] = [
    {
      key: 'name',
      header: 'Staff',
      cell: (row) => <span className='font-semibold'>{row.user_name}</span>,
    },
    {
      key: 'scheduled',
      header: 'Duties',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.scheduled}</span>,
    },
    {
      key: 'attended',
      header: 'Attended',
      align: 'right',
      cell: (row) => (
        <span className='tabular'>
          {row.attended}
          <Badge tone={percentTone(attendance(row))} className='ml-2'>
            {attendance(row)}%
          </Badge>
        </span>
      ),
    },
    {
      key: 'late',
      header: 'Late',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.late}</span>,
    },
    {
      key: 'absent',
      header: 'Absent',
      align: 'right',
      cell: (row) => (
        <span className={row.absent ? 'tabular font-semibold text-destructive' : 'tabular'}>
          {row.absent}
        </span>
      ),
    },
    {
      key: 'average',
      header: 'Avg. late',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular text-muted-foreground'>
          {row.late ? `${row.average_late_minutes} min` : '—'}
        </span>
      ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={report.data ? `${rows.length} staff` : ''}
        onClear={from || to ? () => onRangeChange({ from: undefined, to: undefined }) : undefined}
      >
        <DatePicker
          id='duty-report-from'
          value={start}
          max={end}
          clearable={false}
          className='w-full sm:w-44'
          onChange={(value: string) => onRangeChange({ from: value || undefined, to: end })}
        />
        <span className='text-xs text-muted-foreground'>to</span>
        <DatePicker
          id='duty-report-to'
          value={end}
          min={start}
          max={today}
          clearable={false}
          className='w-full sm:w-44'
          onChange={(value: string) => onRangeChange({ from: start, to: value || undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.user_id}
        loading={report.isFetching}
        error={report.isError ? report.error.message : null}
        onRetry={() => report.refetch()}
        empty={{
          icon: BarChart3,
          title: 'No duties in this period',
          description: 'Pick another date range or put staff on the roster.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold'>{row.user_name}</span>
              <Badge tone={percentTone(attendance(row))}>{attendance(row)}% attended</Badge>
            </div>
            <span className='tabular text-xs text-muted-foreground'>
              {row.scheduled} duties · {row.attended} attended · {row.late} late
              {row.late ? ` (avg ${row.average_late_minutes} min)` : ''} · {row.absent} absent
            </span>
          </div>
        )}
      />
    </Card>
  )
}
