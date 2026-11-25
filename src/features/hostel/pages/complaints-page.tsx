import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlarmClock,
  CircleOff,
  ClipboardList,
  MessageSquareWarning,
  Plus,
  Star,
  TimerOff,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  hostelApi,
  useComplaints,
  useConductInsights,
  useTickets,
  type Complaint,
  type Ticket,
} from '../api'
import { ComplaintDetailSheet } from '../components/complaint-detail-sheet'
import { ComplaintFormModal } from '../components/complaint-form-modal'
import { RatingStars } from '../components/complaint-parts'
import { HostelTabs } from '../components/hostel-tabs'
import { ToggleFilter } from '../components/leave-form-parts'
import { HostelSelect } from '../components/pickers'
import { TicketDetailSheet } from '../components/ticket-detail-sheet'
import { TicketFormModal } from '../components/ticket-form-modal'
import {
  COMPLAINT_CATEGORY,
  COMPLAINT_STATUS,
  MAINTENANCE_CATEGORY,
  PRIORITY,
  TICKET_STATUS,
  toneOptions,
} from '../labels'
import type { ComplaintsSearch } from '../search'

const route = getRouteApi('/_app/hostel/complaints')
const LIMIT = 20

type Tab = ComplaintsSearch['tab']

export function ComplaintsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/complaints' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canComplaint = can(me, 'hostel.complaint')
  const canMaintain = can(me, 'hostel.maintenance')
  const tab: Tab = search.tab
  const [creating, setCreating] = useState(false)
  const [complaintId, setComplaintId] = useState<number | null>(null)
  const [ticketId, setTicketId] = useState<number | null>(null)

  const complaints = useComplaints(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.complaint_status,
      priority: search.priority,
      overdue: search.overdue,
      sort: search.sort === 'scheduled_on' ? undefined : search.sort,
      order: search.order,
    },
    canView && tab === 'complaints'
  )
  const tickets = useTickets(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.ticket_status,
      priority: search.priority,
      open: search.open,
      overdue: search.overdue,
      sort: search.sort,
      order: search.order,
    },
    canView && tab === 'maintenance'
  )
  const insights = useConductInsights(search.hostel_id, canView)

  const canCreate = tab === 'complaints' ? canComplaint : canMaintain

  const setSearch = (patch: Partial<ComplaintsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: Tab, patch: Partial<ComplaintsSearch> = {}) =>
    navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id, ...patch } })

  useShortcut('hostel.create', () => setCreating(true), { enabled: canCreate })
  useShortcut('app.refresh', () => {
    void insights.refetch()
    void (tab === 'complaints' ? complaints.refetch() : tickets.refetch())
  })

  const createLabel = tab === 'complaints' ? 'Record complaint' : 'Raise ticket'

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Complaints & repairs'
      description='Complaints from parents and staff, and maintenance tickets for rooms and common areas.'
      actions={
        canCreate ? (
          <Button onClick={() => setCreating(true)}>
            <Plus />
            {createLabel}
            <Kbd id='hostel.create' inverted />
          </Button>
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={Wrench}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const data = insights.data
  const openComplaints =
    tab === 'complaints' && search.complaint_status === 'open' && !search.overdue
  const overdueComplaints = tab === 'complaints' && Boolean(search.overdue)
  const openTickets = tab === 'maintenance' && Boolean(search.open) && !search.overdue
  const overdueTickets = tab === 'maintenance' && Boolean(search.overdue)
  const cards: Insight[] = [
    {
      key: 'open_complaints',
      label: 'Open complaints',
      value: data?.open_complaints ?? 0,
      hint: 'Not resolved yet',
      icon: MessageSquareWarning,
      tone: 'warning',
      active: openComplaints,
      onClick: () =>
        tab !== 'complaints'
          ? switchTab('complaints', { complaint_status: 'open' })
          : setSearch({
              complaint_status: openComplaints ? undefined : 'open',
              overdue: undefined,
            }),
    },
    {
      key: 'overdue_complaints',
      label: 'Overdue complaints',
      value: data?.overdue_complaints ?? 0,
      hint: 'Past their due time',
      icon: AlarmClock,
      tone: (data?.overdue_complaints ?? 0) > 0 ? 'danger' : 'neutral',
      active: overdueComplaints,
      onClick: () =>
        tab !== 'complaints'
          ? switchTab('complaints', { overdue: true })
          : setSearch({
              overdue: overdueComplaints ? undefined : true,
              complaint_status: undefined,
            }),
    },
    {
      key: 'open_tickets',
      label: 'Open tickets',
      value: data?.open_tickets ?? 0,
      hint: 'Repairs not done',
      icon: Wrench,
      tone: 'info',
      active: openTickets,
      onClick: () =>
        tab !== 'maintenance'
          ? switchTab('maintenance', { open: true })
          : setSearch({ open: openTickets ? undefined : true, overdue: undefined }),
    },
    {
      key: 'overdue_tickets',
      label: 'Overdue tickets',
      value: data?.overdue_tickets ?? 0,
      hint: 'Past their due time',
      icon: TimerOff,
      tone: (data?.overdue_tickets ?? 0) > 0 ? 'danger' : 'neutral',
      active: overdueTickets,
      onClick: () =>
        tab !== 'maintenance'
          ? switchTab('maintenance', { overdue: true })
          : setSearch({ overdue: overdueTickets ? undefined : true, open: undefined }),
    },
    {
      key: 'rating',
      label: 'Parent rating',
      value: data?.average_rating != null ? `${data.average_rating}/5` : '—',
      hint: 'Last 90 days',
      icon: Star,
      tone: 'success',
    },
  ]

  const complaintColumns: Column<Complaint>[] = [
    {
      key: 'title',
      header: 'Complaint',
      sortKey: 'created_at',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-semibold'>{row.title}</span>
          <span className='truncate text-xs text-muted-foreground'>
            <span className='font-mono'>{row.complaint_no}</span> ·{' '}
            {COMPLAINT_CATEGORY[row.category]}
          </span>
        </div>
      ),
    },
    {
      key: 'where',
      header: 'Room / student',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate text-sm'>
            {row.room_no ? `Room ${row.room_no}` : row.hostel_name}
          </span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.student?.name ?? (row.raised_by_role === 'parent' ? 'Parent' : 'Staff')}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortKey: 'priority',
      hideBelow: 'lg',
      cell: (row) => (
        <Badge tone={PRIORITY[row.priority].tone}>{PRIORITY[row.priority].label}</Badge>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      sortKey: 'due_at',
      hideBelow: 'lg',
      cell: (row) => <DueCell due={row.due_at} overdue={row.overdue} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-1'>
          <Badge tone={COMPLAINT_STATUS[row.status].tone} dot>
            {COMPLAINT_STATUS[row.status].label}
          </Badge>
          {row.overdue && <Badge tone='danger'>Overdue</Badge>}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      hideBelow: 'xl',
      cell: (row) => <RatingStars rating={row.rating} />,
    },
  ]

  const ticketColumns: Column<Ticket>[] = [
    {
      key: 'title',
      header: 'Ticket',
      sortKey: 'created_at',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-semibold'>{row.title}</span>
          <span className='truncate text-xs text-muted-foreground'>
            <span className='font-mono'>{row.ticket_no}</span> ·{' '}
            {MAINTENANCE_CATEGORY[row.category]}
          </span>
        </div>
      ),
    },
    {
      key: 'where',
      header: 'Where',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate text-sm'>
            {row.room_no
              ? `Room ${row.room_no}${row.bed_no ? ` / ${row.bed_no}` : ''}`
              : 'Common area'}
          </span>
          <span className='truncate text-xs text-muted-foreground'>{row.hostel_name}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortKey: 'priority',
      hideBelow: 'lg',
      cell: (row) => (
        <Badge tone={PRIORITY[row.priority].tone}>{PRIORITY[row.priority].label}</Badge>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned',
      hideBelow: 'xl',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{row.assigned_to_name ?? 'Nobody yet'}</span>
          {row.vendor_name && (
            <span className='text-xs text-muted-foreground'>{row.vendor_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      sortKey: 'scheduled_on',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDate(row.scheduled_on)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-1'>
          <Badge tone={TICKET_STATUS[row.status].tone} dot>
            {TICKET_STATUS[row.status].label}
          </Badge>
          {row.overdue && <Badge tone='danger'>Overdue</Badge>}
          {row.blocks_room && row.status !== 'done' && row.status !== 'cancelled' && (
            <Badge tone='warning'>Room closed</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{row.cost !== null ? rupees(row.cost) : '—'}</span>,
    },
  ]

  const complaintsFiltered = Boolean(
    search.search ||
    search.hostel_id ||
    search.complaint_status ||
    search.priority ||
    search.overdue
  )
  const ticketsFiltered = Boolean(
    search.search ||
    search.hostel_id ||
    search.ticket_status ||
    search.priority ||
    search.open ||
    search.overdue
  )

  const toolbarCommon = (
    <>
      <SearchBox
        value={search.search ?? ''}
        onChange={(value) => setSearch({ search: value || undefined })}
        placeholder={
          tab === 'complaints' ? 'Search title, number or student' : 'Search title, number or room'
        }
        label={tab === 'complaints' ? 'Search complaints' : 'Search tickets'}
      />
      <HostelSelect
        id='complaints-hostel'
        allLabel='All hostels'
        value={search.hostel_id ? String(search.hostel_id) : undefined}
        onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
      />
    </>
  )

  const priorityFilter = (
    <FilterSelect
      id='complaints-priority'
      label='Filter by priority'
      allLabel='Any priority'
      value={search.priority}
      options={toneOptions(PRIORITY)}
      onChange={(value) => setSearch({ priority: value as ComplaintsSearch['priority'] })}
    />
  )

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/complaints' />

      <InsightCards items={cards} loading={insights.isPending} />

      <PageTabs
        label='Complaint sections'
        value={tab}
        onChange={(next) => switchTab(next)}
        tabs={[
          {
            value: 'complaints',
            label: 'Complaints',
            icon: ClipboardList,
            count: data?.open_complaints || undefined,
          },
          {
            value: 'maintenance',
            label: 'Maintenance',
            icon: Wrench,
            count: data?.open_tickets || undefined,
          },
        ]}
      />

      {tab === 'complaints' ? (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={complaints.data ? `${complaints.data.total} complaints` : ''}
            onClear={
              complaintsFiltered
                ? () => navigate({ search: { tab: 'complaints', page: 1 }, replace: true })
                : undefined
            }
          >
            {toolbarCommon}
            <FilterSelect
              id='complaints-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.complaint_status}
              options={toneOptions(COMPLAINT_STATUS)}
              onChange={(value) =>
                setSearch({ complaint_status: value as ComplaintsSearch['complaint_status'] })
              }
            />
            {priorityFilter}
            <ToggleFilter
              id='complaints-overdue'
              label='Overdue only'
              checked={Boolean(search.overdue)}
              onChange={(overdue) => setSearch({ overdue })}
            />
          </ListToolbar>
          <DataTable
            rows={complaints.data?.items ?? []}
            columns={complaintColumns}
            rowKey={(row) => row.id}
            loading={complaints.isFetching}
            error={complaints.isError ? complaints.error.message : null}
            onRetry={() => complaints.refetch()}
            onRowClick={(row) => setComplaintId(row.id)}
            sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<ComplaintsSearch>)}
            empty={{
              icon: complaintsFiltered ? CircleOff : ClipboardList,
              title: complaintsFiltered ? 'No complaints match these filters' : 'No complaints',
              description: complaintsFiltered
                ? 'Try another search or clear the filters.'
                : 'Parents raise complaints in the Parent app; staff can record one here.',
              action:
                canComplaint && !complaintsFiltered ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus />
                    Record complaint
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0 gap-0.5'>
                    <span className='truncate font-semibold'>{row.title}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      <span className='font-mono'>{row.complaint_no}</span> ·{' '}
                      {COMPLAINT_CATEGORY[row.category]}
                    </span>
                  </div>
                  <Badge tone={COMPLAINT_STATUS[row.status].tone} dot className='shrink-0'>
                    {COMPLAINT_STATUS[row.status].label}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-1'>
                  <Badge tone={PRIORITY[row.priority].tone}>{PRIORITY[row.priority].label}</Badge>
                  {row.overdue && <Badge tone='danger'>Overdue</Badge>}
                  <RatingStars rating={row.rating} />
                </div>
                <span className='text-xs text-muted-foreground'>
                  {row.room_no ? `Room ${row.room_no}` : row.hostel_name}
                  {row.student ? ` · ${row.student.name}` : ''} · due {formatDateTime(row.due_at)}
                </span>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: complaints.data?.total ?? 0,
              label: 'complaints',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      ) : (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={tickets.data ? `${tickets.data.total} tickets` : ''}
            onClear={
              ticketsFiltered
                ? () => navigate({ search: { tab: 'maintenance', page: 1 }, replace: true })
                : undefined
            }
          >
            {toolbarCommon}
            <FilterSelect
              id='tickets-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.ticket_status}
              options={toneOptions(TICKET_STATUS)}
              onChange={(value) =>
                setSearch({ ticket_status: value as ComplaintsSearch['ticket_status'] })
              }
            />
            {priorityFilter}
            <ToggleFilter
              id='tickets-open'
              label='Open only'
              checked={Boolean(search.open)}
              onChange={(open) => setSearch({ open })}
            />
            <ToggleFilter
              id='tickets-overdue'
              label='Overdue only'
              checked={Boolean(search.overdue)}
              onChange={(overdue) => setSearch({ overdue })}
            />
          </ListToolbar>
          <DataTable
            rows={tickets.data?.items ?? []}
            columns={ticketColumns}
            rowKey={(row) => row.id}
            loading={tickets.isFetching}
            error={tickets.isError ? tickets.error.message : null}
            onRetry={() => tickets.refetch()}
            onRowClick={(row) => setTicketId(row.id)}
            sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<ComplaintsSearch>)}
            empty={{
              icon: ticketsFiltered ? CircleOff : Wrench,
              title: ticketsFiltered ? 'No tickets match these filters' : 'No maintenance tickets',
              description: ticketsFiltered
                ? 'Try another search or clear the filters.'
                : 'Raise a ticket for a repair, or turn a complaint into one.',
              action:
                canMaintain && !ticketsFiltered ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus />
                    Raise ticket
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0 gap-0.5'>
                    <span className='truncate font-semibold'>{row.title}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      <span className='font-mono'>{row.ticket_no}</span> ·{' '}
                      {MAINTENANCE_CATEGORY[row.category]}
                    </span>
                  </div>
                  <Badge tone={TICKET_STATUS[row.status].tone} dot className='shrink-0'>
                    {TICKET_STATUS[row.status].label}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-1'>
                  <Badge tone={PRIORITY[row.priority].tone}>{PRIORITY[row.priority].label}</Badge>
                  {row.overdue && <Badge tone='danger'>Overdue</Badge>}
                </div>
                <span className='text-xs text-muted-foreground'>
                  {row.room_no ? `Room ${row.room_no}` : 'Common area'} · {row.hostel_name}
                  {row.assigned_to_name ? ` · ${row.assigned_to_name}` : ''}
                  {row.cost !== null ? ` · ${rupees(row.cost)}` : ''}
                </span>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: tickets.data?.total ?? 0,
              label: 'tickets',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      <ComplaintDetailSheet
        complaintId={complaintId}
        onClose={() => setComplaintId(null)}
        onOpenTicket={(id) => {
          setComplaintId(null)
          setTicketId(id)
        }}
      />
      <TicketDetailSheet ticketId={ticketId} onClose={() => setTicketId(null)} />

      {creating && tab === 'complaints' && (
        <ComplaintFormModal
          onClose={() => setCreating(false)}
          onCreated={(complaint) => setComplaintId(complaint.id)}
        />
      )}
      {creating && tab === 'maintenance' && (
        <TicketFormModal
          title='Raise maintenance ticket'
          description='A repair for a room, a bed or a common area.'
          submitText='Raise ticket'
          defaults={{ hostel_id: search.hostel_id }}
          onSubmit={hostelApi.createTicket}
          onClose={() => setCreating(false)}
          onCreated={(ticket) => setTicketId(ticket.id)}
        />
      )}
    </Page>
  )
}

function DueCell({ due, overdue }: { due: string; overdue: boolean }) {
  return (
    <span
      className={
        overdue ? 'text-xs font-semibold text-destructive' : 'text-xs text-muted-foreground'
      }
    >
      {formatDateTime(due)}
    </span>
  )
}
