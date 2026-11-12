import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BookOpenCheck, CalendarClock, CircleOff, EyeOff, Send } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  useDiary,
  useDiaryInsights,
  type DiaryEntry,
  type DiaryStatus,
  type DiaryType,
} from '../api'
import { DiarySheet } from '../components/diary-sheet'
import { DIARY_STATUS, DIARY_TYPE } from '../labels'
import type { DiarySearch } from '../search'

const route = getRouteApi('/_app/diary')

const SHOWN_STATUSES: DiaryStatus[] = ['published', 'hidden']
const LIMIT = 20

export function DiaryPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/diary' })
  const me = useMe().data
  const { entry: openId, ...filters } = search
  const diary = useDiary({ ...filters, limit: LIMIT })
  const insights = useDiaryInsights()
  const rows = diary.data?.items ?? []

  const setSearch = (patch: Partial<DiarySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openEntry = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, entry: id }), replace: true })
  const toggleStatus = (status: DiaryStatus) =>
    setSearch({ status: search.status === status ? undefined : status })

  useShortcut('app.refresh', () => {
    void diary.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'published',
      label: 'Published today',
      value: data?.published_today ?? 0,
      hint: `${data?.published ?? 0} this academic year`,
      icon: Send,
      tone: 'success',
      active: search.status === 'published',
      onClick: () => toggleStatus('published'),
    },
    {
      key: 'homework',
      label: 'Homework due this week',
      value: data?.homework_due_this_week ?? 0,
      hint: 'Published homework due in 7 days',
      icon: CalendarClock,
      tone: 'info',
      active: search.type === 'homework' && !search.status,
      onClick: () =>
        setSearch({ type: search.type === 'homework' ? undefined : 'homework', status: undefined }),
    },
    {
      key: 'hidden',
      label: 'Hidden',
      value: data?.hidden ?? 0,
      hint: 'Taken down by the office',
      icon: EyeOff,
      tone: 'danger',
      active: search.status === 'hidden',
      onClick: () => toggleStatus('hidden'),
    },
  ]

  const columns: Column<DiaryEntry>[] = [
    {
      key: 'title',
      header: 'Post',
      cell: (entry) => (
        <span className='grid min-w-0 gap-1'>
          <span className='flex flex-wrap items-center gap-1.5'>
            <Badge tone={DIARY_TYPE[entry.type].tone}>{DIARY_TYPE[entry.type].label}</Badge>
            <span className='font-semibold break-words'>{entry.title}</span>
          </span>
          <span className='line-clamp-1 text-xs text-muted-foreground'>{entry.body}</span>
        </span>
      ),
    },
    {
      key: 'author',
      header: 'Teacher → To',
      cell: (entry) => (
        <span className='grid min-w-0'>
          <span className='font-medium break-words'>{entry.author.name}</span>
          <span className='text-xs text-muted-foreground'>
            to {entry.target_label}
            {entry.subject ? ` · ${entry.subject.name}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Posted',
      sortKey: 'created_at',
      hideBelow: 'lg',
      cell: (entry) => (
        <span className='grid'>
          <span className='tabular text-sm'>{formatDateTime(entry.created_at)}</span>
          {entry.due_date && (
            <span className='text-xs text-muted-foreground'>Due {formatDate(entry.due_date)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'seen',
      header: 'Seen',
      hideBelow: 'xl',
      align: 'right',
      cell: (entry) => (
        <span className='tabular text-sm'>
          {entry.status === 'published' ? `${entry.seen_count}/${entry.recipient_count}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (entry) => (
        <Badge tone={DIARY_STATUS[entry.status].tone} dot>
          {DIARY_STATUS[entry.status].label}
        </Badge>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.status || search.type)

  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Homework'
        description='Homework, remarks, feedback and notes teachers send to parents this academic year. They reach parents at once; hide a post here if parents should not see it.'
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={diary.data ? `${diary.data.total} posts` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Title, message or teacher'
            label='Search homework'
          />
          <FilterSelect
            id='diary-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={SHOWN_STATUSES.map((status) => ({
              value: status,
              label: DIARY_STATUS[status].label,
            }))}
            onChange={(value) => setSearch({ status: value as DiarySearch['status'] })}
          />
          <FilterSelect
            id='diary-type-filter'
            label='Filter by type'
            allLabel='All types'
            value={search.type}
            options={(Object.keys(DIARY_TYPE) as DiaryType[]).map((type) => ({
              value: type,
              label: DIARY_TYPE[type].label,
            }))}
            onChange={(value) => setSearch({ type: value as DiarySearch['type'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(entry) => entry.id}
          loading={diary.isFetching}
          error={diary.isError ? diary.error.message : null}
          onRetry={() => diary.refetch()}
          onRowClick={(entry) => openEntry(entry.id)}
          sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<DiarySearch>)}
          empty={{
            icon: filtered ? CircleOff : BookOpenCheck,
            title: filtered ? 'No posts match these filters' : 'No homework posts yet',
            description: filtered
              ? 'Try another word, or clear the filters.'
              : 'When a teacher posts homework or a remark in the Staff app, it shows up here.',
          }}
          card={(entry) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0 gap-1'>
                  <span className='flex flex-wrap items-center gap-1.5'>
                    <Badge tone={DIARY_TYPE[entry.type].tone}>{DIARY_TYPE[entry.type].label}</Badge>
                    <span className='font-bold break-words'>{entry.title}</span>
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {entry.author.name} → {entry.target_label}
                  </span>
                </span>
                <Badge tone={DIARY_STATUS[entry.status].tone} dot>
                  {DIARY_STATUS[entry.status].label}
                </Badge>
              </div>
              <span className='line-clamp-2 text-sm'>{entry.body}</span>
              <span className='tabular text-xs text-muted-foreground'>
                {formatDateTime(entry.created_at)}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: diary.data?.total ?? 0,
            label: 'posts',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <DiarySheet
        entryId={openId ?? null}
        canModerate={can(me, 'diary.moderate')}
        onClose={() => openEntry(undefined)}
      />
    </Page>
  )
}
