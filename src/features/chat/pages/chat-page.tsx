import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CircleOff,
  Clock,
  Flag,
  MessagesSquare,
  MessageSquareText,
  Plus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import { useChatInsights, useChatThreads, type ChatThread } from '../api'
import { useAcademicYears } from '@/features/setup/api'
import { ChatThreadSheet } from '../components/chat-thread-sheet'
import { ChatGroupModal } from '../components/chat-group-modal'
import type { ChatSearch } from '../search'

const route = getRouteApi('/_app/chat')
const LIMIT = 20

export function ChatPage() {
  const [creatingGroup, setCreatingGroup] = useState(false)
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/chat' })
  const { thread: openId, year, ...filters } = search
  const threads = useChatThreads({ ...filters, academic_year_id: year, limit: LIMIT })
  const years = useAcademicYears().data ?? []
  const current = years.find((item) => item.is_current)
  const pastYears = years
    .filter((item) => current && !item.is_current && item.end_date < current.start_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
  const viewingPast = Boolean(year)
  const insights = useChatInsights()
  const rows = threads.data?.items ?? []

  const setSearch = (patch: Partial<ChatSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const open = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, thread: id }), replace: true })

  useShortcut('app.refresh', () => {
    void threads.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'all',
      label: 'Conversations',
      value: data?.threads ?? 0,
      hint: 'This academic year',
      icon: MessagesSquare,
      tone: 'primary',
      active: !search.flagged,
      onClick: () => setSearch({ flagged: undefined }),
    },
    {
      key: 'reported',
      label: 'Reported messages',
      value: data?.open_flags ?? 0,
      hint: `${data?.hidden ?? 0} hidden so far`,
      icon: Flag,
      tone: 'danger',
      active: Boolean(search.flagged),
      onClick: () => setSearch({ flagged: search.flagged ? undefined : true }),
    },
    {
      key: 'today',
      label: 'Active today',
      value: data?.active_today ?? 0,
      hint: `${data?.messages_today ?? 0} messages today`,
      icon: MessageSquareText,
      tone: 'success',
    },
    {
      key: 'held',
      label: 'Waiting for office hours',
      value: data?.held ?? 0,
      hint: 'Parent messages sent after hours',
      icon: Clock,
      tone: 'warning',
    },
  ]

  const columns: Column<ChatThread>[] = [
    {
      key: 'people',
      header: 'Conversation',
      cell: (row) =>
        row.is_group ? (
          <span className='grid min-w-0'>
            <span className='flex items-center gap-1.5 font-semibold break-words'>
              <Users className='size-4 shrink-0 text-primary' />
              {row.title || 'Group chat'}
            </span>
            <span className='text-xs text-muted-foreground'>Group conversation</span>
          </span>
        ) : (
          <span className='grid min-w-0'>
            <span className='font-semibold break-words'>
              {row.teacher?.name ?? '—'} ↔ {row.parent?.name ?? '—'}
            </span>
            <span className='text-xs text-muted-foreground capitalize'>
              {row.parent?.label ?? 'Parent'}
            </span>
          </span>
        ),
    },
    {
      key: 'student',
      header: 'About',
      cell: (row) =>
        row.is_group ? (
          <span className='grid min-w-0'>
            <span className='font-medium break-words'>{row.member_count ?? 0} members</span>
            <Badge tone='info' className='mt-0.5 w-fit text-[10px]'>
              Group
            </Badge>
          </span>
        ) : (
          <span className='grid min-w-0'>
            <span className='font-medium break-words'>{row.student?.name ?? '—'}</span>
            <span className='text-xs text-muted-foreground'>
              {row.class_section ?? 'Not placed'}
            </span>
          </span>
        ),
    },
    {
      key: 'last',
      header: 'Last message',
      sortKey: 'last_message_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='line-clamp-1 text-sm'>{row.last_message_preview ?? '—'}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatDateTime(row.last_message_at)}
          </span>
        </span>
      ),
    },
    {
      key: 'count',
      header: 'Messages',
      sortKey: 'message_count',
      hideBelow: 'xl',
      align: 'right',
      cell: (row) => <span className='tabular text-sm'>{row.message_count}</span>,
    },
    {
      key: 'flags',
      header: 'Reports',
      sortKey: 'open_flags',
      cell: (row) =>
        row.open_flags ? (
          <Badge tone='danger' dot>
            {row.open_flags} reported
          </Badge>
        ) : (
          <Badge tone='neutral'>None</Badge>
        ),
    },
  ]

  const filtered = Boolean(search.search || search.flagged || search.year)

  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Chat audit'
        description='Teacher and parent conversations by academic year. Read them, handle reported messages and hide what does not belong. Every visit is recorded.'
        actions={
          <Button onClick={() => setCreatingGroup(true)}>
            <Plus className='size-4' />
            Create group
          </Button>
        }
      />

      {viewingPast && (
        <p className='rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'>
          Archived year: these conversations are hidden from the Staff and Parent apps so every year
          starts fresh. Only the office can read them here. They are deleted for good 2 years after
          that academic year ends.
        </p>
      )}

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={threads.data ? `${threads.data.total} conversations` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Group name, teacher, parent or student'
            label='Search conversations'
          />
          <FilterSelect
            id='chat-year-filter'
            label='Academic year'
            allLabel={current ? `This year (${current.name})` : 'This year'}
            value={year ? String(year) : undefined}
            options={pastYears.map((item) => ({
              value: String(item.id),
              label: `${item.name} (archived)`,
            }))}
            onChange={(value) =>
              setSearch({ year: value ? Number(value) : undefined, thread: undefined })
            }
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={threads.isFetching}
          error={threads.isError ? threads.error.message : null}
          onRetry={() => threads.refetch()}
          onRowClick={(row) => open(row.id)}
          sort={{ sort: search.sort ?? 'last_message_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<ChatSearch>)}
          empty={{
            icon: filtered ? CircleOff : MessagesSquare,
            title: filtered ? 'No conversations match' : 'No conversations yet',
            description: filtered
              ? 'Try another name, or clear the filters.'
              : 'When a teacher and a parent start chatting in the app, the conversation shows up here.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='flex items-center gap-1.5 font-bold break-words'>
                  {row.is_group ? (
                    <>
                      <Users className='size-4 shrink-0 text-primary' />
                      {row.title || 'Group chat'}
                    </>
                  ) : (
                    `${row.teacher?.name ?? '—'} ↔ ${row.parent?.name ?? '—'}`
                  )}
                </span>
                {row.open_flags > 0 && (
                  <Badge tone='danger' dot>
                    {row.open_flags}
                  </Badge>
                )}
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.is_group
                  ? `${row.member_count ?? 0} members · ${row.message_count} messages`
                  : `About ${row.student?.name ?? '—'} · ${row.message_count} messages`}
              </span>
              <span className='line-clamp-1 text-sm'>{row.last_message_preview ?? ''}</span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: threads.data?.total ?? 0,
            label: 'conversations',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <ChatThreadSheet threadId={openId ?? null} onClose={() => open(undefined)} />

      <ChatGroupModal
        open={creatingGroup}
        onClose={() => setCreatingGroup(false)}
        onCreated={(id) => open(id)}
      />
    </Page>
  )
}
