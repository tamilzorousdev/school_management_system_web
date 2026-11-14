import { useState } from 'react'
import {
  AlarmClockOff,
  CalendarCheck,
  CheckCheck,
  FileBarChart,
  ClipboardX,
  Inbox,
  LayoutGrid,
  Medal,
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
import { formatDate, formatDateTime } from '@/lib/format'
import { useBellSchedule } from '@/features/timetable/api'
import {
  ordinal,
  slotKey,
  slotText,
  useAttendanceBoard,
  type AttendanceSlot,
  type BoardSection,
} from '../api'
import { dayOffText, percentLabel, percentTone, studentsText } from '../labels'
import { BulkSectionsModal } from './bulk-mark-modal'
import { ClassReportSheet } from './class-report-sheet'
import { DateStepper } from './date-stepper'
import { MissedReportSheet } from './missed-report-sheet'
import { Notice } from './notice'
import { OnDutyModal } from './on-duty-modal'
import { SectionSheet } from './section-sheet'

type BoardFilter = 'all' | 'not_marked' | 'missed'

const FILTER_OPTIONS: { value: BoardFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_marked', label: 'Not marked' },
  { value: 'missed', label: 'Missed' },
]

const SESSION_OPTIONS = [
  { value: 'morning', label: 'Morning · 1st period' },
  { value: 'afternoon', label: 'Afternoon · 5th period' },
]

const halfOf = (period: number) => (period < 5 ? 'morning' : 'afternoon')

export function StudentsTab({
  date,
  slot,
  sectionId,
  canManage,
  onDateChange,
  onSlotChange,
  onOpenSection,
}: {
  date: string
  slot: AttendanceSlot
  sectionId?: number
  canManage: boolean
  onDateChange: (date: string) => void
  onSlotChange: (slot: AttendanceSlot) => void
  onOpenSection: (sectionId: number | undefined) => void
}) {
  const board = useAttendanceBoard(date, slot)
  const bells = useBellSchedule()
  const periodMode = board.data?.mode === 'period'
  const activeSlot: AttendanceSlot =
    periodMode && board.data ? { session: board.data.session, period: board.data.period } : slot
  const session = slotKey(activeSlot)
  const slotOptions = periodMode
    ? (bells.data ?? [])
        .filter((period) => !period.is_break && period.period_no && !period.class_id)
        .map((period) => ({
          value: `p${period.period_no}`,
          label: `${ordinal(period.period_no!)} · ${period.start_time}`,
        }))
    : SESSION_OPTIONS
  const [classReport, setClassReport] = useState(false)
  const [missedReport, setMissedReport] = useState(false)
  const [onDutyOpen, setOnDutyOpen] = useState(false)
  const [filter, setFilter] = useState<BoardFilter>('all')
  const data = board.data
  const summary = data?.summary
  const onDuty = data?.on_duty ?? []
  const odEvents = [...new Set(onDuty.map((student) => student.title))]
  const allRows = data?.sections ?? []
  const rows = allRows.filter((row) =>
    filter === 'missed'
      ? row.missed
      : filter === 'not_marked'
        ? !row.marked && !row.holiday && row.total > 0
        : true
  )
  const open = allRows.find((row) => row.section_id === sectionId)
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
      key: 'missed',
      label: 'Missed by teachers',
      value: data?.sections_missed ?? 0,
      hint: `${data?.sections_not_marked ?? 0} of ${data?.sections_total ?? 0} not marked${
        data?.closes_at ? ` · open till ${data.closes_at}` : ''
      }`,
      icon: data?.sections_missed ? AlarmClockOff : ClipboardX,
      tone: data?.sections_missed ? 'danger' : data?.sections_not_marked ? 'warning' : 'success',
      active: filter === 'missed',
      onClick: () => setFilter(filter === 'missed' ? 'all' : 'missed'),
    },
    {
      key: 'od',
      label: 'On Duty (OD)',
      value: onDuty.length,
      hint: odEvents.length
        ? `${odEvents.length === 1 ? odEvents[0] : `${odEvents.length} events`} · counted present`
        : 'No Sports OD today',
      icon: Medal,
      tone: onDuty.length ? 'success' : 'neutral',
      onClick: () => setOnDutyOpen(true),
    },
    {
      key: 'leave',
      label: 'Student leave waiting',
      value: data?.leave_pending ?? 0,
      hint: data?.below_75
        ? `${studentsText(data.below_75)} below 75% this month`
        : 'Class teachers approve these in the Staff app',
      icon: Inbox,
      tone: data?.leave_pending ? 'info' : 'neutral',
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
      cell: (row) =>
        row.holiday ? (
          <Badge tone='info' className='max-w-48 truncate'>
            Holiday · {row.holiday}
          </Badge>
        ) : (
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
            {Boolean(row.od) && <OdTag count={row.od!} />}
          </span>
        ) : (
          <span className='tabular text-sm text-muted-foreground'>
            {studentsText(row.total)}
            {Boolean(row.od) && <OdTag count={row.od!} />}
          </span>
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
            label={periodMode ? 'Attendance period' : 'Attendance session'}
            value={session}
            onChange={(value: string) =>
              onSlotChange(
                value.startsWith('p')
                  ? { session: halfOf(Number(value.slice(1))), period: Number(value.slice(1)) }
                  : { session: value === 'afternoon' ? 'afternoon' : 'morning' }
              )
            }
            options={slotOptions}
          />
          <Button variant='outline' size='sm' onClick={() => setClassReport(true)}>
            <FileBarChart />
            Class report
          </Button>
          <Button variant='outline' size='sm' onClick={() => setMissedReport(true)}>
            <AlarmClockOff />
            Missed report
          </Button>
        </div>
      </div>
      {data && !data.working_day && <Notice>{dayOffText(data.holiday)}</Notice>}
      <InsightCards items={cards} loading={board.isPending} />
      <OnDutyModal
        open={onDutyOpen}
        students={onDuty}
        dateText={`${formatDate(date)} · ${periodMode ? ordinal(activeSlot.period ?? 1) + ' period' : activeSlot.session === 'afternoon' ? 'Afternoon' : 'Morning'}`}
        onClose={() => setOnDutyOpen(false)}
        onOpenSection={(id) => {
          setOnDutyOpen(false)
          onOpenSection(id)
        }}
      />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='font-bold'>Sections</h2>
            <SegmentedControl
              label='Show sections'
              value={filter}
              onChange={setFilter}
              options={FILTER_OPTIONS}
            />
          </div>
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
          empty={
            filter === 'all'
              ? {
                  icon: LayoutGrid,
                  title: 'No sections this year',
                  description: 'Add classes and sections in School setup first.',
                }
              : {
                  icon: CheckCheck,
                  title: filter === 'missed' ? 'Nothing missed' : 'Every section is marked',
                  description:
                    filter === 'missed'
                      ? 'No section has missed this session.'
                      : 'All sections with students are marked for this session.',
                }
          }
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
        slot={activeSlot}
        slotLabel={slotText(board.data?.mode, activeSlot)}
        canManage={canManage}
        onClose={() => onOpenSection(undefined)}
      />
      {bulk && (
        <BulkSectionsModal
          date={date}
          slot={activeSlot}
          slotLabel={slotText(board.data?.mode, activeSlot)}
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
      <MissedReportSheet open={missedReport} onClose={() => setMissedReport(false)} />
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
  if (row.missed) {
    return (
      <Badge
        tone='danger'
        dot
        title={row.class_teacher ? `Missed by ${row.class_teacher}` : 'Missed'}
      >
        Missed
      </Badge>
    )
  }
  return (
    <Badge tone={row.marked ? 'success' : 'warning'} dot>
      {row.marked ? 'Marked' : 'Not marked'}
    </Badge>
  )
}

function OdTag({ count }: { count: number }) {
  return (
    <Badge tone='success' className='ml-1.5 px-1.5 py-0 text-[10px]'>
      {count} OD
    </Badge>
  )
}
