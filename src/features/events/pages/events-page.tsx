import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  Ban,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CircleOff,
  FilePen,
  List,
  MessageCircleQuestion,
  Plus,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { MonthGrid, type MonthGridItem } from '@/components/common/month-grid'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { today } from '@/features/attendance/labels'
import { can, useMe } from '@/features/auth/api'
import { useClasses, useHolidays } from '@/features/setup/api'
import { datesBetween, dayTitle, monthRange } from '@/lib/calendar'
import { useEventInsights, useEvents, type EventStatus, type SchoolEvent } from '../api'
import { EventFormModal } from '../components/event-form-modal'
import { EventSheet } from '../components/event-sheet'
import { EVENT_STATUS, eventTime } from '../labels'
import type { EventsSearch } from '../search'

const route = getRouteApi('/_app/events')
const LIMIT = 20
const MONTH_LIMIT = 100

export function EventsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/events' })
  const me = useMe().data
  const canManage = can(me, 'events.manage')
  const now = today()
  const month = search.month ?? now.slice(0, 7)
  const range = monthRange(month)
  const { event: openId, view } = search
  const isMonth = view === 'month'

  const list = useEvents(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      status: search.status,
      class_id: search.class_id,
      upcoming: search.upcoming,
      sort: search.sort,
      order: search.order,
    },
    !isMonth
  )
  const monthList = useEvents(
    {
      page: 1,
      limit: MONTH_LIMIT,
      from: range.from,
      to: range.to,
      status: search.status,
      class_id: search.class_id,
      search: search.search,
      sort: 'event_date',
      order: 'asc',
    },
    isMonth
  )
  const insights = useEventInsights()
  const holidays = useHolidays()
  const classes = useClasses()
  const [editing, setEditing] = useState<{ event: SchoolEvent | null; date?: string } | null>(null)

  const setSearch = (patch: Partial<EventsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const open = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, event: id }), replace: true })

  useShortcut('app.refresh', () => {
    void (isMonth ? monthList.refetch() : list.refetch())
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'month',
      label: 'This month',
      value: data?.this_month ?? 0,
      hint: 'Published events',
      icon: CalendarDays,
      tone: 'info',
      active: isMonth && month === now.slice(0, 7) && !search.status,
      onClick: () => setSearch({ view: 'month', month: undefined, status: undefined }),
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      value: data?.upcoming ?? 0,
      hint: `${data?.awaiting_replies ?? 0} still taking replies`,
      icon: MessageCircleQuestion,
      tone: 'success',
      active: !isMonth && Boolean(search.upcoming),
      onClick: () =>
        setSearch({
          view: 'list',
          upcoming: search.upcoming ? undefined : true,
          status: search.upcoming ? undefined : 'published',
          sort: 'event_date',
          order: 'asc',
        }),
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: data?.drafts ?? 0,
      hint: 'Parents cannot see these',
      icon: FilePen,
      tone: 'neutral',
      active: search.status === 'draft',
      onClick: () =>
        setSearch({
          status: search.status === 'draft' ? undefined : 'draft',
          upcoming: undefined,
        }),
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: data?.cancelled ?? 0,
      hint: 'Parents were told',
      icon: Ban,
      tone: 'danger',
      active: search.status === 'cancelled',
      onClick: () =>
        setSearch({
          status: search.status === 'cancelled' ? undefined : 'cancelled',
          upcoming: undefined,
        }),
    },
  ]

  const gridItems: MonthGridItem[] = [
    ...(holidays.data ?? []).flatMap((holiday) =>
      datesBetween(holiday.date, holiday.end_date ?? holiday.date)
        .filter((date) => date >= range.from && date <= range.to)
        .map((date) => ({
          key: `h${holiday.id}-${date}`,
          date,
          label: holiday.name,
          hint: holiday.type === 'event' ? 'School calendar' : 'Holiday',
          tone: 'muted' as const,
        }))
    ),
    ...(monthList.data?.items ?? []).map((event) => ({
      key: `e${event.id}`,
      date: event.event_date,
      label: event.title,
      hint: eventTime(event),
      tone:
        event.status === 'cancelled'
          ? ('danger' as const)
          : event.status === 'draft'
            ? ('warning' as const)
            : ('primary' as const),
      onClick: () => open(event.id),
    })),
  ]

  const columns: Column<SchoolEvent>[] = [
    {
      key: 'event_date',
      header: 'Date',
      sortKey: 'event_date',
      cell: (row) => (
        <span className='grid'>
          <span className='tabular font-semibold'>{dayTitle(row.event_date)}</span>
          <span className='text-xs text-muted-foreground'>{eventTime(row)}</span>
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Event',
      sortKey: 'title',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='font-semibold break-words'>{row.title}</span>
          <span className='text-xs break-words text-muted-foreground'>
            {[row.venue, row.audience_label].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    {
      key: 'replies',
      header: 'Replies',
      hideBelow: 'lg',
      cell: (row) => (row.rsvp_required ? <ReplyBar event={row} /> : <NoReply />),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={EVENT_STATUS[row.status].tone} dot>
          {EVENT_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.status || search.class_id || search.upcoming)
  const newButton = canManage && (
    <Button onClick={() => setEditing({ event: null })}>
      <Plus />
      New event
    </Button>
  )

  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Events'
        description='School events on the parent calendar. Parents reply for each child; reminders go out by themselves.'
        actions={newButton}
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <PageTabs
        label='Events view'
        value={view}
        onChange={(value) => setSearch({ view: value })}
        tabs={[
          { value: 'month', label: 'Month', icon: CalendarRange },
          { value: 'list', label: 'List', icon: List },
        ]}
      />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            isMonth
              ? monthList.data
                ? `${monthList.data.total} events this month`
                : ''
              : list.data
                ? `${list.data.total} events`
                : ''
          }
          onClear={
            filtered
              ? () =>
                  navigate({
                    search: { view, month: search.month, page: 1 },
                    replace: true,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Title or venue'
            label='Search events'
          />
          <FilterSelect
            id='event-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={(Object.keys(EVENT_STATUS) as EventStatus[]).map((status) => ({
              value: status,
              label: EVENT_STATUS[status].label,
            }))}
            onChange={(value) => setSearch({ status: value as EventsSearch['status'] })}
          />
          <FilterSelect
            id='event-class-filter'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) => setSearch({ class_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>

        {isMonth ? (
          <div className='p-4'>
            <MonthGrid
              month={month}
              today={now}
              items={gridItems}
              loading={monthList.isFetching}
              onMonthChange={(next) =>
                navigate({ search: (prev) => ({ ...prev, month: next }), replace: true })
              }
              onDayClick={
                canManage ? (date) => date >= now && setEditing({ event: null, date }) : undefined
              }
              emptyText='No events or holidays this month'
            />
          </div>
        ) : (
          <DataTable
            rows={list.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={list.isFetching}
            error={list.isError ? list.error.message : null}
            onRetry={() => list.refetch()}
            onRowClick={(row) => open(row.id)}
            sort={{ sort: search.sort ?? 'event_date', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<EventsSearch>)}
            empty={{
              icon: filtered ? CircleOff : CalendarCheck,
              title: filtered ? 'No events match these filters' : 'No events yet',
              description: filtered
                ? 'Try another word, or clear the filters.'
                : 'Add the first event for parents to see and reply to.',
              action: filtered ? undefined : newButton || undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='font-bold break-words'>{row.title}</span>
                    <span className='text-xs text-muted-foreground'>
                      {dayTitle(row.event_date)} · {eventTime(row)}
                    </span>
                  </span>
                  <Badge tone={EVENT_STATUS[row.status].tone} dot>
                    {EVENT_STATUS[row.status].label}
                  </Badge>
                </div>
                <span className='text-xs break-words text-muted-foreground'>
                  {[row.venue, row.audience_label].filter(Boolean).join(' · ')}
                </span>
                {row.rsvp_required && <ReplyBar event={row} />}
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: list.data?.total ?? 0,
              label: 'events',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        )}
      </Card>

      <EventSheet
        eventId={openId ?? null}
        canManage={canManage}
        onEdit={(row) => {
          open(undefined)
          setEditing({ event: row })
        }}
        onClose={() => open(undefined)}
      />
      {editing && (
        <EventFormModal
          event={editing.event}
          defaultDate={editing.date}
          onOpenChange={(value) => !value && setEditing(null)}
        />
      )}
    </Page>
  )
}

function NoReply() {
  return <span className='text-sm text-muted-foreground'>No reply asked</span>
}

function ReplyBar({ event }: { event: SchoolEvent }) {
  const { invited, attending, maybe, not_attending, no_response } = event.counts
  const width = (value: number) => `${invited ? (value / invited) * 100 : 0}%`
  return (
    <span className='grid min-w-40 gap-1'>
      <span
        className='flex h-2 overflow-hidden rounded-full bg-muted'
        role='img'
        aria-label={`${attending} attending, ${maybe} maybe, ${not_attending} not attending, ${no_response} no reply`}
      >
        <span className='bg-success' style={{ width: width(attending) }} />
        <span className='bg-warning' style={{ width: width(maybe) }} />
        <span className='bg-destructive' style={{ width: width(not_attending) }} />
      </span>
      <span className='tabular text-xs text-muted-foreground'>
        {attending} yes · {maybe} maybe · {not_attending} no · {no_response} waiting
      </span>
    </span>
  )
}
