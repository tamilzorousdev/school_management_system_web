import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Award, CalendarDays, Globe2, Medal, MountainSnow, Plus, Trash2, Trophy, Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
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

function StudentCell({ student }: { student: SchoolAchievement['student'] }) {
  return (
    <div className='grid min-w-0'>
      <Link
        to='/students/$studentId'
        params={{ studentId: String(student.id) }}
        search={{ tab: 'achievements' }}
        className='truncate font-bold hover:underline'
      >
        {student.name}
      </Link>
      <span className='truncate text-xs text-muted-foreground'>
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
        action={
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
          { value: 'on_duty', label: 'On Duty (OD)', icon: CalendarDays, count: odList.data?.length },
        ]}
      />
      <InsightCards items={cards} loading={!counts} />
      <Card className='overflow-hidden'>
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
        confirmTone='destructive'
        isConfirming={removeOd.isPending}
        onCancel={() => setRemovingOd(null)}
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
  return (
    <div className='grid gap-4 p-4'>
      <ActivityPodium
        rows={rows.filter((row) => row.rank <= 3).slice(0, 3)}
        title={title}
        loading={loading && !rows.length}
      />
      <DataTable
        rows={rows}
        columns={leaderboardColumns}
        rowKey={(row) => row.student.id}
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={{
          icon: Users,
          title: 'No one on the board yet',
          description: 'Students appear here once they have achievements this academic year.',
        }}
        card={(row) => (
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              <RankBadge rank={row.rank} />
              <StudentCell student={row.student} />
            </div>
            <span className='tabular shrink-0 font-extrabold'>{row.points} pts</span>
          </div>
        )}
      />
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'border-warning/50 bg-warning/15 text-warning'
      : rank === 2
        ? 'border-info/40 bg-info/10 text-info'
        : rank === 3
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-border text-muted-foreground'
  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-extrabold ${tone}`}
      aria-label={`Rank ${rank}`}
    >
      {rank <= 3 && <Medal className='size-3.5' />}
      {rank}
    </span>
  )
}

const leaderboardColumns: Column<LeaderboardRow>[] = [
  { key: 'rank', header: 'Rank', cell: (row) => <RankBadge rank={row.rank} /> },
  { key: 'student', header: 'Student', cell: (row) => <StudentCell student={row.student} /> },
  {
    key: 'points',
    header: 'Points',
    align: 'right',
    cell: (row) => <span className='tabular font-extrabold'>{row.points}</span>,
  },
  {
    key: 'wins',
    header: 'Wins',
    align: 'right',
    cell: (row) => <span className='tabular'>{row.wins}</span>,
  },
  {
    key: 'podiums',
    header: 'Top 3 finishes',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => <span className='tabular'>{row.podiums}</span>,
  },
  {
    key: 'outside',
    header: 'Outside school',
    align: 'right',
    hideBelow: 'xl',
    cell: (row) => <span className='tabular'>{row.outside_events}</span>,
  },
  {
    key: 'achievements',
    header: 'Entries',
    align: 'right',
    hideBelow: 'xl',
    cell: (row) => <span className='tabular'>{row.achievements}</span>,
  },
  {
    key: 'best',
    header: 'Best level',
    cell: (row) => <Badge tone={LEVEL_TONE[row.best_level]}>{LEVEL_LABELS[row.best_level]}</Badge>,
  },
]

const achievementColumns: Column<SchoolAchievement>[] = [
  { key: 'student', header: 'Student', cell: (row) => <StudentCell student={row.student} /> },
  {
    key: 'title',
    header: 'Achievement',
    cell: (row) => (
      <div className='grid min-w-0 gap-0.5'>
        <span className='truncate font-semibold'>{row.title}</span>
        <span className='truncate text-xs text-muted-foreground'>
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
    header: 'Event',
    hideBelow: 'lg',
    cell: (row) => (
      <div className='grid justify-items-start gap-1'>
        <span className='text-sm'>{SCOPE_LABELS[row.event_scope]}</span>
        <Badge tone={LEVEL_TONE[row.level]}>{LEVEL_LABELS[row.level]}</Badge>
      </div>
    ),
  },
  {
    key: 'result',
    header: 'Result',
    cell: (row) => <Badge tone={RESULT_TONE[row.result]}>{RESULT_LABELS[row.result]}</Badge>,
  },
  {
    key: 'prizes',
    header: 'Prizes',
    hideBelow: 'xl',
    cell: (row) => (
      <div className='grid max-w-56 text-xs'>
        {row.prize_received && <span className='truncate'>Won: {row.prize_received}</span>}
        {row.school_reward && <span className='truncate'>School: {row.school_reward}</span>}
        {!row.prize_received && !row.school_reward && (
          <span className='text-muted-foreground'>—</span>
        )}
      </div>
    ),
  },
  {
    key: 'points',
    header: 'Points',
    align: 'right',
    cell: (row) => <span className='tabular font-bold'>{row.points}</span>,
  },
  {
    key: 'date',
    header: 'Date',
    hideBelow: 'lg',
    cell: (row) => <span className='text-sm whitespace-nowrap'>{formatDate(row.achieved_on)}</span>,
  },
]

function AchievementCard({ row }: { row: SchoolAchievement }) {
  return (
    <div className='grid gap-2'>
      <div className='flex items-start justify-between gap-2'>
        <StudentCell student={row.student} />
        <span className='tabular shrink-0 font-bold'>{row.points} pts</span>
      </div>
      <span className='font-semibold'>{row.title}</span>
      <div className='flex flex-wrap gap-1.5'>
        <Badge tone={RESULT_TONE[row.result]}>{RESULT_LABELS[row.result]}</Badge>
        <Badge tone={LEVEL_TONE[row.level]}>{LEVEL_LABELS[row.level]}</Badge>
        <Badge tone='neutral'>{SCOPE_LABELS[row.event_scope]}</Badge>
        {row.venue_type && <Badge tone='neutral'>{VENUE_LABELS[row.venue_type]}</Badge>}
      </div>
      <span className='text-xs text-muted-foreground'>{formatDate(row.achieved_on)}</span>
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
  const columns: Column<SportsOnDuty>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{row.student.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {[row.student.section_name, row.student.admission_no].filter(Boolean).join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'sport',
      header: 'Sport & Event',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.title}</span>
          <span className='text-xs text-muted-foreground'>{row.sport_name}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (row) => (
        <div className='grid text-xs'>
          <span className='font-medium'>
            {formatDate(row.from_date)}
            {row.to_date !== row.from_date ? ` – ${formatDate(row.to_date)}` : ''}
          </span>
          <span className='text-muted-foreground'>
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
      header: 'Venue',
      cell: (row) => <span className='text-xs text-muted-foreground'>{row.venue ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label='Cancel sports OD'
          className='text-destructive hover:bg-destructive/10'
          onClick={() => onDelete(row)}
        >
          <Trash2 />
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={{
        icon: Medal,
        title: 'No students on Sports OD',
        description: 'Map students participating in sports tournaments or meets to mark them On Duty.',
      }}
      card={(row) => (
        <div className='flex items-center justify-between gap-3 p-3'>
          <div className='grid min-w-0'>
            <span className='truncate font-bold'>{row.student.name}</span>
            <span className='truncate text-xs text-muted-foreground'>
              {row.sport_name} · {row.title}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatDate(row.from_date)} – {formatDate(row.to_date)}
            </span>
          </div>
          <Button
            size='icon-sm'
            variant='ghost'
            aria-label='Cancel sports OD'
            className='text-destructive hover:bg-destructive/10'
            onClick={() => onDelete(row)}
          >
            <Trash2 />
          </Button>
        </div>
      )}
    />
  )
}
