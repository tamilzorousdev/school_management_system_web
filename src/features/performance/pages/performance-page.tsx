import { useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  ChartColumnBig,
  ChevronRight,
  CircleX,
  ClipboardCheck,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  TrendingDown,
  UsersRound,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusPill, TableCheckbox } from '@/features/attendance/components/students-tab'
import { can, useMe } from '@/features/auth/api'
import { useExamOptions } from '@/features/exams/api'
import { useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  performanceApi,
  useBelowAverage,
  useClassPerformance,
  usePerformanceMutation,
  useSpecialClasses,
  type BandFilter,
  type BelowAverageStudent,
  type SectionPerformance,
  type SpecialClass,
} from '../api'
import { SpecialAttendanceModal } from '../components/special-attendance-modal'
import { SpecialClassModal } from '../components/special-class-modal'
import { SpecialSettingsModal } from '../components/special-settings-modal'
import type { PerformanceSearch, PerformanceTab } from '../search'

const route = getRouteApi('/_app/class-performance')

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : formatNumber(value, 1, '%')

function PercentPill({
  value,
  good,
  fair,
  invert = false,
}: {
  value: number | null | undefined
  good: number
  fair: number
  invert?: boolean
}) {
  const pillClass =
    value === null || value === undefined
      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      : invert
        ? value <= good
          ? 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300'
          : value <= fair
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
        : value >= good
          ? 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300'
          : value >= fair
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tracking-tight tabular-nums',
        pillClass
      )}
    >
      {pct(value)}
    </span>
  )
}

export function PerformancePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/class-performance' })
  const me = useMe().data
  const canManage = can(me, 'timetable.manage')
  const setSearch = (patch: Partial<PerformanceSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  const report = useClassPerformance(search.exam_id, search.class_id)
  const exams = useExamOptions()
  const classes = useClasses()
  const published = (exams.data?.items ?? []).filter((exam) => exam.status === 'published')
  const examFilter = (
    <FilterSelect
      id='performance-exam'
      label='Exam'
      allLabel='All published exams'
      value={search.exam_id ? String(search.exam_id) : undefined}
      options={published.map((exam) => ({ value: String(exam.id), label: exam.name }))}
      onChange={(value) => setSearch({ exam_id: value ? Number(value) : undefined })}
    />
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Class performance'
        description='Average, pass, fail and attendance for every class, the students below average, and special classes to help them.'
      />
      <PageTabs
        label='Class performance views'
        value={search.tab}
        onChange={(tab: PerformanceTab) => setSearch({ tab })}
        tabs={[
          { value: 'classes', label: 'Class report', icon: ChartColumnBig },
          { value: 'below', label: 'Below average', icon: TrendingDown },
          { value: 'special', label: 'Special classes', icon: CalendarClock },
        ]}
      />
      {search.tab === 'classes' && (
        <ClassReport
          filters={
            <>
              {examFilter}
              <FilterSelect
                id='performance-class'
                label='Class'
                allLabel='All classes'
                value={search.class_id ? String(search.class_id) : undefined}
                options={(classes.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: `Class ${item.name}`,
                }))}
                onChange={(value) => setSearch({ class_id: value ? Number(value) : undefined })}
              />
            </>
          }
          report={report}
          onOpenSection={(sectionId) => setSearch({ tab: 'below', section_id: sectionId })}
        />
      )}
      {search.tab === 'below' && (
        <BelowAverageView
          sections={report.data?.sections ?? []}
          sectionId={search.section_id}
          examId={search.exam_id}
          filter={{ band: search.band, below: search.below, from: search.from, to: search.to }}
          examFilter={examFilter}
          canManage={canManage}
          onSection={(sectionId) => setSearch({ section_id: sectionId })}
          onFilter={(next) =>
            setSearch({
              band: undefined,
              below: undefined,
              from: undefined,
              to: undefined,
              ...next,
            })
          }
          onScheduled={() => setSearch({ tab: 'special' })}
        />
      )}
      {search.tab === 'special' && (
        <SpecialClassesView
          sections={report.data?.sections ?? []}
          sectionId={search.section_id}
          canManage={canManage}
          onSection={(sectionId) => setSearch({ section_id: sectionId })}
        />
      )}
    </Page>
  )
}

function ClassReport({
  filters,
  report,
  onOpenSection,
}: {
  filters: React.ReactNode
  report: ReturnType<typeof useClassPerformance>
  onOpenSection: (sectionId: number) => void
}) {
  const data = report.data
  const totals = data?.totals
  const [sectionFilter, setSectionFilter] = useState<'all' | 'has_below'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const allSections = data?.sections ?? []
  const filteredSections =
    sectionFilter === 'has_below'
      ? allSections.filter((row) => row.below_average > 0)
      : allSections
  const totalSections = filteredSections.length
  const maxPage = Math.max(1, Math.ceil(totalSections / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => filteredSections.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredSections, currentPage, pageSize]
  )

  const cards: Insight[] = [
    {
      key: 'average',
      label: 'Average result',
      value: pct(totals?.average_percent),
      hint: `${formatNumber(totals?.assessed ?? 0)} of ${formatNumber(totals?.students ?? 0)} assessed`,
      icon: BookOpenCheck,
      tone: 'primary',
    },
    {
      key: 'pass',
      label: 'Pass rate',
      value: pct(totals?.pass_percent),
      hint: 'Every subject passed',
      icon: ChartColumnBig,
      tone: 'success',
    },
    {
      key: 'fail',
      label: 'Fail rate',
      value: pct(totals?.fail_percent),
      hint: 'A subject failed',
      icon: CircleX,
      tone: totals?.fail_percent ? 'danger' : 'success',
    },
    {
      key: 'attendance',
      label: 'Attendance',
      value: pct(totals?.attendance_percent),
      hint: 'This year',
      icon: CalendarCheck,
      tone: 'info',
    },
  ]
  const columns: Column<SectionPerformance>[] = [
    {
      key: 'section',
      header: 'SECTION ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.class_teacher ?? 'No class teacher'}
          </span>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'STUDENTS',
      align: 'right',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {formatNumber(row.students)}
        </span>
      ),
    },
    {
      key: 'average',
      header: 'AVERAGE',
      align: 'right',
      cell: (row) => <PercentPill value={row.average_percent} good={75} fair={50} />,
    },
    {
      key: 'pass',
      header: 'PASS %',
      align: 'right',
      cell: (row) => <PercentPill value={row.pass_percent} good={90} fair={70} />,
    },
    {
      key: 'fail',
      header: 'FAIL %',
      align: 'right',
      cell: (row) => <PercentPill value={row.fail_percent} good={0} fair={15} invert />,
    },
    {
      key: 'attendance',
      header: 'ATTENDANCE',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <PercentPill value={row.attendance_percent} good={85} fair={75} />,
    },
    {
      key: 'below',
      header: 'BELOW AVERAGE',
      align: 'right',
      cell: (row) =>
        row.below_average ? (
          <StatusPill
            tone='warning'
            label={`${row.below_average} ${row.below_average === 1 ? 'student' : 'students'}`}
          />
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'action',
      header: 'ACTION',
      align: 'right' as const,
      cell: (row) => (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`View students below average in ${row.name}`}
          title='View below average'
          className='text-slate-500 hover:bg-[#EAF7F0] hover:text-[#127D48] dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400'
          onClick={(event) => {
            event.stopPropagation()
            onOpenSection(row.section_id)
          }}
        >
          <ChevronRight className='size-4' />
        </Button>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <ListToolbar>{filters}</ListToolbar>
      <InsightCards items={cards} loading={report.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='font-bold'>
              Sections
              {data
                ? ` · ${data.exam?.name ?? 'All published exams'} · ${data.academic_year.name}`
                : ''}
            </h2>
            <SegmentedControl
              label='Filter sections'
              value={sectionFilter}
              onChange={(value: 'all' | 'has_below') => {
                setSectionFilter(value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'has_below', label: 'Below average' },
              ]}
            />
          </div>
          <span className='text-xs text-muted-foreground'>
            Click a section to see its students below average
          </span>
        </div>
        <DataTable
          rows={paginatedRows}
          columns={columns}
          rowKey={(row) => row.section_id}
          loading={report.isFetching}
          error={report.isError ? report.error.message : null}
          onRetry={() => report.refetch()}
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
          empty={{
            icon: ChartColumnBig,
            title: sectionFilter === 'has_below' ? 'No sections below average' : 'No classes yet',
            description:
              sectionFilter === 'has_below'
                ? 'Every section has no students below average.'
                : 'Add classes and sections in School setup, then publish exam results.',
          }}
          card={(row) => (
            <div className='table-typography grid gap-2'>
              <div className='flex items-start justify-between gap-2.5'>
                <div className='grid min-w-0 flex-1'>
                  <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                    {row.name}
                  </span>
                  <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                    {row.class_teacher ?? 'No class teacher'}
                  </span>
                </div>
                <PercentPill value={row.average_percent} good={75} fair={50} />
              </div>
              <div className='flex items-center justify-between text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                <span>
                  Pass {pct(row.pass_percent)} · Fail {pct(row.fail_percent)} · Attendance{' '}
                  {pct(row.attendance_percent)}
                </span>
                {row.below_average > 0 && (
                  <StatusPill tone='warning' label={`${row.below_average} below`} />
                )}
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  )
}

function BelowAverageView({
  sections,
  sectionId,
  examId,
  filter,
  examFilter,
  canManage,
  onSection,
  onFilter,
  onScheduled,
}: {
  sections: SectionPerformance[]
  sectionId?: number
  examId?: number
  filter: BandFilter
  examFilter: React.ReactNode
  canManage: boolean
  onSection: (sectionId: number | undefined) => void
  onFilter: (filter: BandFilter) => void
  onScheduled: () => void
}) {
  const band = filter.band ?? 'below'
  const list = useBelowAverage(sectionId, examId, filter)
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const key = `${sectionId}-${examId}-${JSON.stringify(filter)}`
  const [chosenFor, setChosenFor] = useState(key)
  const [line, setLine] = useState(filter.below ? String(filter.below) : '')
  const [from, setFrom] = useState(filter.from !== undefined ? String(filter.from) : '35')
  const [to, setTo] = useState(filter.to !== undefined ? String(filter.to) : '60')
  const [scheduling, setScheduling] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const percentOf = (text: string) => {
    const value = Number(text)
    return text.trim() && value >= 0 && value <= 100 ? value : undefined
  }
  if (chosenFor !== key) {
    setChosenFor(key)
    setChosen(new Set())
    setPage(1)
  }
  const data = list.data
  const section = sections.find((item) => item.section_id === sectionId)
  const rows = useMemo(() => data?.students ?? [], [data?.students])
  const totalStudents = rows.length
  const maxPage = Math.max(1, Math.ceil(totalStudents / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  )
  const allChosen =
    paginatedRows.length > 0 && paginatedRows.every((row) => chosen.has(row.student_id))
  const isIndeterminate =
    !allChosen && paginatedRows.some((row) => chosen.has(row.student_id))

  const toggleStudent = (studentId: number) =>
    setChosen((current) => {
      const next = new Set(current)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })

  const togglePage = () =>
    setChosen((current) => {
      const next = new Set(current)
      if (allChosen) {
        paginatedRows.forEach((row) => next.delete(row.student_id))
      } else {
        paginatedRows.forEach((row) => next.add(row.student_id))
      }
      return next
    })

  const columns: Column<BelowAverageStudent>[] = [
    {
      key: 'pick',
      header: (
        <TableCheckbox
          ariaLabel='Choose every student on this page'
          checked={allChosen}
          indeterminate={isIndeterminate}
          onChange={togglePage}
        />
      ),
      className: 'w-12 text-center',
      cell: (row) => (
        <TableCheckbox
          ariaLabel={`Choose ${row.full_name}`}
          checked={chosen.has(row.student_id)}
          onChange={() => toggleStudent(row.student_id)}
        />
      ),
    },
    {
      key: 'student',
      header: 'STUDENT ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.full_name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.roll_no ? `Roll ${row.roll_no}` : 'No roll number'}
            {row.special_classes.length
              ? ` · In ${row.special_classes.map((item) => item.title).join(', ')}`
              : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'percent',
      header: 'RESULT',
      align: 'right',
      cell: (row) => (
        <div className='grid justify-items-end gap-0.5'>
          <PercentPill value={row.percent} good={75} fair={50} />
          <span className='text-[11.5px] leading-[16px] text-slate-400 tabular-nums dark:text-slate-500'>
            {formatNumber(row.gap, 1)} below
          </span>
        </div>
      ),
    },
    {
      key: 'weak',
      header: 'WEAK SUBJECTS',
      hideBelow: 'lg',
      cell: (row) =>
        row.weak_subjects.length ? (
          <div className='flex flex-wrap gap-1'>
            {row.weak_subjects.map((subject) => (
              <Badge key={subject.subject_id} tone='warning'>
                {subject.name} {pct(subject.percent)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'attendance',
      header: 'ATTENDANCE',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <PercentPill value={row.attendance_percent} good={85} fair={75} />,
    },
  ]

  return (
    <div className='grid gap-4'>
      <ListToolbar>
        <FilterSelect
          id='below-section'
          label='Class'
          allLabel='Choose a class'
          value={sectionId ? String(sectionId) : undefined}
          options={sections.map((item) => ({
            value: String(item.section_id),
            label: item.name,
            hint: item.below_average ? `${item.below_average} below` : undefined,
          }))}
          onChange={(value) => onSection(value ? Number(value) : undefined)}
        />
        {examFilter}
        <SegmentedControl
          label='Which students'
          value={band}
          onChange={(value: string) =>
            onFilter(
              value === 'range'
                ? { band: 'range', from: percentOf(from) ?? 0, to: percentOf(to) ?? 100 }
                : value === 'average'
                  ? { band: 'average' }
                  : {}
            )
          }
          options={[
            { value: 'below', label: 'Below average' },
            { value: 'average', label: 'Average' },
            { value: 'range', label: 'Range' },
          ]}
        />
        {band !== 'average' && (
          <form
            className='flex items-center gap-2'
            onSubmit={(event) => {
              event.preventDefault()
              onFilter(
                band === 'range'
                  ? { band: 'range', from: percentOf(from) ?? 0, to: percentOf(to) ?? 100 }
                  : { below: percentOf(line) || undefined }
              )
            }}
          >
            {band === 'range' ? (
              <>
                <Input
                  aria-label='From %'
                  inputMode='decimal'
                  className='h-9 w-20'
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
                <span className='text-sm text-muted-foreground'>to</span>
                <Input
                  aria-label='To %'
                  inputMode='decimal'
                  className='h-9 w-20'
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </>
            ) : (
              <Input
                aria-label='Show students below this %'
                inputMode='decimal'
                className='h-9 w-36'
                placeholder='Below class avg'
                value={line}
                onChange={(event) => setLine(event.target.value)}
              />
            )}
            <Button type='submit' variant='outline' size='sm'>
              Apply
            </Button>
          </form>
        )}
      </ListToolbar>
      {!sectionId ? (
        <Card className='p-6 text-center text-sm text-muted-foreground'>
          Choose a class to see the students below its average.
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
            <div className='grid'>
              <h2 className='font-bold'>{data?.section.name ?? section?.name ?? 'Class'}</h2>
              <span className='text-xs text-muted-foreground'>
                Class average {pct(data?.section_average)}
                {data
                  ? data.band === 'below'
                    ? data.line !== data.section_average
                      ? ` · showing below ${pct(data.line)}`
                      : ''
                    : ` · showing ${pct(data.from)} to ${pct(data.to)}`
                  : ''}
              </span>
            </div>
            {canManage && (
              <Button size='sm' disabled={!chosen.size} onClick={() => setScheduling(true)}>
                <CalendarClock />
                Schedule extra class{chosen.size ? ` (${chosen.size})` : ''}
              </Button>
            )}
          </div>
          <DataTable
            rows={paginatedRows}
            columns={columns}
            rowKey={(row) => row.student_id}
            loading={list.isFetching}
            error={list.isError ? list.error.message : null}
            onRetry={() => list.refetch()}
            pagination={{
              page: currentPage,
              limit: pageSize,
              total: totalStudents,
              label: 'students',
              onPageChange: (newPage) => setPage(newPage),
              onLimitChange: (newLimit) => {
                setPageSize(newLimit)
                setPage(1)
              },
              limitOptions: [10, 20, 25, 50],
            }}
            empty={{
              icon: UsersRound,
              title: 'No student in this group',
              description:
                'Every assessed student is at or above it, or no results are published yet.',
            }}
            card={(row) => (
              <div className='table-typography grid gap-2'>
                <div className='flex items-start justify-between gap-2.5'>
                  <span className='pt-0.5'>
                    <TableCheckbox
                      ariaLabel={`Choose ${row.full_name}`}
                      checked={chosen.has(row.student_id)}
                      onChange={() => toggleStudent(row.student_id)}
                    />
                  </span>
                  <div className='grid min-w-0 flex-1'>
                    <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                      {row.full_name}
                    </span>
                    <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                      {row.roll_no ? `Roll ${row.roll_no}` : 'No roll number'}
                    </span>
                  </div>
                  <PercentPill value={row.percent} good={75} fair={50} />
                </div>
                <div className='flex items-center justify-between text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                  <span>
                    {row.weak_subjects.map((subject) => subject.name).join(', ') ||
                      'No weak subject'}
                  </span>
                  <span>Attendance {pct(row.attendance_percent)}</span>
                </div>
              </div>
            )}
          />
        </Card>
      )}
      {scheduling && sectionId && (
        <SpecialClassModal
          section={{
            id: sectionId,
            name: data?.section.name ?? section?.name ?? '',
            class_id: section?.class_id,
          }}
          studentIds={[...chosen]}
          onClose={() => setScheduling(false)}
          onSaved={onScheduled}
        />
      )}
    </div>
  )
}

function SpecialClassesView({
  sections,
  sectionId,
  canManage,
  onSection,
}: {
  sections: SectionPerformance[]
  sectionId?: number
  canManage: boolean
  onSection: (sectionId: number | undefined) => void
}) {
  const specials = useSpecialClasses({ section_id: sectionId })
  const [editing, setEditing] = useState<SpecialClass | null>(null)
  const [creating, setCreating] = useState(false)
  const [settings, setSettings] = useState(false)
  const [attendance, setAttendance] = useState<SpecialClass | null>(null)
  const [removing, setRemoving] = useState<SpecialClass | null>(null)
  const remove = usePerformanceMutation((id: number) => performanceApi.removeSpecial(id))
  const chosenSection = sections.find((item) => item.section_id === sectionId)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const allSpecials = useMemo(() => specials.data ?? [], [specials.data])
  const totalSpecials = allSpecials.length
  const maxPage = Math.max(1, Math.ceil(totalSpecials / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => allSpecials.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allSpecials, currentPage, pageSize]
  )

  const columns: Column<SpecialClass>[] = [
    {
      key: 'title',
      header: 'CLASS ⇅',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='flex flex-wrap items-center gap-2'>
            <StatusPill
              tone={row.kind === 'special' ? 'info' : 'warning'}
              label={row.kind === 'special' ? 'Special' : 'Extra'}
            />
            <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {row.title}
            </span>
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.section.name}
            {row.subject ? ` · ${row.subject.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'WHEN',
      cell: (row) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.when}
          </span>
          <span className='text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
            {row.timing === 'period' ? 'During a period' : 'Extra time'}
          </span>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          {row.teacher.name}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'STUDENTS',
      cell: (row) => (
        <span
          className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'
          title={row.students.map((student) => student.name).join(', ')}
        >
          {row.students.length} {row.students.length === 1 ? 'student' : 'students'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right' as const,
      cell: (row: SpecialClass) => (
        <div className='flex justify-end gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Attendance of ${row.title}`}
            title='Mark attendance'
            className='text-slate-500 hover:bg-[#EAF7F0] hover:text-[#127D48] dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400'
            onClick={() => setAttendance(row)}
          >
            <ClipboardCheck className='size-4' />
          </Button>
          {canManage && (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Edit ${row.title}`}
                title='Edit'
                className='text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                onClick={() => setEditing(row)}
              >
                <Pencil className='size-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Stop ${row.title}`}
                title='Stop class'
                className='text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
                onClick={() => setRemoving(row)}
              >
                <Trash2 className='size-4' />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <ListToolbar>
        <FilterSelect
          id='special-section'
          label='Class'
          allLabel='All classes'
          value={sectionId ? String(sectionId) : undefined}
          options={sections.map((item) => ({ value: String(item.section_id), label: item.name }))}
          onChange={(value) => {
            onSection(value ? Number(value) : undefined)
            setPage(1)
          }}
        />
        {canManage && (
          <>
            <Button
              size='sm'
              disabled={!chosenSection}
              title={chosenSection ? undefined : 'Choose a class first'}
              onClick={() => setCreating(true)}
            >
              <Plus />
              New special class
            </Button>
            <Button size='sm' variant='outline' onClick={() => setSettings(true)}>
              <Settings2 />
              Classes allowed
            </Button>
          </>
        )}
      </ListToolbar>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Special and extra classes</h2>
          <span className='text-xs text-muted-foreground'>
            Special: the whole class. Extra: chosen students, picked in Below average.
          </span>
        </div>
        <DataTable
          rows={paginatedRows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={specials.isFetching}
          error={specials.isError ? specials.error.message : null}
          onRetry={() => specials.refetch()}
          pagination={{
            page: currentPage,
            limit: pageSize,
            total: totalSpecials,
            label: 'classes',
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setPageSize(newLimit)
              setPage(1)
            },
            limitOptions: [10, 20, 25, 50],
          }}
          empty={{
            icon: CalendarClock,
            title: 'No special or extra classes yet',
            description:
              'Choose a class and click New special class, or pick students in Below average for an extra class.',
          }}
          card={(row) => (
            <div className='table-typography grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                  {row.title}
                </span>
                <StatusPill
                  tone={row.kind === 'special' ? 'info' : 'warning'}
                  label={row.kind === 'special' ? 'Special' : 'Extra'}
                />
              </div>
              <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {row.section.name} · {row.when} · {row.teacher.name} · {row.students.length}{' '}
                students
              </span>
            </div>
          )}
        />
      </Card>
      {creating && chosenSection && (
        <SpecialClassModal
          section={{
            id: chosenSection.section_id,
            name: chosenSection.name,
            class_id: chosenSection.class_id,
          }}
          kind='special'
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <SpecialClassModal
          section={{
            id: editing.section.id,
            name: editing.section.name,
            class_id: editing.class_id,
          }}
          special={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {attendance && (
        <SpecialAttendanceModal special={attendance} onClose={() => setAttendance(null)} />
      )}
      {settings && <SpecialSettingsModal onClose={() => setSettings(false)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Stop ${removing?.title ?? 'this class'}?`}
        description='The teacher and the parents are told it is cancelled.'
        confirmText='Stop class'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!removing) return
          try {
            await remove.mutateAsync(removing.id)
            alerts.success(`${removing.title} stopped`)
            setRemoving(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}
