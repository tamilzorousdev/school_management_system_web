import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CalendarClock, CalendarDays, CircleOff, Radio, UserX, Video } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDateTime, formatTime } from '@/lib/format'
import { useMeetingInsights, useMeetings, type Meeting, type MeetingStatus } from '../api'
import { MeetingPeople } from '../components/meeting-people'
import { MeetingSheet } from '../components/meeting-sheet'
import { durationLabel, isLive, MEETING_RESPONSE, MEETING_STATUS } from '../labels'
import type { MeetingsSearch } from '../search'

const route = getRouteApi('/_app/meetings')
const LIMIT = 20

export function MeetingsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/meetings' })
  const { meeting: openId, ...filters } = search
  const meetings = useMeetings({ ...filters, limit: LIMIT })
  const insights = useMeetingInsights()
  const rows = meetings.data?.items ?? []

  const setSearch = (patch: Partial<MeetingsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openMeeting = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, meeting: id }), replace: true })

  useShortcut('app.refresh', () => {
    void meetings.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const toggleStatus = (status: MeetingStatus) =>
    setSearch({ status: search.status === status ? undefined : status, when: undefined })
  const cards: Insight[] = [
    {
      key: 'today',
      label: 'Today',
      value: data?.today ?? 0,
      hint: `${data?.total ?? 0} booked in all`,
      icon: CalendarDays,
      tone: 'primary',
      active: search.when === 'today',
      onClick: () =>
        setSearch({ when: search.when === 'today' ? undefined : 'today', status: undefined }),
    },
    {
      key: 'upcoming',
      label: 'Coming up',
      value: data?.upcoming ?? 0,
      hint: 'Booked and not started',
      icon: CalendarClock,
      tone: 'info',
      active: search.when === 'upcoming',
      onClick: () =>
        setSearch({ when: search.when === 'upcoming' ? undefined : 'upcoming', status: undefined }),
    },
    {
      key: 'live',
      label: 'Live now',
      value: data?.live ?? 0,
      hint: `${data?.time_exceeded ?? 0} over time · ${data?.completed ?? 0} completed`,
      icon: Radio,
      tone: 'success',
      active: search.status === 'in_progress',
      onClick: () => toggleStatus('in_progress'),
    },
    {
      key: 'missed',
      label: 'Missed',
      value: data?.missed ?? 0,
      hint: `Nobody joined · ${data?.cancelled ?? 0} cancelled`,
      icon: UserX,
      tone: 'warning',
      active: search.status === 'missed',
      onClick: () => toggleStatus('missed'),
    },
  ]

  const columns: Column<Meeting>[] = [
    {
      key: 'when',
      header: 'When',
      sortKey: 'scheduled_at',
      cell: (meeting) => (
        <span className='grid'>
          <span className='tabular font-semibold'>{formatDateTime(meeting.scheduled_at)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            to {formatTime(meeting.ends_at)} · {durationLabel(meeting.duration_minutes)}
          </span>
        </span>
      ),
    },
    {
      key: 'people',
      header: 'From → To',
      cell: (meeting) => <MeetingPeople meeting={meeting} />,
    },
    {
      key: 'student',
      header: 'Student',
      cell: (meeting) => (
        <span className='grid min-w-0'>
          <span className='truncate font-medium'>{meeting.student.name}</span>
          <span className='text-xs text-muted-foreground'>
            {meeting.student.class_section ?? 'Not placed'}
          </span>
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Topic',
      sortKey: 'title',
      hideBelow: 'xl',
      cell: (meeting) => <span className='line-clamp-2'>{meeting.title}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (meeting) => <StatusBadge meeting={meeting} />,
    },
    {
      key: 'call',
      header: 'Call',
      hideBelow: 'lg',
      align: 'right',
      cell: (meeting) => (
        <span className='tabular text-sm'>{durationLabel(meeting.call_minutes)}</span>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.status || search.when || search.scheduled_by)

  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Meetings'
        description='Video meetings between teachers and parents. They are booked and joined in the mobile app; this page shows who booked whom, when, and how the call went.'
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={meetings.data ? `${meetings.data.total} meetings` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Topic, teacher, parent or student'
            label='Search meetings'
          />
          <FilterSelect
            id='status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={(Object.keys(MEETING_STATUS) as MeetingStatus[]).map((status) => ({
              value: status,
              label: MEETING_STATUS[status].label,
            }))}
            onChange={(value) =>
              setSearch({ status: value as MeetingsSearch['status'], when: undefined })
            }
          />
          <FilterSelect
            id='booked-by-filter'
            label='Filter by who booked'
            allLabel='Booked by anyone'
            value={search.scheduled_by}
            options={[
              { value: 'teacher', label: 'Booked by a teacher' },
              { value: 'parent', label: 'Booked by a parent' },
            ]}
            onChange={(value) =>
              setSearch({ scheduled_by: value as MeetingsSearch['scheduled_by'] })
            }
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(meeting) => meeting.id}
          loading={meetings.isFetching}
          error={meetings.isError ? meetings.error.message : null}
          onRetry={() => meetings.refetch()}
          onRowClick={(meeting) => openMeeting(meeting.id)}
          sort={{ sort: search.sort ?? 'scheduled_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<MeetingsSearch>)}
          empty={{
            icon: filtered ? CircleOff : Video,
            title: filtered ? 'No meetings match these filters' : 'No meetings yet',
            description: filtered
              ? 'Try another name, or clear the filters.'
              : 'When a teacher or a parent books a video meeting in the app, it shows up here.',
          }}
          card={(meeting) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-bold'>{meeting.title}</span>
                  <span className='tabular text-xs text-muted-foreground'>
                    {formatDateTime(meeting.scheduled_at)} ·{' '}
                    {durationLabel(meeting.duration_minutes)}
                  </span>
                </span>
                <StatusBadge meeting={meeting} />
              </div>
              <MeetingPeople meeting={meeting} />
              <span className='text-xs text-muted-foreground'>
                About {meeting.student.name}
                {meeting.student.class_section ? ` · ${meeting.student.class_section}` : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: meetings.data?.total ?? 0,
            label: 'meetings',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <MeetingSheet meetingId={openId ?? null} onClose={() => openMeeting(undefined)} />
    </Page>
  )
}

function StatusBadge({ meeting }: { meeting: Meeting }) {
  const status = MEETING_STATUS[meeting.status]
  const reply = MEETING_RESPONSE[meeting.response]
  return (
    <span className='flex flex-wrap gap-1'>
      <Badge tone={status.tone} dot pulse={isLive(meeting.status)}>
        {status.label}
      </Badge>
      {meeting.status === 'scheduled' && (
        <Badge tone={reply.tone} title={meeting.response_note ?? undefined}>
          {reply.label}
        </Badge>
      )}
    </span>
  )
}
