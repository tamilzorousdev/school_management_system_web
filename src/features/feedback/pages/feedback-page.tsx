import { useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ChartColumnBig,
  ChevronRight,
  MessageSquareQuote,
  Settings2,
  Star,
  ThumbsUp,
  Trash2,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/features/attendance/components/students-tab'
import { can, useMe } from '@/features/auth/api'
import { useExamOptions } from '@/features/exams/api'
import { useSections } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  feedbackApi,
  useFeedbackMutation,
  useFeedbackSettings,
  useRatings,
  useStudentFeedback,
  useTeacherRanking,
  useTeacherReport,
  type RankingRow,
  type Rating,
  type StudentFeedback,
  type TeacherReportRow,
} from '../api'
import { FeedbackSettingsModal } from '../components/feedback-settings-modal'
import { Stars } from '../components/stars'
import type { FeedbackSearch, FeedbackTab } from '../search'

const route = getRouteApi('/_app/teacher-feedback')
const LIMIT = 20

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

function BehaviourBadge({ value }: { value: 'good' | 'bad' }) {
  return value === 'good' ? (
    <StatusPill tone='success' label='Good' />
  ) : (
    <StatusPill tone='danger' label='Bad' />
  )
}

export function FeedbackPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/teacher-feedback' })
  const me = useMe().data
  const canManage = can(me, 'feedback.manage')
  const setSearch = (patch: Partial<FeedbackSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const settings = useFeedbackSettings()
  const ranking = useTeacherRanking()
  const [editing, setEditing] = useState(false)
  const teacherOptions = (ranking.data ?? []).map((row) => ({
    value: String(row.teacher_user_id),
    label: row.name,
  }))
  const teacherFilter = (
    <FilterSelect
      id='feedback-teacher'
      label='Teacher'
      allLabel='All teachers'
      value={search.teacher_user_id ? String(search.teacher_user_id) : undefined}
      options={teacherOptions}
      onChange={(value) => setSearch({ teacher_user_id: value ? Number(value) : undefined })}
    />
  )

  useShortcut('app.refresh', () => void ranking.refetch())

  const status = settings.data
  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Teacher feedback'
        description='Parent ratings of teachers, the teacher ranking, teacher-wise results by class and subject, and the feedback teachers give students.'
        actions={
          canManage && status ? (
            <Button size='sm' variant='outline' onClick={() => setEditing(true)}>
              <Settings2 />
              Settings
            </Button>
          ) : undefined
        }
      />
      {status && (
        <div className='flex flex-wrap items-center gap-2 text-xs'>
          <StatusPill
            tone={status.teacher_rating_enabled ? 'success' : 'neutral'}
            label={`Parent ratings ${status.teacher_rating_enabled ? 'on' : 'off'}`}
          />
          {status.teacher_rating_enabled && status.cycle && (
            <span className='text-muted-foreground'>
              Once every{' '}
              {status.teacher_rating_months === 12
                ? 'year'
                : `${status.teacher_rating_months} months`}{' '}
              · this window {formatDate(status.cycle.start)} to {formatDate(status.cycle.end)}
            </span>
          )}
          <StatusPill
            tone={status.student_feedback_enabled ? 'success' : 'neutral'}
            label={`Student feedback ${status.student_feedback_enabled ? 'on' : 'off'}`}
          />
          {status.student_feedback_enabled && status.term && (
            <span className='text-muted-foreground'>{status.term.name}</span>
          )}
        </div>
      )}
      <PageTabs
        label='Teacher feedback views'
        value={search.tab}
        onChange={(tab: FeedbackTab) => navigate({ search: { tab, page: 1 }, replace: true })}
        tabs={[
          { value: 'ranking', label: 'Ranking', icon: Trophy },
          { value: 'ratings', label: 'Parent ratings', icon: Star },
          { value: 'report', label: 'Teacher report', icon: ChartColumnBig },
          { value: 'students', label: 'Student feedback', icon: MessageSquareQuote },
        ]}
      />
      {search.tab === 'ranking' && (
        <RankingView
          ranking={ranking}
          onOpen={(teacherId) => setSearch({ tab: 'ratings', teacher_user_id: teacherId })}
        />
      )}
      {search.tab === 'ratings' && (
        <RatingsView
          search={search}
          setSearch={setSearch}
          teacherFilter={teacherFilter}
          canManage={canManage}
        />
      )}
      {search.tab === 'report' && (
        <ReportView search={search} setSearch={setSearch} teacherFilter={teacherFilter} />
      )}
      {search.tab === 'students' && (
        <StudentsView
          search={search}
          setSearch={setSearch}
          teacherFilter={teacherFilter}
          canManage={canManage}
        />
      )}
      {editing && status && (
        <FeedbackSettingsModal settings={status} onClose={() => setEditing(false)} />
      )}
    </Page>
  )
}

function RankingView({
  ranking,
  onOpen,
}: {
  ranking: ReturnType<typeof useTeacherRanking>
  onOpen: (teacherId: number) => void
}) {
  const [filter, setFilter] = useState<'all' | 'rated' | 'unrated'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const allRows = useMemo(() => ranking.data ?? [], [ranking.data])
  const rated = allRows.filter((row) => row.ratings > 0)
  const total = rated.reduce((sum, row) => sum + row.ratings, 0)
  const good = rated.reduce((sum, row) => sum + row.good, 0)
  const stars = rated.reduce((sum, row) => sum + (row.average_stars ?? 0) * row.ratings, 0)

  const rows = useMemo(
    () =>
      filter === 'rated'
        ? allRows.filter((row) => row.ratings > 0)
        : filter === 'unrated'
          ? allRows.filter((row) => row.ratings === 0)
          : allRows,
    [allRows, filter]
  )
  const totalRows = rows.length
  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  )

  const cards: Insight[] = [
    {
      key: 'ratings',
      label: 'Parent ratings',
      value: total,
      hint: `${rated.length} of ${allRows.length} teachers rated`,
      icon: Star,
      tone: 'primary',
    },
    {
      key: 'average',
      label: 'Average stars',
      value: total ? formatNumber(stars / total, 1) : '—',
      hint: 'Across the school this year',
      icon: Trophy,
      tone: 'warning',
    },
    {
      key: 'good',
      label: 'Good behaviour',
      value: total ? pct((good / total) * 100) : '—',
      hint: `${good} good · ${total - good} bad`,
      icon: ThumbsUp,
      tone: total && good / total < 0.8 ? 'danger' : 'success',
    },
    {
      key: 'top',
      label: 'Top teacher',
      value: rated[0]?.average_stars ? `${rated[0].average_stars}★` : '—',
      hint: rated[0] ? `${rated[0].name} · ${rated[0].ratings} ratings` : 'No ratings yet',
      icon: UsersRound,
      tone: 'info',
    },
  ]
  const columns: Column<RankingRow>[] = [
    {
      key: 'rank',
      header: 'RANK',
      className: 'w-16',
      cell: (row) =>
        row.rank ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums',
              row.rank <= 3
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            #{row.rank}
          </span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'teacher',
      header: 'TEACHER ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.designation ?? 'Teacher'}
          </span>
        </div>
      ),
    },
    { key: 'stars', header: 'AVERAGE', cell: (row) => <Stars value={row.average_stars} /> },
    {
      key: 'ratings',
      header: 'RATINGS',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {row.ratings}
        </span>
      ),
    },
    {
      key: 'behaviour',
      header: 'GOOD / BAD',
      cell: (row) => (
        <span className='flex flex-wrap items-center gap-2 text-[13px] leading-[18px] tabular-nums'>
          <span>
            <span className='font-semibold text-emerald-600 dark:text-emerald-400'>{row.good}</span>
            <span className='text-slate-300 dark:text-slate-600'> / </span>
            <span className='font-semibold text-rose-600 dark:text-rose-400'>{row.bad}</span>
          </span>
          {row.good_percent !== null && (
            <PercentPill value={row.good_percent} good={85} fair={70} />
          )}
        </span>
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
          aria-label={`View ratings for ${row.name}`}
          title='View parent ratings'
          className='text-slate-500 hover:bg-[#EAF7F0] hover:text-[#127D48] dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400'
          onClick={(event) => {
            event.stopPropagation()
            onOpen(row.teacher_user_id)
          }}
        >
          <ChevronRight className='size-4' />
        </Button>
      ),
    },
  ]
  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={ranking.isPending} />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='font-bold'>Teachers</h2>
            <SegmentedControl
              label='Filter teachers'
              value={filter}
              onChange={(value: 'all' | 'rated' | 'unrated') => {
                setFilter(value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'rated', label: 'Rated' },
                { value: 'unrated', label: 'Unrated' },
              ]}
            />
          </div>
          <span className='text-xs text-muted-foreground'>
            Click a teacher to view their parent ratings
          </span>
        </div>
        <DataTable
          rows={paginatedRows}
          columns={columns}
          rowKey={(row) => row.teacher_user_id}
          loading={ranking.isPending}
          error={ranking.error?.message}
          onRetry={() => void ranking.refetch()}
          onRowClick={(row) => onOpen(row.teacher_user_id)}
          pagination={{
            page: currentPage,
            limit: pageSize,
            total: totalRows,
            label: 'teachers',
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setPageSize(newLimit)
              setPage(1)
            },
            limitOptions: [10, 20, 25, 50],
          }}
          empty={{
            icon: Trophy,
            title: filter === 'all' ? 'No teachers yet' : 'No teachers in this group',
            description:
              filter === 'all'
                ? 'Teaching staff appear here.'
                : 'Switch filter to see other teachers.',
          }}
          card={(row) => (
            <div className='table-typography grid gap-2'>
              <div className='flex items-start justify-between gap-2.5'>
                <div className='grid min-w-0 flex-1'>
                  <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                    {row.rank ? `#${row.rank} · ` : ''}
                    {row.name}
                  </span>
                  <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                    {row.designation ?? 'Teacher'}
                  </span>
                </div>
                <Stars value={row.average_stars} />
              </div>
              <div className='flex items-center justify-between text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                <span>
                  {row.ratings} ratings · {row.good} good · {row.bad} bad
                </span>
                {row.good_percent !== null && (
                  <PercentPill value={row.good_percent} good={85} fair={70} />
                )}
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  )
}

function RatingsView({
  search,
  setSearch,
  teacherFilter,
  canManage,
}: {
  search: FeedbackSearch
  setSearch: (patch: Partial<FeedbackSearch>) => void
  teacherFilter: React.ReactNode
  canManage: boolean
}) {
  const list = useRatings({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    teacher_user_id: search.teacher_user_id,
    behaviour: search.behaviour,
    max_stars: search.low ? 2 : undefined,
  })
  const [removing, setRemoving] = useState<Rating | null>(null)
  const remove = useFeedbackMutation(feedbackApi.removeRating)
  const filtered = Boolean(
    search.search || search.teacher_user_id || search.behaviour || search.low
  )
  const columns: Column<Rating>[] = [
    {
      key: 'teacher',
      header: 'TEACHER ⇅',
      cell: (row) => (
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
          {row.teacher.name}
        </span>
      ),
    },
    {
      key: 'stars',
      header: 'STARS',
      cell: (row) => <Stars value={row.stars} label={row.stars_label} />,
    },
    {
      key: 'behaviour',
      header: 'BEHAVIOUR',
      cell: (row) => <BehaviourBadge value={row.behaviour} />,
    },
    {
      key: 'remark',
      header: 'REMARK',
      cell: (row) =>
        row.remark ? (
          <span className='line-clamp-2 max-w-72 text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
            {row.remark}
          </span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    {
      key: 'parent',
      header: 'PARENT',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {row.parent.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.student.name}
            {row.section ? ` · ${row.section}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'DATE',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: 'ACTION',
            align: 'right' as const,
            cell: (row: Rating) => (
              <Button
                size='icon-sm'
                variant='ghost'
                title='Remove rating'
                aria-label={`Remove rating of ${row.teacher.name} by ${row.parent.name}`}
                className='text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
                onClick={(event) => {
                  event.stopPropagation()
                  setRemoving(row)
                }}
              >
                <Trash2 className='size-4' />
              </Button>
            ),
          },
        ]
      : []),
  ]
  return (
    <div className='grid gap-4'>
      <ListToolbar
        summary={list.data ? `${list.data.total} ratings` : ''}
        onClear={
          filtered
            ? () =>
                setSearch({
                  search: undefined,
                  teacher_user_id: undefined,
                  behaviour: undefined,
                  low: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => setSearch({ search: value || undefined })}
          placeholder='Teacher, parent, student or remark'
          label='Search ratings'
        />
        {teacherFilter}
        <FilterSelect
          id='feedback-behaviour'
          label='Behaviour'
          allLabel='Good and bad'
          value={search.behaviour}
          options={[
            { value: 'good', label: 'Good' },
            { value: 'bad', label: 'Bad' },
          ]}
          onChange={(value) =>
            setSearch({ behaviour: (value as 'good' | 'bad' | undefined) ?? undefined })
          }
        />
        <FilterSelect
          id='feedback-low'
          label='Stars'
          allLabel='All stars'
          value={search.low ? 'low' : undefined}
          options={[{ value: 'low', label: '1–2 stars only' }]}
          onChange={(value) => setSearch({ low: value ? true : undefined })}
        />
      </ListToolbar>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Parent ratings</h2>
          <span className='text-xs text-muted-foreground'>
            {list.data ? `${list.data.total} ratings` : 'Ratings submitted by parents'}
          </span>
        </div>
        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isPending}
          error={list.error?.message}
          onRetry={() => void list.refetch()}
          empty={{
            icon: Star,
            title: filtered ? 'No ratings match' : 'No parent ratings yet',
            description: filtered
              ? 'Clear the filters to see every rating.'
              : 'Turn on parent ratings in Settings; ratings from the Parent app appear here.',
          }}
          card={(row) => (
            <div className='table-typography grid gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                  {row.teacher.name}
                </span>
                <BehaviourBadge value={row.behaviour} />
              </div>
              <Stars value={row.stars} label={row.stars_label} />
              {row.remark && (
                <p className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
                  {row.remark}
                </p>
              )}
              <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {row.parent.name} · {row.student.name}
                {row.section ? ` · ${row.section}` : ''} · {formatDate(row.created_at)}
              </span>
            </div>
          )}
          pagination={
            list.data
              ? {
                  page: search.page,
                  limit: list.data.limit,
                  total: list.data.total,
                  label: 'ratings',
                  onPageChange: (page) => setSearch({ page }),
                }
              : undefined
          }
        />
        <ConfirmDialog
          open={Boolean(removing)}
          onOpenChange={(open) => !open && setRemoving(null)}
          title='Remove this rating?'
          description={`${removing?.parent.name}'s rating of ${removing?.teacher.name} will be removed, and the parent can rate again in this window.`}
          confirmText='Remove rating'
          destructive
          loading={remove.isPending}
          onConfirm={async () => {
            if (!removing) return
            try {
              await remove.mutateAsync(removing.id)
              alerts.success('Rating removed')
              setRemoving(null)
            } catch (error) {
              alerts.error(toApiError(error).message)
            }
          }}
        />
      </Card>
    </div>
  )
}

function ReportView({
  search,
  setSearch,
  teacherFilter,
}: {
  search: FeedbackSearch
  setSearch: (patch: Partial<FeedbackSearch>) => void
  teacherFilter: React.ReactNode
}) {
  const report = useTeacherReport(search.exam_id, search.teacher_user_id)
  const exams = useExamOptions()
  const published = (exams.data?.items ?? []).filter((exam) => exam.status === 'published')
  return (
    <div className='grid gap-4'>
      <ListToolbar
        summary={
          report.data
            ? `${report.data.teachers.length} teachers · ${report.data.exam?.name ?? 'all published exams'}`
            : ''
        }
        onClear={
          search.exam_id || search.teacher_user_id
            ? () => setSearch({ exam_id: undefined, teacher_user_id: undefined })
            : undefined
        }
      >
        <FilterSelect
          id='feedback-exam'
          label='Exam'
          allLabel='All published exams'
          value={search.exam_id ? String(search.exam_id) : undefined}
          options={published.map((exam) => ({ value: String(exam.id), label: exam.name }))}
          onChange={(value) => setSearch({ exam_id: value ? Number(value) : undefined })}
        />
        {teacherFilter}
      </ListToolbar>
      {report.isError ? (
        <ErrorState message={report.error.message} onRetry={() => void report.refetch()} />
      ) : !report.data ? (
        <div className='grid gap-3'>
          <Skeleton className='h-40' />
          <Skeleton className='h-40' />
        </div>
      ) : report.data.teachers.length === 0 ? (
        <Card>
          <EmptyState
            icon={ChartColumnBig}
            title='No teacher assignments'
            description='Assign teachers to classes and subjects to see their results here.'
          />
        </Card>
      ) : (
        <div className='grid gap-3'>
          {report.data.teachers.map((teacher) => (
            <TeacherCard key={teacher.teacher_user_id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  )
}

function TeacherCard({ teacher }: { teacher: TeacherReportRow }) {
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='grid min-w-0'>
          <span className='text-[14px] leading-[20px] font-bold text-slate-900 dark:text-slate-100'>
            {teacher.name}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {teacher.designation ?? 'Teacher'}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <StatusPill tone='neutral' label={`${teacher.overall.papers} papers`} />
          <PercentPill value={teacher.overall.pass_percent} good={90} fair={60} />
          <PercentPill value={teacher.overall.fail_percent} good={0} fair={15} invert />
          <span className='text-[12px] font-medium text-slate-500 tabular-nums dark:text-slate-400'>
            Avg {pct(teacher.overall.average_percent)}
          </span>
          <Stars value={teacher.rating.average_stars} />
          <span className='text-[12px] text-slate-500 dark:text-slate-400'>
            {teacher.rating.ratings} ratings · {teacher.rating.good} good · {teacher.rating.bad} bad
          </span>
        </div>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[560px] text-sm'>
          <thead>
            <tr className='border-b bg-slate-50/80 text-left text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:bg-slate-900/60 dark:text-slate-400'>
              <th className='px-4 py-2.5'>Class</th>
              <th className='px-3 py-2.5'>Subject</th>
              <th className='px-3 py-2.5'>Students</th>
              <th className='px-3 py-2.5'>Pass</th>
              <th className='px-3 py-2.5'>Fail</th>
              <th className='px-4 py-2.5'>Average</th>
            </tr>
          </thead>
          <tbody>
            {teacher.classes.map((item) => (
              <tr
                key={`${item.section_id}-${item.subject_id}`}
                className='border-b transition-colors last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-900/40'
              >
                <td className='px-4 py-2.5 text-[13px] font-semibold text-slate-900 dark:text-slate-100'>
                  {item.section}
                </td>
                <td className='px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300'>
                  {item.subject}
                </td>
                <td className='px-3 py-2.5 text-[13px] text-slate-700 tabular-nums dark:text-slate-300'>
                  {item.students || '—'}
                </td>
                <td className='px-3 py-2.5'>
                  <PercentPill value={item.pass_percent} good={90} fair={60} />
                </td>
                <td className='px-3 py-2.5'>
                  <PercentPill value={item.fail_percent} good={0} fair={15} invert />
                </td>
                <td className='px-4 py-2.5'>
                  <PercentPill value={item.average_percent} good={75} fair={50} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {teacher.remarks.length > 0 && (
        <div className='grid gap-1.5 border-t bg-slate-50/40 px-4 py-3 dark:bg-slate-900/30'>
          <span className='text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400'>
            Latest parent remarks
          </span>
          <ul className='grid gap-1.5'>
            {teacher.remarks.map((remark, index) => (
              <li
                key={index}
                className='rounded-md border border-slate-200/70 bg-white px-3 py-2 text-[13px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              >
                “{remark}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function StudentsView({
  search,
  setSearch,
  teacherFilter,
  canManage,
}: {
  search: FeedbackSearch
  setSearch: (patch: Partial<FeedbackSearch>) => void
  teacherFilter: React.ReactNode
  canManage: boolean
}) {
  const list = useStudentFeedback({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    teacher_user_id: search.teacher_user_id,
    section_id: search.section_id,
  })
  const sections = useSections()
  const [removing, setRemoving] = useState<StudentFeedback | null>(null)
  const remove = useFeedbackMutation(feedbackApi.removeFeedback)
  const filtered = Boolean(search.search || search.teacher_user_id || search.section_id)
  const columns: Column<StudentFeedback>[] = [
    {
      key: 'student',
      header: 'STUDENT ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.student.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.section ?? 'No section'}
          </span>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {row.teacher.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.term.name}
          </span>
        </div>
      ),
    },
    {
      key: 'studies',
      header: 'STUDIES',
      cell: (row) => <Stars value={row.studies} label={row.studies_label} />,
    },
    {
      key: 'behaviour',
      header: 'BEHAVIOUR',
      cell: (row) => <Stars value={row.behaviour} label={row.behaviour_label} />,
    },
    {
      key: 'sports',
      header: 'SPORTS',
      hideBelow: 'lg',
      cell: (row) => <Stars value={row.sports} label={row.sports_label} />,
    },
    {
      key: 'remark',
      header: 'REMARK',
      hideBelow: 'xl',
      cell: (row) =>
        row.remark ? (
          <span className='line-clamp-2 max-w-64 text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
            {row.remark}
          </span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: 'ACTION',
            align: 'right' as const,
            cell: (row: StudentFeedback) => (
              <Button
                size='icon-sm'
                variant='ghost'
                title='Remove feedback'
                aria-label={`Remove feedback on ${row.student.name} by ${row.teacher.name}`}
                className='text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
                onClick={(event) => {
                  event.stopPropagation()
                  setRemoving(row)
                }}
              >
                <Trash2 className='size-4' />
              </Button>
            ),
          },
        ]
      : []),
  ]
  return (
    <div className='grid gap-4'>
      <ListToolbar
        summary={list.data ? `${list.data.total} feedback` : ''}
        onClear={
          filtered
            ? () =>
                setSearch({ search: undefined, teacher_user_id: undefined, section_id: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => setSearch({ search: value || undefined })}
          placeholder='Student name'
          label='Search student feedback'
        />
        {teacherFilter}
        <FilterSelect
          id='feedback-section'
          label='Class'
          allLabel='All classes'
          value={search.section_id ? String(search.section_id) : undefined}
          options={(sections.data ?? []).map((item) => ({
            value: String(item.id),
            label: `${item.class_name} - ${item.name}`,
          }))}
          onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
        />
      </ListToolbar>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Student feedback</h2>
          <span className='text-xs text-muted-foreground'>
            {list.data ? `${list.data.total} feedback` : 'Feedback given by teachers each term'}
          </span>
        </div>
        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isPending}
          error={list.error?.message}
          onRetry={() => void list.refetch()}
          empty={{
            icon: MessageSquareQuote,
            title: filtered ? 'No feedback matches' : 'No student feedback yet',
            description: filtered
              ? 'Clear the filters to see all feedback.'
              : 'Turn on student feedback in Settings; teachers give it once a term in the Staff app.',
          }}
          card={(row) => (
            <div className='table-typography grid gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                  {row.student.name}
                </span>
                <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                  {row.section}
                </span>
              </div>
              <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {row.teacher.name} · {row.term.name}
              </span>
              <Stars value={row.studies} label={`Studies · ${row.studies_label}`} />
              <Stars value={row.behaviour} label={`Behaviour · ${row.behaviour_label}`} />
              {row.sports && <Stars value={row.sports} label={`Sports · ${row.sports_label}`} />}
              {row.remark && (
                <p className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
                  {row.remark}
                </p>
              )}
            </div>
          )}
          pagination={
            list.data
              ? {
                  page: search.page,
                  limit: list.data.limit,
                  total: list.data.total,
                  label: 'feedback',
                  onPageChange: (page) => setSearch({ page }),
                }
              : undefined
          }
        />
        <ConfirmDialog
          open={Boolean(removing)}
          onOpenChange={(open) => !open && setRemoving(null)}
          title='Remove this feedback?'
          description={`${removing?.teacher.name}'s feedback on ${removing?.student.name} will be removed, and the teacher can give it again this term.`}
          confirmText='Remove feedback'
          destructive
          loading={remove.isPending}
          onConfirm={async () => {
            if (!removing) return
            try {
              await remove.mutateAsync(removing.id)
              alerts.success('Feedback removed')
              setRemoving(null)
            } catch (error) {
              alerts.error(toApiError(error).message)
            }
          }}
        />
      </Card>
    </div>
  )
}
