import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CalendarClock, CircleOff, FilePen, Megaphone, Plus, Siren } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDateTime } from '@/lib/format'
import {
  useAnnouncementInsights,
  useAnnouncements,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementStatus,
} from '../api'
import { AnnouncementForm } from '../components/announcement-form'
import { AnnouncementSheet } from '../components/announcement-sheet'
import { ANNOUNCEMENT_STATUS, AUDIENCE_LABEL } from '../labels'
import type { AnnouncementsSearch } from '../search'

const route = getRouteApi('/_app/announcements')
const LIMIT = 20

export function AnnouncementsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/announcements' })
  const me = useMe().data
  const canManage = can(me, 'announcements.manage')
  const { announcement: openId, ...filters } = search
  const list = useAnnouncements({ ...filters, limit: LIMIT })
  const insights = useAnnouncementInsights()
  const rows = list.data?.items ?? []
  const [editing, setEditing] = useState<Announcement | null | undefined>(undefined)

  const setSearch = (patch: Partial<AnnouncementsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const open = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, announcement: id }), replace: true })
  const toggleStatus = (status: AnnouncementStatus) =>
    setSearch({ status: search.status === status ? undefined : status, priority: undefined })

  useShortcut('app.refresh', () => {
    void list.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'published',
      label: 'Published',
      value: data?.published ?? 0,
      hint: `${data?.average_read_percent ?? 0}% read on average`,
      icon: Megaphone,
      tone: 'success',
      active: search.status === 'published' && !search.priority,
      onClick: () => toggleStatus('published'),
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: data?.scheduled ?? 0,
      hint: 'Will go out by themselves',
      icon: CalendarClock,
      tone: 'info',
      active: search.status === 'scheduled',
      onClick: () => toggleStatus('scheduled'),
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: data?.drafts ?? 0,
      hint: `${data?.archived ?? 0} archived`,
      icon: FilePen,
      tone: 'neutral',
      active: search.status === 'draft',
      onClick: () => toggleStatus('draft'),
    },
    {
      key: 'urgent',
      label: 'Urgent and live',
      value: data?.urgent_live ?? 0,
      hint: 'SMS when push fails',
      icon: Siren,
      tone: 'danger',
      active: search.priority === 'urgent',
      onClick: () =>
        setSearch({
          priority: search.priority === 'urgent' ? undefined : 'urgent',
          status: search.priority === 'urgent' ? undefined : 'published',
        }),
    },
  ]

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      header: 'Announcement',
      sortKey: 'title',
      cell: (row) => (
        <span className='grid min-w-0 gap-1'>
          <span className='flex flex-wrap items-center gap-1.5'>
            {row.priority === 'urgent' && <Badge tone='danger'>Urgent</Badge>}
            <span className='font-semibold break-words'>{row.title}</span>
          </span>
          <span className='line-clamp-1 text-xs text-muted-foreground'>{row.body}</span>
        </span>
      ),
    },
    {
      key: 'audience',
      header: 'Sent to',
      cell: (row) => <span className='text-sm break-words'>{row.audience_label}</span>,
    },
    {
      key: 'when',
      header: 'When',
      sortKey: 'published_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular text-sm'>
          {row.published_at
            ? formatDateTime(row.published_at)
            : row.publish_at
              ? `Sends ${formatDateTime(row.publish_at)}`
              : 'Not sent'}
        </span>
      ),
    },
    {
      key: 'read',
      header: 'Read',
      hideBelow: 'xl',
      align: 'right',
      cell: (row) =>
        row.recipient_count ? (
          <span className='tabular text-sm'>
            {row.read_count}/{row.recipient_count} · {row.read_percent}%
          </span>
        ) : (
          <span className='text-sm text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (row) => (
        <Badge tone={ANNOUNCEMENT_STATUS[row.status].tone} dot>
          {ANNOUNCEMENT_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.status || search.audience || search.priority)
  const newButton = canManage && (
    <Button onClick={() => setEditing(null)}>
      <Plus />
      New announcement
    </Button>
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Announcements'
        description='Notices to parents, staff or chosen classes this academic year. See who has read each one.'
        actions={newButton}
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} announcements` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Title or text'
            label='Search announcements'
          />
          <FilterSelect
            id='announcement-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={(Object.keys(ANNOUNCEMENT_STATUS) as AnnouncementStatus[]).map((status) => ({
              value: status,
              label: ANNOUNCEMENT_STATUS[status].label,
            }))}
            onChange={(value) => setSearch({ status: value as AnnouncementsSearch['status'] })}
          />
          <FilterSelect
            id='announcement-audience-filter'
            label='Filter by audience'
            allLabel='Any audience'
            value={search.audience}
            options={(Object.keys(AUDIENCE_LABEL) as AnnouncementAudience[]).map((audience) => ({
              value: audience,
              label: AUDIENCE_LABEL[audience],
            }))}
            onChange={(value) => setSearch({ audience: value as AnnouncementsSearch['audience'] })}
          />
          <FilterSelect
            id='announcement-priority-filter'
            label='Filter by priority'
            allLabel='Any priority'
            value={search.priority}
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'normal', label: 'Normal' },
            ]}
            onChange={(value) => setSearch({ priority: value as AnnouncementsSearch['priority'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isFetching}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          onRowClick={(row) => open(row.id)}
          sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<AnnouncementsSearch>)}
          empty={{
            icon: filtered ? CircleOff : Megaphone,
            title: filtered ? 'No announcements match these filters' : 'No announcements yet',
            description: filtered
              ? 'Try another word, or clear the filters.'
              : 'Write the first one for parents or staff.',
            action: filtered ? undefined : newButton || undefined,
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0 gap-1'>
                  <span className='flex flex-wrap items-center gap-1.5'>
                    {row.priority === 'urgent' && <Badge tone='danger'>Urgent</Badge>}
                    <span className='font-bold break-words'>{row.title}</span>
                  </span>
                  <span className='text-xs text-muted-foreground'>{row.audience_label}</span>
                </span>
                <Badge tone={ANNOUNCEMENT_STATUS[row.status].tone} dot>
                  {ANNOUNCEMENT_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='line-clamp-2 text-sm'>{row.body}</span>
              {row.recipient_count > 0 && (
                <span className='tabular text-xs text-muted-foreground'>
                  Read by {row.read_count} of {row.recipient_count}
                </span>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: list.data?.total ?? 0,
            label: 'announcements',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <AnnouncementSheet
        announcementId={openId ?? null}
        canManage={canManage}
        onEdit={(row) => {
          open(undefined)
          setEditing(row)
        }}
        onClose={() => open(undefined)}
      />
      {editing !== undefined && (
        <AnnouncementForm
          announcement={editing}
          onOpenChange={(value) => !value && setEditing(undefined)}
        />
      )}
    </Page>
  )
}
