import { useState } from 'react'
import {
  CalendarCheck,
  CheckCheck,
  FileBarChart,
  ClipboardX,
  Inbox,
  LayoutGrid,
  UserRoundX,
  UsersRound,
  X,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { SegmentedControl } from '@/components/common/segmented-control'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import { useAttendanceBoard, type AttendanceSessionName, type BoardSection } from '../api'
import { dayOffText, percentLabel, percentTone, studentsText } from '../labels'
import { BulkSectionsModal } from './bulk-mark-modal'
import { ClassReportSheet } from './class-report-sheet'
import { DateStepper } from './date-stepper'
import { Notice } from './notice'
import { SectionSheet } from './section-sheet'

const SESSION_OPTIONS: { value: AttendanceSessionName; label: string }[] = [
  { value: 'morning', label: 'Morning · 1st period' },
  { value: 'afternoon', label: 'Afternoon · 5th period' },
]

export function StudentsTab({
  date,
  session,
  sectionId,
  canManage,
  onDateChange,
  onSessionChange,
  onOpenSection,
  onOpenLeave,
}: {
  date: string
  session: AttendanceSessionName
  sectionId?: number
  canManage: boolean
  onDateChange: (date: string) => void
  onSessionChange: (session: AttendanceSessionName) => void
  onOpenSection: (sectionId: number | undefined) => void
  onOpenLeave: () => void
}) {
  const board = useAttendanceBoard(date, session)
  const [classReport, setClassReport] = useState(false)
  const data = board.data
  const summary = data?.summary
  const rows = data?.sections ?? []
  const open = rows.find((row) => row.section_id === sectionId)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectedDate, setSelectedDate] = useState(`${date}-${session}`)
  const [bulk, setBulk] = useState<number[] | 'not_marked' | null>(null)
  const selectionKey = `${date}-${session}`
  if (selectedDate !== selectionKey) {
    setSelectedDate(selectionKey)
    setSelected(new Set())
  }
  const markable = rows.filter((row) => row.total > 0)
  const canBulk = canManage && Boolean(data?.working_day)
  const allSelected = markable.length > 0 && markable.every((row) => selected.has(row.section_id))
  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(markable.map((row) => row.section_id)))
  const markedSelected = rows.filter((row) => selected.has(row.section_id) && row.marked).length
  const checkbox = (row: BoardSection) => (
    <input
      type='checkbox'
      aria-label={`Select class ${row.name}`}
      className='size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40'
      disabled={row.total === 0}
      checked={selected.has(row.section_id)}
      onChange={() => toggle(row.section_id)}
      onClick={(event) => event.stopPropagation()}
    />
  )

  useShortcut('app.refresh', () => void board.refetch())

  const cards: Insight[] = [
    {
      key: 'present',
      label: 'Present',
      value: summary?.present ?? 0,
      hint: summary?.percent != null ? `${summary.percent}% attendance` : 'Nothing marked yet',
      icon: CalendarCheck,
      tone: 'success',
    },
    {
      key: 'absent',
      label: 'Absent',
      value: summary?.absent ?? 0,
      hint: `${summary?.late ?? 0} late · ${summary?.half_day ?? 0} half day`,
      icon: UserRoundX,
      tone: summary?.absent ? 'danger' : 'neutral',
    },
    {
      key: 'not-marked',
      label: 'Sections not marked',
      value: data?.sections_not_marked ?? 0,
      hint: `of ${data?.sections_total ?? 0} sections`,
      icon: ClipboardX,
      tone: data?.sections_not_marked ? 'warning' : 'success',
    },
    {
      key: 'leave',
      label: 'Leave requests waiting',
      value: data?.leave_pending ?? 0,
      hint: data?.below_75
        ? `${studentsText(data.below_75)} below 75% this month`
        : 'From parents in the app',
      icon: Inbox,
      tone: data?.leave_pending ? 'info' : 'neutral',
      onClick: onOpenLeave,
    },
  ]

  const columns: Column<BoardSection>[] = [
    ...(canBulk
      ? [
          {
            key: 'select',
            header: (
              <input
                type='checkbox'
                aria-label='Select every section'
                className='size-4 cursor-pointer accent-primary'
                checked={allSelected}
                onChange={toggleAll}
              />
            ),
            className: 'w-10',
            cell: checkbox,
          },
        ]
      : []),
    {
      key: 'name',
      header: 'Section',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-bold'>Class {row.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.class_teacher ?? 'No class teacher'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='grid gap-1'>
          <MarkedBadge row={row} />
          <SessionDots row={row} />
        </div>
      ),
    },
    {
      key: 'counts',
      header: 'Present / absent / late',
      cell: (row) =>
        row.marked ? (
          <span className='tabular text-sm'>
            <span className='font-semibold text-success'>{row.present}</span>
            {' / '}
            <span className='font-semibold text-destructive'>{row.absent}</span>
            {' / '}
            <span className='font-semibold text-warning'>{row.late}</span>
            <span className='text-muted-foreground'> of {row.total}</span>
          </span>
        ) : (
          <span className='tabular text-sm text-muted-foreground'>{studentsText(row.total)}</span>
        ),
    },
    {
      key: 'percent',
      header: 'Attendance',
      cell: (row) => <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>,
    },
    {
      key: 'taken',
      header: 'Taken by',
      hideBelow: 'lg',
      cell: (row) =>
        row.taken_by ? (
          <div className='grid'>
            <span className='text-sm'>{row.taken_by}</span>
            <span className='text-xs text-muted-foreground'>{formatDateTime(row.taken_at)}</span>
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <DateStepper id='attendance-date' value={date} onChange={onDateChange} />
        <div className='flex flex-wrap items-center gap-2'>
          <SegmentedControl
            label='Attendance session'
            value={session}
            onChange={onSessionChange}
            options={SESSION_OPTIONS}
          />
          <Button variant='outline' size='sm' onClick={() => setClassReport(true)}>
            <FileBarChart />
            Class report
          </Button>
        </div>
      </div>
      {data && !data.working_day && <Notice>{dayOffText(data.holiday)}</Notice>}
      <InsightCards items={cards} loading={board.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Sections</h2>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs text-muted-foreground'>
              Click a section to {canManage ? 'mark or view' : 'view'} attendance
            </span>
            {canBulk && Boolean(data?.sections_not_marked) && (
              <Button size='sm' variant='outline' onClick={() => setBulk('not_marked')}>
                <CheckCheck />
                Mark all sections not marked
              </Button>
            )}
          </div>
        </div>
        {canBulk && selected.size > 0 && (
          <div className='flex flex-wrap items-center justify-between gap-2 border-b bg-primary/5 px-4 py-2'>
            <span className='text-sm font-semibold'>
              {selected.size} {selected.size === 1 ? 'section' : 'sections'} selected
            </span>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' variant='ghost' onClick={() => setSelected(new Set())}>
                <X />
                Clear
              </Button>
              <Button size='sm' onClick={() => setBulk([...selected])}>
                <CheckCheck />
                Mark selected
              </Button>
            </div>
          </div>
        )}
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.section_id}
          loading={board.isFetching}
          error={board.isError ? board.error.message : null}
          onRetry={() => board.refetch()}
          onRowClick={(row) => onOpenSection(row.section_id)}
          empty={{
            icon: LayoutGrid,
            title: 'No sections this year',
            description: 'Add classes and sections in School setup first.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                {canBulk && <span className='pt-1'>{checkbox(row)}</span>}
                <span className='grid min-w-0 flex-1'>
                  <span className='font-bold'>Class {row.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {row.class_teacher ?? 'No class teacher'}
                  </span>
                </span>
                <MarkedBadge row={row} />
              </div>
              <span className='flex items-center gap-2 text-xs text-muted-foreground'>
                <UsersRound className='size-3' />
                {row.marked
                  ? `${row.present} present · ${row.absent} absent · ${row.late} late`
                  : studentsText(row.total)}
                {row.percent !== null && (
                  <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>
                )}
              </span>
            </div>
          )}
        />
      </Card>
      <SectionSheet
        sectionId={sectionId ?? null}
        sectionName={open?.name ?? ''}
        date={date}
        session={session}
        canManage={canManage}
        onClose={() => onOpenSection(undefined)}
      />
      {bulk && (
        <BulkSectionsModal
          date={date}
          session={session}
          sectionIds={bulk}
          markedCount={bulk === 'not_marked' ? 0 : markedSelected}
          onClose={() => setBulk(null)}
          onDone={() => {
            setBulk(null)
            setSelected(new Set())
          }}
        />
      )}
      <ClassReportSheet open={classReport} onClose={() => setClassReport(false)} />
    </div>
  )
}

function SessionDots({ row }: { row: BoardSection }) {
  return (
    <span className='flex gap-2 text-[11px] text-muted-foreground'>
      <span className={row.morning_marked ? 'text-success' : undefined}>
        {row.morning_marked ? '✓' : '○'} Morning
      </span>
      <span className={row.afternoon_marked ? 'text-success' : undefined}>
        {row.afternoon_marked ? '✓' : '○'} Afternoon
      </span>
    </span>
  )
}

function MarkedBadge({ row }: { row: BoardSection }) {
  if (row.total === 0) return <Badge tone='neutral'>No students</Badge>
  return (
    <Badge tone={row.marked ? 'success' : 'warning'} dot>
      {row.marked ? 'Marked' : 'Not marked'}
    </Badge>
  )
}
