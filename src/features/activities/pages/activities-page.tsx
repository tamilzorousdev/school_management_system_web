import { useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  Award,
  CalendarDays,
  Globe2,
  Medal,
  MountainSnow,
  Plus,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import type { BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { StatusPill } from '@/features/attendance/components/students-tab'
import { useClasses, useSections } from '@/features/setup/api'
import {
  CATEGORY_LABELS,
  LEVEL_LABELS,
  LEVEL_TONE,
  PARTICIPATION_LABELS,
  RESULT_LABELS,
  RESULT_TONE,
  SCOPE_LABELS,
  VENUE_LABELS,
} from '@/features/students/achievement-labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  activitiesApi,
  useActivityInsights,
  useActivityList,
  useLeaderboard,
  useSportsOnDutyList,
  useSportsOnDutyMutation,
  type ActivityFilter,
  type ActivityListParams,
  type LeaderboardRow,
  type SchoolAchievement,
  type SportsOnDuty,
} from '../api'
import { ActivityPodium } from '../components/activity-podium'
import { SportsOnDutyModal } from '../components/sports-on-duty-modal'
import type { ActivitiesSearch, ActivityTab, CategoryFilter, QuickFilter } from '../search'

const route = getRouteApi('/_app/activities')

const CATEGORY_FILTER_LABELS: Record<CategoryFilter, string> = {
  non_academic: 'All activities (not studies)',
  sports: 'Sports',
  arts: 'Arts',
  cultural: 'Cultural',
  competition: 'Competitions',
  leadership: 'Leadership',
  academic: 'Academic',
  other: 'Other',
}

const pairs = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))

type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const toPillTone = (tone: BadgeTone): PillTone =>
  tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info'
    ? tone
    : 'neutral'

function StudentCell({ student }: { student: SchoolAchievement['student'] }) {
  return (
    <div className='grid min-w-0'>
      <Link
        to='/students/$studentId'
        params={{ studentId: String(student.id) }}
        search={{ tab: 'achievements' }}
        className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 hover:text-primary hover:underline dark:text-slate-100'
      >
        {student.name}
      </Link>
      <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
        {[student.section, student.admission_no].filter(Boolean).join(' · ')}
      </span>
    </div>
  )
}

export function ActivitiesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/activities' })
  const setSearch = (patch: Partial<ActivitiesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const category = search.category ?? 'non_academic'
  const filter: ActivityFilter = {
    category,
    class_id: search.section_id ? undefined : search.class_id,
    section_id: search.section_id,
  }
  const classes = useClasses()
  const sections = useSections(search.class_id, Boolean(search.class_id))
  const insights = useActivityInsights(filter)
  const leaderboard = useLeaderboard({ ...filter, limit: 25 }, search.tab === 'leaderboard')
  const [addingOd, setAddingOd] = useState(false)
  const [removingOd, setRemovingOd] = useState<SportsOnDuty | null>(null)
  const odList = useSportsOnDutyList({
    class_id: search.section_id ? undefined : search.class_id,
    section_id: search.section_id,
  })
  const removeOd = useSportsOnDutyMutation((id: number) => activitiesApi.removeOnDuty(id))
  const quick: Partial<ActivityListParams> =
    search.quick === 'sports'
      ? { category: 'sports' }
      : search.quick === 'wins'
        ? { result: 'winner' }
        : search.quick === 'outside'
          ? { outside_school: true }
          : search.quick === 'high'
            ? { district_or_above: true }
            : {}
  const list = useActivityList({
    ...filter,
    page: search.page,
    limit: 20,
    search: search.search,
    result: search.result,
    event_scope: search.event_scope,
    venue_type: search.venue_type,
    participation: search.participation,
    ...quick,
  })

  useShortcut('app.refresh', () => {
    void insights.refetch()
    void leaderboard.refetch()
    void list.refetch()
  })

  const toggle = (value: QuickFilter) =>
    setSearch({ tab: 'all', quick: search.quick === value ? undefined : value })
  const counts = insights.data
  const cards: Insight[] = [
    {
      key: 'sports',
      label: 'Sports',
      value: counts?.sports ?? 0,
      hint: `of ${counts?.total ?? 0} achievements`,
      icon: Trophy,
      tone: 'success',
      active: search.quick === 'sports',
      onClick: () => toggle('sports'),
    },
    {
      key: 'wins',
      label: 'Wins',
      value: counts?.wins ?? 0,
      hint: 'First place',
      icon: Medal,
      tone: 'warning',
      active: search.quick === 'wins',
      onClick: () => toggle('wins'),
    },
    {
      key: 'outside',
      label: 'Outside school',
      value: counts?.outside_events ?? 0,
      hint: 'Inter-school and outside events',
      icon: Globe2,
      tone: 'info',
      active: search.quick === 'outside',
      onClick: () => toggle('outside'),
    },
    {
      key: 'high',
      label: 'District and above',
      value: counts?.district_or_above ?? 0,
      hint: `${counts?.students ?? 0} students with achievements`,
      icon: MountainSnow,
      tone: 'primary',
      active: search.quick === 'high',
      onClick: () => toggle('high'),
    },
  ]

  const filtersActive = Boolean(
    search.category ||
    search.class_id ||
    search.section_id ||
    search.quick ||
    search.search ||
    search.result ||
    search.event_scope ||
    search.venue_type ||
    search.participation
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Sports & activities'
        description='Students ranked by sports, competitions, arts and other activities, not only by marks. Points = level × result.'
        actions={
          search.tab === 'on_duty' ? (
            <Button size='sm' onClick={() => setAddingOd(true)}>
              <Plus />
              Map Sports OD
            </Button>
          ) : undefined
        }
      />
      <PageTabs
        label='Sports and activities sections'
        value={search.tab}
        onChange={(tab: ActivityTab) => setSearch({ tab })}
        tabs={[
          { value: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { value: 'all', label: 'All achievements', icon: Award, count: counts?.total },
          {
            value: 'on_duty',
            label: 'On Duty (OD)',
            icon: CalendarDays,
            count: odList.data?.length,
          },
        ]}
      />
      <InsightCards items={cards} loading={!counts} />
      <ListToolbar
        summary={
          search.tab === 'all' && list.data
            ? `${list.data.total} achievements`
            : leaderboard.data
              ? `${formatDate(leaderboard.data.from)} to ${formatDate(leaderboard.data.to)}`
              : ''
        }
        onClear={
          filtersActive
            ? () => navigate({ search: { tab: search.tab, page: 1 }, replace: true })
            : undefined
        }
      >
        {search.tab === 'all' && (
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Student, event or team'
            label='Search achievements'
          />
        )}
        <FilterSelect
          id='activity-category'
          label='Filter by activity'
          allLabel='All activities (not studies)'
          value={search.category}
          options={pairs(CATEGORY_FILTER_LABELS).filter((item) => item.value !== 'non_academic')}
          onChange={(value) => setSearch({ category: value as CategoryFilter | undefined })}
        />
        <FilterSelect
          id='activity-class'
          label='Filter by class'
          allLabel='All classes'
          value={search.class_id ? String(search.class_id) : undefined}
          options={(classes.data ?? []).map((item) => ({
            value: String(item.id),
            label: `Class ${item.name}`,
          }))}
          onChange={(value) =>
            setSearch({ class_id: value ? Number(value) : undefined, section_id: undefined })
          }
        />
        {search.class_id && (
          <FilterSelect
            id='activity-section'
            label='Filter by section'
            allLabel='All sections'
            value={search.section_id ? String(search.section_id) : undefined}
            options={(sections.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Section ${item.name}`,
            }))}
            onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
          />
        )}
        {search.tab === 'all' && (
          <>
            <FilterSelect
              id='activity-result'
              label='Filter by result'
              allLabel='Any result'
              value={search.result}
              options={[
                { value: 'podium', label: 'Top 3 (won a place)' },
                ...pairs(RESULT_LABELS),
              ]}
              onChange={(value) => setSearch({ result: value })}
            />
            <FilterSelect
              id='activity-scope'
              label='Filter by event'
              allLabel='Any event'
              value={search.event_scope}
              options={pairs(SCOPE_LABELS)}
              onChange={(value) => setSearch({ event_scope: value })}
            />
            <FilterSelect
              id='activity-venue'
              label='Filter by indoor or outdoor'
              allLabel='Indoor and outdoor'
              value={search.venue_type}
              options={pairs(VENUE_LABELS)}
              onChange={(value) => setSearch({ venue_type: value })}
            />
            <FilterSelect
              id='activity-participation'
              label='Filter by team or individual'
              allLabel='Team and individual'
              value={search.participation}
              options={pairs(PARTICIPATION_LABELS)}
              onChange={(value) => setSearch({ participation: value })}
            />
          </>
        )}
      </ListToolbar>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>
            {search.tab === 'leaderboard'
              ? 'Leaderboard'
              : search.tab === 'on_duty'
                ? 'Sports On Duty (OD)'
                : 'All achievements'}
          </h2>
          <span className='text-xs text-muted-foreground'>
            {search.tab === 'all' && list.data
              ? `${list.data.total} achievements`
              : search.tab === 'on_duty' && odList.data
                ? `${odList.data.length} on duty`
                : leaderboard.data
                  ? `${formatDate(leaderboard.data.from)} to ${formatDate(leaderboard.data.to)}`
                  : ''}
          </span>
        </div>
        {search.tab === 'leaderboard' ? (
          <LeaderboardView
            rows={leaderboard.data?.rows ?? []}
            loading={leaderboard.isFetching}
            error={leaderboard.isError ? leaderboard.error.message : null}
            onRetry={() => void leaderboard.refetch()}
            title={CATEGORY_FILTER_LABELS[category]}
          />
        ) : search.tab === 'on_duty' ? (
          <SportsOnDutyView
            rows={odList.data ?? []}
            loading={odList.isFetching}
            error={odList.isError ? odList.error.message : null}
            onRetry={() => void odList.refetch()}
            onDelete={(row) => setRemovingOd(row)}
          />
        ) : (
          <DataTable
            rows={list.data?.items ?? []}
            columns={achievementColumns}
            rowKey={(row) => row.id}
            loading={list.isFetching}
            error={list.isError ? list.error.message : null}
            onRetry={() => void list.refetch()}
            empty={{
              icon: Award,
              title: filtersActive ? 'No achievements match' : 'No achievements yet',
              description: filtersActive
                ? 'Change or clear the filters.'
                : 'Add them from a student’s Achievements tab or the Staff app.',
            }}
            card={(row) => <AchievementCard row={row} />}
            pagination={
              list.data
                ? {
                    page: search.page,
                    limit: list.data.limit,
                    total: list.data.total,
                    label: 'achievements',
                    onPageChange: (page) =>
                      navigate({ search: (prev) => ({ ...prev, page }), replace: true }),
                  }
                : undefined
            }
          />
        )}
      </Card>
      {addingOd && <SportsOnDutyModal onClose={() => setAddingOd(false)} />}
      <ConfirmDialog
        open={Boolean(removingOd)}
        title='Cancel Sports On Duty?'
        description={`Are you sure you want to remove ${removingOd?.student.name} from On Duty for ${removingOd?.title}?`}
        confirmText='Cancel OD'
        destructive
        loading={removeOd.isPending}
        onOpenChange={(open) => !open && setRemovingOd(null)}
        onConfirm={async () => {
          if (!removingOd) return
          try {
            await removeOd.mutateAsync(removingOd.id)
            setRemovingOd(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </Page>
  )
}

function LeaderboardView({
  rows,
  loading,
  error,
  onRetry,
  title,
}: {
  rows: LeaderboardRow[]
  loading: boolean
  error: string | null
  onRetry: () => void
  title: string
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalRows = rows.length
  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  )

  return (
    <div className='grid'>
      <div className='border-b p-4'>
        <ActivityPodium
          rows={rows.filter((row) => row.rank <= 3).slice(0, 3)}
          title={title}
          loading={loading && !rows.length}
        />
      </div>
      <DataTable
        rows={paginatedRows}
        columns={leaderboardColumns}
        rowKey={(row) => row.student.id}
        loading={loading}
        error={error}
        onRetry={onRetry}
        pagination={{
          page: currentPage,
          limit: pageSize,
          total: totalRows,
          label: 'students',
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setPageSize(newLimit)
            setPage(1)
          },
          limitOptions: [10, 20, 25, 50],
        }}
        empty={{
          icon: Users,
          title: 'No one on the board yet',
          description: 'Students appear here once they have achievements this academic year.',
        }}
        card={(row) => (
          <div className='table-typography flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              <RankBadge rank={row.rank} />
              <StudentCell student={row.student} />
            </div>
            <span className='tabular shrink-0 text-[13px] font-bold text-slate-900 dark:text-slate-100'>
              {row.points} pts
            </span>
          </div>
        )}
      />
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300'
      : rank === 2
        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/50 dark:text-blue-300'
        : rank === 3
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/50 dark:text-rose-300'
          : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold tabular-nums ${tone}`}
      aria-label={`Rank ${rank}`}
    >
      {rank <= 3 && <Medal className='size-3.5' />}
      #{rank}
    </span>
  )
}

const leaderboardColumns: Column<LeaderboardRow>[] = [
  { key: 'rank', header: 'RANK', cell: (row) => <RankBadge rank={row.rank} /> },
  { key: 'student', header: 'STUDENT ⇅', cell: (row) => <StudentCell student={row.student} /> },
  {
    key: 'points',
    header: 'POINTS',
    align: 'right',
    cell: (row) => (
      <span className='tabular text-[13px] font-bold text-slate-900 dark:text-slate-100'>
        {row.points}
      </span>
    ),
  },
  {
    key: 'wins',
    header: 'WINS',
    align: 'right',
    cell: (row) => (
      <span className='tabular text-[13px] text-slate-700 dark:text-slate-300'>{row.wins}</span>
    ),
  },
  {
    key: 'podiums',
    header: 'TOP 3 FINISHES',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => (
      <span className='tabular text-[13px] text-slate-700 dark:text-slate-300'>{row.podiums}</span>
    ),
  },
  {
    key: 'outside',
    header: 'OUTSIDE SCHOOL',
    align: 'right',
    hideBelow: 'xl',
    cell: (row) => (
      <span className='tabular text-[13px] text-slate-700 dark:text-slate-300'>
        {row.outside_events}
      </span>
    ),
  },
  {
    key: 'achievements',
    header: 'ENTRIES',
    align: 'right',
    hideBelow: 'xl',
    cell: (row) => (
      <span className='tabular text-[13px] text-slate-700 dark:text-slate-300'>
        {row.achievements}
      </span>
    ),
  },
  {
    key: 'best',
    header: 'BEST LEVEL',
    cell: (row) => (
      <StatusPill tone={toPillTone(LEVEL_TONE[row.best_level])} label={LEVEL_LABELS[row.best_level]} />
    ),
  },
]

const achievementColumns: Column<SchoolAchievement>[] = [
  { key: 'student', header: 'STUDENT ⇅', cell: (row) => <StudentCell student={row.student} /> },
  {
    key: 'title',
    header: 'ACHIEVEMENT',
    cell: (row) => (
      <div className='grid min-w-0 gap-0.5'>
        <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
          {row.title}
        </span>
        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {[
            CATEGORY_LABELS[row.category],
            row.venue_type ? VENUE_LABELS[row.venue_type] : null,
            row.participation === 'team' ? (row.team_name ?? 'Team') : 'Individual',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    ),
  },
  {
    key: 'event',
    header: 'EVENT',
    hideBelow: 'lg',
    cell: (row) => (
      <div className='grid justify-items-start gap-1'>
        <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
          {SCOPE_LABELS[row.event_scope]}
        </span>
        <StatusPill tone={toPillTone(LEVEL_TONE[row.level])} label={LEVEL_LABELS[row.level]} />
      </div>
    ),
  },
  {
    key: 'result',
    header: 'RESULT',
    cell: (row) => (
      <StatusPill tone={toPillTone(RESULT_TONE[row.result])} label={RESULT_LABELS[row.result]} />
    ),
  },
  {
    key: 'prizes',
    header: 'PRIZES',
    hideBelow: 'xl',
    cell: (row) => (
      <div className='grid max-w-56 text-[12px] leading-[16px] text-slate-600 dark:text-slate-400'>
        {row.prize_received && <span className='truncate'>Won: {row.prize_received}</span>}
        {row.school_reward && <span className='truncate'>School: {row.school_reward}</span>}
        {!row.prize_received && !row.school_reward && <span className='text-slate-400'>—</span>}
      </div>
    ),
  },
  {
    key: 'points',
    header: 'POINTS',
    align: 'right',
    cell: (row) => (
      <span className='tabular text-[13px] font-bold text-slate-900 dark:text-slate-100'>
        {row.points}
      </span>
    ),
  },
  {
    key: 'date',
    header: 'DATE',
    hideBelow: 'lg',
    cell: (row) => (
      <span className='text-[12px] leading-[16px] whitespace-nowrap text-slate-500 dark:text-slate-400'>
        {formatDate(row.achieved_on)}
      </span>
    ),
  },
]

function AchievementCard({ row }: { row: SchoolAchievement }) {
  return (
    <div className='table-typography grid gap-2'>
      <div className='flex items-start justify-between gap-2'>
        <StudentCell student={row.student} />
        <span className='tabular shrink-0 text-[13px] font-bold text-slate-900 dark:text-slate-100'>
          {row.points} pts
        </span>
      </div>
      <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
        {row.title}
      </span>
      <div className='flex flex-wrap gap-1.5'>
        <StatusPill tone={toPillTone(RESULT_TONE[row.result])} label={RESULT_LABELS[row.result]} />
        <StatusPill tone={toPillTone(LEVEL_TONE[row.level])} label={LEVEL_LABELS[row.level]} />
        <StatusPill tone='neutral' label={SCOPE_LABELS[row.event_scope]} />
        {row.venue_type && <StatusPill tone='neutral' label={VENUE_LABELS[row.venue_type]} />}
      </div>
      <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
        {formatDate(row.achieved_on)}
      </span>
    </div>
  )
}

function SportsOnDutyView({
  rows,
  loading,
  error,
  onRetry,
  onDelete,
}: {
  rows: SportsOnDuty[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onDelete: (row: SportsOnDuty) => void
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalRows = rows.length
  const maxPage = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, maxPage)
  const paginatedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  )

  const columns: Column<SportsOnDuty>[] = [
    {
      key: 'student',
      header: 'STUDENT ⇅',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.student.name}
          </span>
          <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {[row.student.section_name, row.student.admission_no].filter(Boolean).join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'sport',
      header: 'SPORT & EVENT',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {row.title}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {row.sport_name}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'DATES',
      cell: (row) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
            {formatDate(row.from_date)}
            {row.to_date !== row.from_date ? ` – ${formatDate(row.to_date)}` : ''}
          </span>
          <span className='text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
            {row.session === 'morning'
              ? 'Morning only'
              : row.session === 'afternoon'
                ? 'Afternoon only'
                : 'Full day'}
          </span>
        </div>
      ),
    },
    {
      key: 'venue',
      header: 'VENUE',
      cell: (row) => (
        <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          {row.venue ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      cell: (row) => (
        <Button
          size='icon-sm'
          variant='ghost'
          title='Cancel sports OD'
          aria-label='Cancel sports OD'
          className='text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
          onClick={() => onDelete(row)}
        >
          <Trash2 className='size-4' />
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      rows={paginatedRows}
      columns={columns}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      pagination={{
        page: currentPage,
        limit: pageSize,
        total: totalRows,
        label: 'entries',
        onPageChange: (newPage) => setPage(newPage),
        onLimitChange: (newLimit) => {
          setPageSize(newLimit)
          setPage(1)
        },
        limitOptions: [10, 20, 25, 50],
      }}
      empty={{
        icon: Medal,
        title: 'No students on Sports OD',
        description:
          'Map students participating in sports tournaments or meets to mark them On Duty.',
      }}
      card={(row) => (
        <div className='table-typography flex items-center justify-between gap-3'>
          <div className='grid min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {row.student.name}
            </span>
            <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {row.sport_name} · {row.title}
            </span>
            <span className='text-[12px] leading-[16px] text-slate-400 dark:text-slate-500'>
              {formatDate(row.from_date)} – {formatDate(row.to_date)}
            </span>
          </div>
          <Button
            size='icon-sm'
            variant='ghost'
            title='Cancel sports OD'
            aria-label='Cancel sports OD'
            className='text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
            onClick={() => onDelete(row)}
          >
            <Trash2 className='size-4' />
          </Button>
        </div>
      )}
    />
  )
}
