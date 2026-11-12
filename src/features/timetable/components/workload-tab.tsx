import { AlertTriangle, CalendarClock, Gauge, ListTodo, UsersRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LoadBar } from '@/features/staff/components/load-bar'
import { useWorkload, type WorkloadRow } from '../api'
import { DAYS } from '../labels'

export function WorkloadTab({ onOpenTeacher }: { onOpenTeacher: (teacherId: number) => void }) {
  const workload = useWorkload()
  const data = workload.data

  useShortcut('app.refresh', () => void workload.refetch())

  const cards: Insight[] = [
    {
      key: 'week',
      label: 'Periods in a week',
      value: data?.periods_in_week ?? 0,
      hint: 'Teaching periods a week, Monday to Saturday',
      icon: CalendarClock,
      tone: 'primary',
    },
    {
      key: 'average',
      label: 'Average a week',
      value: data?.average_scheduled ?? 0,
      hint: 'Periods a week per teacher in the timetable',
      icon: Gauge,
      tone: 'info',
    },
    {
      key: 'overloaded',
      label: 'Overloaded',
      value: data?.overloaded ?? 0,
      hint: data?.overloaded ? 'Above their weekly limit' : 'Everyone is within limit',
      icon: AlertTriangle,
      tone: data?.overloaded ? 'danger' : 'success',
    },
    {
      key: 'unscheduled',
      label: 'Unscheduled',
      value: data?.unscheduled ?? 0,
      hint: 'Subject periods a week still to place',
      icon: ListTodo,
      tone: data?.unscheduled ? 'warning' : 'success',
    },
  ]

  const status = (row: WorkloadRow) =>
    row.overloaded ? (
      <Badge tone='danger'>Overloaded</Badge>
    ) : (
      <Badge tone='success'>Within limit</Badge>
    )

  const columns: Column<WorkloadRow>[] = [
    {
      key: 'teacher',
      header: 'Teacher',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.teacher.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{row.department ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'load',
      header: 'Periods a week',
      cell: (row) => (
        <LoadBar load={row.scheduled} max={row.max_periods_per_week} className='max-w-44' />
      ),
    },
    ...DAYS.map((day, index) => ({
      key: `day-${day.value}`,
      header: day.short,
      align: 'right' as const,
      hideBelow: 'lg' as const,
      cell: (row: WorkloadRow) => (
        <span
          className={row.by_day[index] ? 'tabular font-semibold' : 'tabular text-muted-foreground'}
        >
          {row.by_day[index] ?? 0}
        </span>
      ),
    })),
    { key: 'status', header: 'Status', cell: status },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={workload.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Teacher workload</h2>
          <span className='text-xs text-muted-foreground'>
            Periods in the timetable each week against each teacher's weekly limit. Click a teacher
            to see their week.
          </span>
        </div>
        <DataTable
          rows={data?.teachers ?? []}
          columns={columns}
          rowKey={(row) => row.teacher.id}
          loading={workload.isFetching}
          error={workload.isError ? workload.error.message : null}
          onRetry={() => workload.refetch()}
          onRowClick={(row) => onOpenTeacher(row.teacher.id)}
          empty={{
            icon: UsersRound,
            title: 'No teachers yet',
            description: 'Add teaching staff and build timetables to see their workload.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-bold'>{row.teacher.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {row.department ?? '—'}
                  </span>
                </span>
                {status(row)}
              </div>
              <LoadBar load={row.scheduled} max={row.max_periods_per_week} />
              <span className='tabular text-xs text-muted-foreground'>
                {DAYS.map((day, index) => `${day.short} ${row.by_day[index] ?? 0}`).join(' · ')}
              </span>
            </div>
          )}
        />
      </Card>
    </div>
  )
}
