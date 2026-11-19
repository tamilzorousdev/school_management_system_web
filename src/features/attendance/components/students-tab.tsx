import { useMemo, useState } from 'react'
import {
  AlarmClockOff,
  CalendarCheck,
  Check,
  CheckCheck,
  FileBarChart,
  ClipboardX,
  Inbox,
  LayoutGrid,
  Medal,
  RotateCw,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { SegmentedControl } from '@/components/common/segmented-control'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBellSchedule } from '@/features/timetable/api'
import {
  ordinal,
  slotKey,
  slotText,
  useAttendanceBoard,
  type AttendanceSlot,
  type BoardSection,
} from '../api'
import { dayOffText, percentLabel, studentsText } from '../labels'
import { BulkActionBar } from './bulk-action-bar'
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const selectionKey = `${date}-${session}`
  if (selectedDate !== selectionKey) {
    setSelectedDate(selectionKey)
    setSelected(new Set())
    setPage(1)
  }

  const totalSections = rows.length
  const maxPage = Math.max(1, Math.ceil(totalSections / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  )

  const pageMarkable = paginatedRows.filter((row) => row.total > 0)
  const canBulk = canManage && Boolean(data?.working_day)
  const allSelected =
    pageMarkable.length > 0 && pageMarkable.every((row) => selected.has(row.section_id))
  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected((current) => {
      const next = new Set(current)
      if (allSelected) {
        pageMarkable.forEach((row) => next.delete(row.section_id))
      } else {
        pageMarkable.forEach((row) => next.add(row.section_id))
      }
      return next
    })
  const markedSelected = rows.filter((row) => selected.has(row.section_id) && row.marked).length

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
              <TableCheckbox
                ariaLabel='Select every section'
                checked={allSelected}
                onChange={toggleAll}
              />
            ),
            className: 'w-12 text-center',
            cell: (row: BoardSection) => (
              <TableCheckbox
                ariaLabel={`Select class ${row.name}`}
                disabled={row.total === 0}
                checked={selected.has(row.section_id)}
                onChange={() => toggle(row.section_id)}
              />
            ),
          },
        ]
      : []),
    {
      key: 'name',
      header: 'SECTION ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-semibold text-[13px] leading-[18px] text-slate-900 dark:text-slate-100'>
            Class {row.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.class_teacher ?? 'No class teacher'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (row) => (
        <div className='flex flex-col items-start gap-1'>
          {row.holiday ? (
            <StatusPill tone='info' label={`Holiday · ${row.holiday}`} />
          ) : row.total === 0 ? (
            <StatusPill tone='neutral' label='No students' />
          ) : row.missed ? (
            <StatusPill
              tone='danger'
              label='Missed'
              title={row.class_teacher ? `Missed by ${row.class_teacher}` : 'Missed'}
            />
          ) : (
            <StatusPill
              tone={row.marked ? 'success' : 'warning'}
              label={row.marked ? 'Active' : 'Not marked'}
            />
          )}
          <span className='flex items-center gap-2 text-[11px] leading-[14px] text-slate-400 dark:text-slate-500'>
            <span
              className={
                row.morning_marked
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : undefined
              }
            >
              {row.morning_marked ? '✓' : '○'} Morning
            </span>
            <span
              className={
                row.afternoon_marked
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : undefined
              }
            >
              {row.afternoon_marked ? '✓' : '○'} Afternoon
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'counts',
      header: 'PRESENT / ABSENT / LATE',
      cell: (row) =>
        row.marked ? (
          <span className='tabular-nums text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
            <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
              {row.present}
            </span>
            <span className='text-slate-300 dark:text-slate-600'> / </span>
            <span className='font-semibold text-rose-600 dark:text-rose-400'>{row.absent}</span>
            <span className='text-slate-300 dark:text-slate-600'> / </span>
            <span className='font-semibold text-amber-600 dark:text-amber-400'>{row.late}</span>
            <span className='text-xs text-slate-400'> of {row.total}</span>
            {Boolean(row.od) && (
              <span className='ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
                {row.od} OD
              </span>
            )}
          </span>
        ) : (
          <span className='tabular-nums text-[13px] leading-[18px] text-slate-500'>
            {studentsText(row.total)}
            {Boolean(row.od) && (
              <span className='ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
                {row.od} OD
              </span>
            )}
          </span>
        ),
    },
    {
      key: 'percent',
      header: 'ATTENDANCE',
      cell: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tracking-tight',
            row.percent === null
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : row.percent >= 85
                ? 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300'
                : row.percent >= 75
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
          )}
        >
          {percentLabel(row.percent)}
        </span>
      ),
    },
    {
      key: 'taken',
      header: 'TAKEN BY',
      hideBelow: 'lg',
      cell: (row) =>
        row.taken_by ? (
          <div className='grid min-w-0'>
            <span className='truncate font-medium text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
              {row.taken_by}
            </span>
            <span className='truncate text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
              {formatDateTime(row.taken_at)}
            </span>
          </div>
        ) : (
          <span className='text-slate-400'>—</span>
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
          <BulkActionBar
            count={selected.size}
            label={selected.size === 1 ? 'selected' : 'selected'}
            onClear={() => setSelected(new Set())}
            actions={[
              {
                label: 'Change status',
                icon: <RotateCw className='size-3.5' />,
                onClick: () => setBulk([...selected]),
              },
              {
                label: 'Class report',
                icon: <FileBarChart className='size-3.5' />,
                onClick: () => setClassReport(true),
              },
            ]}
            primaryAction={{
              label: 'Mark attendance',
              icon: <CheckCheck className='size-3.5' />,
              onClick: () => setBulk([...selected]),
              variant: 'primary',
            }}
          />
        )}
        <DataTable
          rows={paginatedRows}
          columns={columns}
          rowKey={(row) => row.section_id}
          loading={board.isFetching}
          error={board.isError ? board.error.message : null}
          onRetry={() => board.refetch()}
          onRowClick={(row) => onOpenSection(row.section_id)}
          pagination={{
            page: currentPage,
            limit: pageSize,
            total: totalSections,
            label: 'sections',
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setPageSize(newLimit)
              setPage(1)
            },
            limitOptions: [10, 20, 25, 50],
          }}
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
            <div className='grid gap-2 table-typography'>
              <div className='flex items-start justify-between gap-2.5'>
                {canBulk && (
                  <span className='pt-0.5'>
                    <TableCheckbox
                      ariaLabel={`Select class ${row.name}`}
                      disabled={row.total === 0}
                      checked={selected.has(row.section_id)}
                      onChange={() => toggle(row.section_id)}
                    />
                  </span>
                )}
                <span className='grid min-w-0 flex-1'>
                  <span className='font-semibold text-[13px] leading-[18px] text-slate-900 dark:text-slate-100'>
                    Class {row.name}
                  </span>
                  <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                    {row.class_teacher ?? 'No class teacher'}
                  </span>
                </span>
                <StatusPill
                  tone={
                    row.holiday
                      ? 'info'
                      : row.total === 0
                        ? 'neutral'
                        : row.missed
                          ? 'danger'
                          : row.marked
                            ? 'success'
                            : 'warning'
                  }
                  label={
                    row.holiday
                      ? 'Holiday'
                      : row.total === 0
                        ? 'No students'
                        : row.missed
                          ? 'Missed'
                          : row.marked
                            ? 'Active'
                            : 'Not marked'
                  }
                />
              </div>
              <div className='flex items-center justify-between text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                <span className='flex items-center gap-1.5'>
                  <UsersRound className='size-3.5 text-slate-400' />
                  {row.marked
                    ? `${row.present} present · ${row.absent} absent · ${row.late} late`
                    : studentsText(row.total)}
                </span>
                {row.percent !== null && (
                  <span className='inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'>
                    {percentLabel(row.percent)}
                  </span>
                )}
              </div>
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

export function TableCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean
  onChange?: () => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.()
      }}
      className={cn(
        'inline-flex size-4.5 items-center justify-center rounded-[4px] border transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        checked
          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
          : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {checked && <Check className='size-3 stroke-[3]' />}
    </button>
  )
}

export function StatusPill({
  tone,
  label,
  title,
}: {
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  label: string
  title?: string
}) {
  const styles = {
    success:
      'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50',
    warning:
      'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
    danger:
      'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]/70 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50',
    neutral:
      'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]/70 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50',
  }
  const dotStyles = {
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    neutral: 'bg-[#64748B]',
    info: 'bg-[#3B82F6]',
  }

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-[16px] transition-all select-none',
        styles[tone]
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', dotStyles[tone])} />
      <span>{label}</span>
    </span>
  )
}
