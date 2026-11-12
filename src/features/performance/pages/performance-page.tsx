import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  ChartColumnBig,
  CircleX,
  Pencil,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  type BelowAverageStudent,
  type SectionPerformance,
  type SpecialClass,
} from '../api'
import { SpecialClassModal } from '../components/special-class-modal'
import type { PerformanceSearch, PerformanceTab } from '../search'

const route = getRouteApi('/_app/class-performance')

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : formatNumber(value, 1, '%')

const tone = (value: number | null, good: number, fair: number) =>
  value === null
    ? 'text-muted-foreground'
    : value >= good
      ? 'text-success'
      : value >= fair
        ? 'text-warning'
        : 'text-destructive'

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
          below={search.below}
          examFilter={examFilter}
          canManage={canManage}
          onSection={(sectionId) => setSearch({ section_id: sectionId })}
          onBelow={(below) => setSearch({ below })}
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
      header: 'Class',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-bold'>{row.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.class_teacher ?? 'No class teacher'}
          </span>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      align: 'right',
      cell: (row) => formatNumber(row.students),
    },
    {
      key: 'average',
      header: 'Average',
      align: 'right',
      cell: (row) => (
        <span className={cn('font-semibold', tone(row.average_percent, 75, 50))}>
          {pct(row.average_percent)}
        </span>
      ),
    },
    {
      key: 'pass',
      header: 'Pass %',
      align: 'right',
      cell: (row) => (
        <span className={cn('font-semibold', tone(row.pass_percent, 90, 70))}>
          {pct(row.pass_percent)}
        </span>
      ),
    },
    {
      key: 'fail',
      header: 'Fail %',
      align: 'right',
      cell: (row) => (
        <span
          className={cn(
            'font-semibold',
            row.fail_percent ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {pct(row.fail_percent)}
        </span>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className={tone(row.attendance_percent, 90, 75)}>{pct(row.attendance_percent)}</span>
      ),
    },
    {
      key: 'below',
      header: 'Below average',
      align: 'right',
      cell: (row) =>
        row.below_average ? (
          <Button
            variant='outline'
            size='sm'
            onClick={(event) => {
              event.stopPropagation()
              onOpenSection(row.section_id)
            }}
          >
            {row.below_average} {row.below_average === 1 ? 'student' : 'students'}
          </Button>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <ListToolbar>{filters}</ListToolbar>
      <InsightCards items={cards} loading={report.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>
            Class-wise report
            {data
              ? ` · ${data.exam?.name ?? 'all published exams'} · ${data.academic_year.name}`
              : ''}
          </h2>
          <span className='text-xs text-muted-foreground'>
            Click a class to see its students below average
          </span>
        </div>
        <DataTable
          rows={data?.sections ?? []}
          columns={columns}
          rowKey={(row) => row.section_id}
          loading={report.isFetching}
          error={report.isError ? report.error.message : null}
          onRetry={() => report.refetch()}
          onRowClick={(row) => onOpenSection(row.section_id)}
          empty={{
            icon: ChartColumnBig,
            title: 'No classes yet',
            description: 'Add classes and sections in School setup, then publish exam results.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-bold'>{row.name}</span>
                <span className={cn('text-sm font-semibold', tone(row.average_percent, 75, 50))}>
                  {pct(row.average_percent)}
                </span>
              </div>
              <span className='text-xs text-muted-foreground'>
                Pass {pct(row.pass_percent)} · Fail {pct(row.fail_percent)} · Attendance{' '}
                {pct(row.attendance_percent)}
              </span>
              {row.below_average > 0 && (
                <span className='text-xs font-semibold text-warning'>
                  {row.below_average} below average
                </span>
              )}
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
  below,
  examFilter,
  canManage,
  onSection,
  onBelow,
  onScheduled,
}: {
  sections: SectionPerformance[]
  sectionId?: number
  examId?: number
  below?: number
  examFilter: React.ReactNode
  canManage: boolean
  onSection: (sectionId: number | undefined) => void
  onBelow: (below: number | undefined) => void
  onScheduled: () => void
}) {
  const list = useBelowAverage(sectionId, examId, below)
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const [chosenFor, setChosenFor] = useState(`${sectionId}-${examId}-${below}`)
  const [line, setLine] = useState(below ? String(below) : '')
  const [scheduling, setScheduling] = useState(false)
  const key = `${sectionId}-${examId}-${below}`
  if (chosenFor !== key) {
    setChosenFor(key)
    setChosen(new Set())
  }
  const data = list.data
  const section = sections.find((item) => item.section_id === sectionId)
  const rows = data?.students ?? []
  const allChosen = rows.length > 0 && rows.every((row) => chosen.has(row.student_id))

  const columns: Column<BelowAverageStudent>[] = [
    {
      key: 'pick',
      header: (
        <input
          type='checkbox'
          aria-label='Choose every student'
          className='size-4 accent-[var(--primary)]'
          checked={allChosen}
          onChange={() =>
            setChosen(allChosen ? new Set() : new Set(rows.map((row) => row.student_id)))
          }
        />
      ),
      cell: (row) => (
        <input
          type='checkbox'
          aria-label={`Choose ${row.full_name}`}
          className='size-4 accent-[var(--primary)]'
          checked={chosen.has(row.student_id)}
          onClick={(event) => event.stopPropagation()}
          onChange={() =>
            setChosen((current) => {
              const next = new Set(current)
              if (next.has(row.student_id)) next.delete(row.student_id)
              else next.add(row.student_id)
              return next
            })
          }
        />
      ),
    },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-bold'>{row.full_name}</span>
          <span className='text-xs text-muted-foreground'>
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
      header: 'Result',
      align: 'right',
      cell: (row) => (
        <div className='grid justify-items-end'>
          <span className='font-semibold text-destructive'>{pct(row.percent)}</span>
          <span className='text-xs text-muted-foreground'>{formatNumber(row.gap, 1)} below</span>
        </div>
      ),
    },
    {
      key: 'weak',
      header: 'Weak subjects',
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
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => (
        <span className={tone(row.attendance_percent, 90, 75)}>{pct(row.attendance_percent)}</span>
      ),
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
        <form
          className='flex items-center gap-2'
          onSubmit={(event) => {
            event.preventDefault()
            const value = Number(line)
            onBelow(line.trim() && value >= 1 && value <= 100 ? value : undefined)
          }}
        >
          <Input
            aria-label='Show students below this %'
            inputMode='decimal'
            className='h-9 w-36'
            placeholder='Below class avg'
            value={line}
            onChange={(event) => setLine(event.target.value)}
          />
          <Button type='submit' variant='outline' size='sm'>
            Apply
          </Button>
        </form>
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
                {data?.line !== null && data?.line !== data?.section_average
                  ? ` · showing below ${pct(data?.line)}`
                  : ''}
              </span>
            </div>
            {canManage && (
              <Button size='sm' disabled={!chosen.size} onClick={() => setScheduling(true)}>
                <CalendarClock />
                Schedule special class{chosen.size ? ` (${chosen.size})` : ''}
              </Button>
            )}
          </div>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.student_id}
            loading={list.isFetching}
            error={list.isError ? list.error.message : null}
            onRetry={() => list.refetch()}
            empty={{
              icon: UsersRound,
              title: 'No student below the line',
              description:
                'Every assessed student is at or above it, or no results are published yet.',
            }}
            card={(row) => (
              <label className='grid cursor-pointer gap-1.5'>
                <span className='flex items-start justify-between gap-2'>
                  <span className='flex items-center gap-2 font-bold'>
                    <input
                      type='checkbox'
                      className='size-4 accent-[var(--primary)]'
                      checked={chosen.has(row.student_id)}
                      onChange={() =>
                        setChosen((current) => {
                          const next = new Set(current)
                          if (next.has(row.student_id)) next.delete(row.student_id)
                          else next.add(row.student_id)
                          return next
                        })
                      }
                    />
                    {row.full_name}
                  </span>
                  <span className='font-semibold text-destructive'>{pct(row.percent)}</span>
                </span>
                <span className='text-xs text-muted-foreground'>
                  {row.weak_subjects.map((subject) => subject.name).join(', ') || 'No weak subject'}{' '}
                  · Attendance {pct(row.attendance_percent)}
                </span>
              </label>
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
  const specials = useSpecialClasses(sectionId)
  const [editing, setEditing] = useState<SpecialClass | null>(null)
  const [removing, setRemoving] = useState<SpecialClass | null>(null)
  const remove = usePerformanceMutation((id: number) => performanceApi.removeSpecial(id))
  const section = (id: number) => sections.find((item) => item.section_id === id)

  const columns: Column<SpecialClass>[] = [
    {
      key: 'title',
      header: 'Special class',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-bold'>{row.title}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.section.name}
            {row.subject ? ` · ${row.subject.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (row) => (
        <div className='grid'>
          <span className='font-semibold'>{row.day}</span>
          <span className='text-xs text-muted-foreground'>
            Period {row.period_no}
            {row.start_time ? ` · ${row.start_time} – ${row.end_time}` : ''}
          </span>
        </div>
      ),
    },
    { key: 'teacher', header: 'Teacher', hideBelow: 'lg', cell: (row) => row.teacher.name },
    {
      key: 'students',
      header: 'Students',
      cell: (row) => (
        <span title={row.students.map((student) => student.name).join(', ')}>
          {row.students.length} students
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            cell: (row: SpecialClass) => (
              <div className='flex justify-end gap-1'>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Edit ${row.title}`}
                  onClick={() => setEditing(row)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Stop ${row.title}`}
                  onClick={() => setRemoving(row)}
                >
                  <Trash2 />
                </Button>
              </div>
            ),
          },
        ]
      : []),
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
          onChange={(value) => onSection(value ? Number(value) : undefined)}
        />
      </ListToolbar>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Special classes</h2>
          <span className='text-xs text-muted-foreground'>
            One dedicated period a week. To add one, choose students in Below average.
          </span>
        </div>
        <DataTable
          rows={specials.data ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={specials.isFetching}
          error={specials.isError ? specials.error.message : null}
          onRetry={() => specials.refetch()}
          empty={{
            icon: CalendarClock,
            title: 'No special classes yet',
            description:
              'Open Below average, choose the students and schedule a special class for them.',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <span className='font-bold'>{row.title}</span>
              <span className='text-xs text-muted-foreground'>
                {row.section.name} · {row.day}, period {row.period_no} · {row.teacher.name} ·{' '}
                {row.students.length} students
              </span>
            </div>
          )}
        />
      </Card>
      {editing && (
        <SpecialClassModal
          section={{
            id: editing.section.id,
            name: editing.section.name,
            class_id: section(editing.section.id)?.class_id,
          }}
          special={editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Stop ${removing?.title ?? 'this special class'}?`}
        description='The period is freed and the class no longer shows for the teacher or the parents.'
        confirmText='Stop special class'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!removing) return
          try {
            await remove.mutateAsync(removing.id)
            alerts.success('Special class stopped')
            setRemoving(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}
