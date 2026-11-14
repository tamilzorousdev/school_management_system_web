import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ChartColumnBig,
  MessageSquareQuote,
  Settings2,
  Star,
  ThumbsDown,
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
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

const passTone = (value: number | null) =>
  value === null
    ? 'text-muted-foreground'
    : value >= 90
      ? 'text-success'
      : value >= 60
        ? 'text-warning'
        : 'text-destructive'

function BehaviourBadge({ value }: { value: 'good' | 'bad' }) {
  return value === 'good' ? (
    <Badge tone='success'>
      <ThumbsUp className='size-3' />
      Good
    </Badge>
  ) : (
    <Badge tone='danger'>
      <ThumbsDown className='size-3' />
      Bad
    </Badge>
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
          <Badge tone={status.teacher_rating_enabled ? 'success' : 'neutral'}>
            Parent ratings {status.teacher_rating_enabled ? 'on' : 'off'}
          </Badge>
          {status.teacher_rating_enabled && status.cycle && (
            <span className='text-muted-foreground'>
              Once every{' '}
              {status.teacher_rating_months === 12
                ? 'year'
                : `${status.teacher_rating_months} months`}{' '}
              · this window {formatDate(status.cycle.start)} to {formatDate(status.cycle.end)}
            </span>
          )}
          <Badge tone={status.student_feedback_enabled ? 'success' : 'neutral'}>
            Student feedback {status.student_feedback_enabled ? 'on' : 'off'}
          </Badge>
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
  const rows = ranking.data ?? []
  const rated = rows.filter((row) => row.ratings > 0)
  const total = rated.reduce((sum, row) => sum + row.ratings, 0)
  const good = rated.reduce((sum, row) => sum + row.good, 0)
  const stars = rated.reduce((sum, row) => sum + (row.average_stars ?? 0) * row.ratings, 0)
  const cards: Insight[] = [
    {
      key: 'ratings',
      label: 'Parent ratings',
      value: total,
      hint: `${rated.length} of ${rows.length} teachers rated`,
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
      header: 'Rank',
      className: 'w-16',
      cell: (row) =>
        row.rank ? (
          <span className={cn('tabular font-bold', row.rank <= 3 && 'text-warning')}>
            #{row.rank}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.name}</span>
          <span className='text-xs text-muted-foreground'>{row.designation ?? 'Teacher'}</span>
        </span>
      ),
    },
    { key: 'stars', header: 'Average', cell: (row) => <Stars value={row.average_stars} /> },
    {
      key: 'ratings',
      header: 'Ratings',
      cell: (row) => <span className='tabular'>{row.ratings}</span>,
    },
    {
      key: 'behaviour',
      header: 'Good / bad',
      cell: (row) => (
        <span className='tabular text-sm'>
          <span className='font-semibold text-success'>{row.good}</span>
          {' / '}
          <span className='font-semibold text-destructive'>{row.bad}</span>
          {row.good_percent !== null && (
            <span className='text-muted-foreground'> · {pct(row.good_percent)} good</span>
          )}
        </span>
      ),
    },
  ]
  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={ranking.isPending} />
      <Card className='overflow-hidden'>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.teacher_user_id}
          loading={ranking.isPending}
          error={ranking.error?.message}
          onRetry={() => void ranking.refetch()}
          onRowClick={(row) => onOpen(row.teacher_user_id)}
          empty={{
            icon: Trophy,
            title: 'No teachers yet',
            description: 'Teaching staff appear here.',
          }}
          card={(row) => (
            <div className='flex items-center justify-between gap-3'>
              <span className='grid'>
                <span className='font-semibold'>
                  {row.rank ? `#${row.rank} ` : ''}
                  {row.name}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {row.ratings} ratings · {row.good} good · {row.bad} bad
                </span>
              </span>
              <Stars value={row.average_stars} />
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
      header: 'Teacher',
      cell: (row) => <span className='font-semibold'>{row.teacher.name}</span>,
    },
    {
      key: 'stars',
      header: 'Stars',
      cell: (row) => <Stars value={row.stars} label={row.stars_label} />,
    },
    {
      key: 'behaviour',
      header: 'Behaviour',
      cell: (row) => <BehaviourBadge value={row.behaviour} />,
    },
    {
      key: 'remark',
      header: 'Remark',
      cell: (row) =>
        row.remark ? (
          <span className='line-clamp-2 max-w-72 text-sm'>{row.remark}</span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'parent',
      header: 'Parent',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='grid'>
          <span className='text-sm'>{row.parent.name}</span>
          <span className='text-xs text-muted-foreground'>
            {row.student.name}
            {row.section ? ` · ${row.section}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='text-sm text-muted-foreground'>{formatDate(row.created_at)}</span>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (row: Rating) => (
              <Button
                size='icon'
                variant='ghost'
                aria-label={`Remove rating of ${row.teacher.name} by ${row.parent.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setRemoving(row)
                }}
              >
                <Trash2 className='text-destructive' />
              </Button>
            ),
          },
        ]
      : []),
  ]
  return (
    <Card className='overflow-hidden'>
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
          <div className='grid gap-1.5'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold'>{row.teacher.name}</span>
              <BehaviourBadge value={row.behaviour} />
            </div>
            <Stars value={row.stars} label={row.stars_label} />
            {row.remark && <p className='text-sm'>{row.remark}</p>}
            <span className='text-xs text-muted-foreground'>
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
      <Card className='overflow-hidden'>
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
      </Card>
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
    <Card className='grid gap-3 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <span className='grid'>
          <span className='font-bold'>{teacher.name}</span>
          <span className='text-xs text-muted-foreground'>{teacher.designation ?? 'Teacher'}</span>
        </span>
        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <Badge tone='neutral'>{teacher.overall.papers} papers</Badge>
          <span className={cn('font-semibold', passTone(teacher.overall.pass_percent))}>
            Pass {pct(teacher.overall.pass_percent)}
          </span>
          <span className='text-destructive'>Fail {pct(teacher.overall.fail_percent)}</span>
          <span className='text-muted-foreground'>Avg {pct(teacher.overall.average_percent)}</span>
          <Stars value={teacher.rating.average_stars} />
          <span className='text-xs text-muted-foreground'>
            {teacher.rating.ratings} ratings · {teacher.rating.good} good · {teacher.rating.bad} bad
          </span>
        </div>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[560px] text-sm'>
          <thead>
            <tr className='border-b text-left text-xs text-muted-foreground uppercase'>
              <th className='py-1.5 pr-3 font-semibold'>Class</th>
              <th className='py-1.5 pr-3 font-semibold'>Subject</th>
              <th className='py-1.5 pr-3 font-semibold'>Students</th>
              <th className='py-1.5 pr-3 font-semibold'>Pass</th>
              <th className='py-1.5 pr-3 font-semibold'>Fail</th>
              <th className='py-1.5 font-semibold'>Average</th>
            </tr>
          </thead>
          <tbody>
            {teacher.classes.map((item) => (
              <tr key={`${item.section_id}-${item.subject_id}`} className='border-b last:border-0'>
                <td className='py-1.5 pr-3 font-semibold'>{item.section}</td>
                <td className='py-1.5 pr-3'>{item.subject}</td>
                <td className='tabular py-1.5 pr-3'>{item.students || '—'}</td>
                <td
                  className={cn('tabular py-1.5 pr-3 font-semibold', passTone(item.pass_percent))}
                >
                  {pct(item.pass_percent)}
                </td>
                <td className='tabular py-1.5 pr-3 text-destructive'>{pct(item.fail_percent)}</td>
                <td className='tabular py-1.5'>{pct(item.average_percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {teacher.remarks.length > 0 && (
        <div className='grid gap-1'>
          <span className='text-xs font-semibold text-muted-foreground'>Latest parent remarks</span>
          <ul className='grid gap-1'>
            {teacher.remarks.map((remark, index) => (
              <li key={index} className='rounded-md bg-muted/50 px-2.5 py-1.5 text-sm'>
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
      header: 'Student',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.student.name}</span>
          <span className='text-xs text-muted-foreground'>{row.section ?? 'No section'}</span>
        </span>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      cell: (row) => (
        <span className='grid'>
          <span className='text-sm'>{row.teacher.name}</span>
          <span className='text-xs text-muted-foreground'>{row.term.name}</span>
        </span>
      ),
    },
    {
      key: 'studies',
      header: 'Studies',
      cell: (row) => <Stars value={row.studies} label={row.studies_label} />,
    },
    {
      key: 'behaviour',
      header: 'Behaviour',
      cell: (row) => <Stars value={row.behaviour} label={row.behaviour_label} />,
    },
    {
      key: 'sports',
      header: 'Sports',
      hideBelow: 'lg',
      cell: (row) => <Stars value={row.sports} label={row.sports_label} />,
    },
    {
      key: 'remark',
      header: 'Remark',
      hideBelow: 'xl',
      cell: (row) =>
        row.remark ? (
          <span className='line-clamp-2 max-w-64 text-sm'>{row.remark}</span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (row: StudentFeedback) => (
              <Button
                size='icon'
                variant='ghost'
                aria-label={`Remove feedback on ${row.student.name} by ${row.teacher.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setRemoving(row)
                }}
              >
                <Trash2 className='text-destructive' />
              </Button>
            ),
          },
        ]
      : []),
  ]
  return (
    <Card className='overflow-hidden'>
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
          <div className='grid gap-1.5'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold'>{row.student.name}</span>
              <span className='text-xs text-muted-foreground'>{row.section}</span>
            </div>
            <span className='text-xs text-muted-foreground'>
              {row.teacher.name} · {row.term.name}
            </span>
            <Stars value={row.studies} label={`Studies · ${row.studies_label}`} />
            <Stars value={row.behaviour} label={`Behaviour · ${row.behaviour_label}`} />
            {row.sports && <Stars value={row.sports} label={`Sports · ${row.sports_label}`} />}
            {row.remark && <p className='text-sm'>{row.remark}</p>}
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
  )
}
