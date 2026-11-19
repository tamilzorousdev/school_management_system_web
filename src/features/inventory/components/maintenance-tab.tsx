import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CalendarClock,
  CircleOff,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  inventoryApi,
  SCHEDULE_STATES,
  TICKET_KINDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  useInventoryMutation,
  useSchedules,
  useTickets,
  type InventoryAccess,
  type Schedule,
  type Ticket,
} from '../api'
import {
  money,
  options,
  SCHEDULE_STATE,
  TICKET_KIND,
  TICKET_PRIORITY,
  TICKET_STATUS,
} from '../labels'
import { MAINTENANCE_VIEWS, pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { DecisionModal } from './decision-modal'
import { ScheduleModal } from './schedule-modal'
import { OpenTicketModal, ResolveTicketModal, UpdateTicketModal } from './ticket-modals'

const LIMIT = 20
const TICKET_SORTS = ['opened_at', 'priority', 'resolved_at'] as const

interface TabProps {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}

const CLEAR: InventorySearchPatch = {
  search: undefined,
  status: undefined,
  kind: undefined,
  priority: undefined,
  active: undefined,
  state: undefined,
  sort: undefined,
  order: undefined,
}

export function MaintenanceTab({ search, onChange, access }: TabProps) {
  const view = pick(MAINTENANCE_VIEWS, search.view) ?? 'tickets'
  return (
    <div className='grid gap-4'>
      <SegmentedControl
        label='Maintenance view'
        value={view}
        onChange={(next) => onChange({ ...CLEAR, view: next })}
        options={[
          { value: 'tickets', label: 'Tickets' },
          { value: 'schedules', label: 'Preventive schedules' },
        ]}
        className='justify-self-start'
      />
      {view === 'tickets' ? (
        <TicketsView search={search} onChange={onChange} access={access} />
      ) : (
        <SchedulesView search={search} onChange={onChange} access={access} />
      )}
    </div>
  )
}

function TicketsView({ search, onChange, access }: TabProps) {
  const status = pick(TICKET_STATUSES, search.status)
  const kind = pick(TICKET_KINDS, search.kind)
  const sort = pick(TICKET_SORTS, search.sort)
  const page = search.page ?? 1
  const tickets = useTickets({
    page,
    limit: LIMIT,
    search: search.search,
    status,
    kind,
    priority: search.priority,
    active: search.active,
    sort,
    order: search.order,
  })
  const [opening, setOpening] = useState(false)
  const [updating, setUpdating] = useState<Ticket | null>(null)
  const [resolving, setResolving] = useState<Ticket | null>(null)
  const [cancelling, setCancelling] = useState<Ticket | null>(null)
  const start = useInventoryMutation((ticket: Ticket) =>
    inventoryApi.updateTicket(ticket.id, { status: 'in_progress' })
  )
  const cancel = useInventoryMutation(({ id, note }: { id: number; note: string }) =>
    inventoryApi.cancelTicket(id, note)
  )
  const filtered = Boolean(
    search.search || status || kind || search.priority || search.active !== undefined
  )

  useShortcut('app.refresh', () => void tickets.refetch())

  const startWork = async (ticket: Ticket) => {
    try {
      await start.mutateAsync(ticket)
      alerts.success(`Work started on ${ticket.ticket_no}`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const live = (ticket: Ticket) => ticket.status === 'open' || ticket.status === 'in_progress'

  const actions = (ticket: Ticket) =>
    access.manage &&
    live(ticket) && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for ${ticket.ticket_no}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' onClick={(event) => event.stopPropagation()}>
          {ticket.status === 'open' && (
            <DropdownMenuItem onSelect={() => void startWork(ticket)}>
              <Play className='size-4' />
              Start work
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setUpdating(ticket)}>
            <Pencil className='size-4' />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResolving(ticket)}>
            <Wrench className='size-4' />
            Resolve
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setCancelling(ticket)}>
            <CircleOff className='size-4' />
            Cancel ticket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

  const assetLink = (ticket: Ticket) => (
    <Link
      to='/inventory/assets/$assetId'
      params={{ assetId: String(ticket.asset.id) }}
      search={{ tab: 'maintenance' }}
      onClick={(event) => event.stopPropagation()}
      className='grid min-w-0 hover:underline'
    >
      <span className='truncate font-semibold'>{ticket.asset.name}</span>
      <span className='truncate font-mono text-[11px] text-muted-foreground'>
        {ticket.asset_tag}
        {ticket.location ? ` · ${ticket.location.name}` : ''}
      </span>
    </Link>
  )

  const columns: Column<Ticket>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      cell: (ticket) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{ticket.title}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {ticket.ticket_no} · {TICKET_KIND[ticket.kind]}
          </span>
        </span>
      ),
    },
    { key: 'asset', header: 'Asset', cell: assetLink },
    {
      key: 'priority',
      header: 'Priority',
      sortKey: 'priority',
      cell: (ticket) => (
        <Badge tone={TICKET_PRIORITY[ticket.priority].tone}>
          {TICKET_PRIORITY[ticket.priority].label}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (ticket) => (
        <span className='grid justify-items-start gap-1'>
          <Badge tone={TICKET_STATUS[ticket.status].tone} dot>
            {TICKET_STATUS[ticket.status].label}
          </Badge>
          {ticket.under_warranty && (
            <span className='text-[11px] text-muted-foreground'>Under warranty</span>
          )}
        </span>
      ),
    },
    {
      key: 'who',
      header: 'With',
      hideBelow: 'lg',
      cell: (ticket) => (
        <span className='grid min-w-0 text-sm'>
          <span className='truncate'>{ticket.assigned_to?.name ?? '—'}</span>
          {ticket.vendor && (
            <span className='truncate text-xs text-muted-foreground'>{ticket.vendor.name}</span>
          )}
        </span>
      ),
    },
    {
      key: 'opened_at',
      header: 'Opened',
      sortKey: 'opened_at',
      hideBelow: 'lg',
      cell: (ticket) => (
        <span className='grid text-sm'>
          <span className='tabular'>{formatDateTime(ticket.opened_at)}</span>
          {ticket.downtime_days !== null && (
            <span className='text-xs text-muted-foreground'>
              {ticket.downtime_days} {ticket.downtime_days === 1 ? 'day' : 'days'} down
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'resolved_at',
      header: 'Resolved',
      sortKey: 'resolved_at',
      hideBelow: 'xl',
      cell: (ticket) => (
        <span className='grid text-sm'>
          <span className='tabular'>{formatDateTime(ticket.resolved_at)}</span>
          {ticket.cost !== null && (
            <span className='tabular text-xs text-muted-foreground'>{money(ticket.cost)}</span>
          )}
        </span>
      ),
    },
    { key: 'actions', header: '', align: 'right', className: 'w-12', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={tickets.data ? `${tickets.data.total} tickets` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  status: undefined,
                  kind: undefined,
                  priority: undefined,
                  active: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Ticket number, problem or tag'
          label='Search tickets'
        />
        <FilterSelect
          id='ticket-status-filter'
          label='Filter by status'
          allLabel='All statuses'
          value={status}
          options={options(TICKET_STATUS)}
          onChange={(value) =>
            onChange({ status: pick(TICKET_STATUSES, value), active: undefined })
          }
        />
        <FilterSelect
          id='ticket-kind-filter'
          label='Filter by kind'
          allLabel='All kinds'
          value={kind}
          options={options(TICKET_KIND)}
          onChange={(value) => onChange({ kind: pick(TICKET_KINDS, value) })}
        />
        <FilterSelect
          id='ticket-priority-filter'
          label='Filter by priority'
          allLabel='All priorities'
          value={search.priority}
          options={TICKET_PRIORITIES.map((value) => ({
            value,
            label: TICKET_PRIORITY[value].label,
          }))}
          onChange={(value) => onChange({ priority: pick(TICKET_PRIORITIES, value) })}
        />
        <FilterSelect
          id='ticket-active-filter'
          label='Filter by open or closed'
          allLabel='Open and closed'
          value={search.active === undefined ? undefined : search.active ? 'yes' : 'no'}
          options={[
            { value: 'yes', label: 'Open or in progress' },
            { value: 'no', label: 'Closed' },
          ]}
          onChange={(value) =>
            onChange({
              active: value === undefined ? undefined : value === 'yes',
              status: undefined,
            })
          }
        />
        {access.manage && (
          <Button size='sm' onClick={() => setOpening(true)}>
            <Plus />
            Open ticket
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={tickets.data?.items ?? []}
        columns={columns}
        rowKey={(ticket) => ticket.id}
        loading={tickets.isFetching}
        error={tickets.isError ? tickets.error.message : null}
        onRetry={() => tickets.refetch()}
        onRowClick={access.manage ? (ticket) => live(ticket) && setUpdating(ticket) : undefined}
        sort={{ sort: sort ?? 'opened_at', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : Wrench,
          title: filtered ? 'No tickets match these filters' : 'No maintenance tickets yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Open a ticket when something breaks; the asset shows as under maintenance.',
          action: !filtered && access.manage && (
            <Button onClick={() => setOpening(true)}>
              <Plus />
              Open ticket
            </Button>
          ),
        }}
        card={(ticket) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{ticket.title}</span>
                <span className='truncate font-mono text-[11px] text-muted-foreground'>
                  {ticket.ticket_no} · {ticket.asset_tag}
                </span>
              </span>
              <div className='flex shrink-0 items-center gap-1'>
                <Badge tone={TICKET_STATUS[ticket.status].tone} dot>
                  {TICKET_STATUS[ticket.status].label}
                </Badge>
                {actions(ticket)}
              </div>
            </div>
            <span className='truncate text-sm'>{ticket.asset.name}</span>
            <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <Badge tone={TICKET_PRIORITY[ticket.priority].tone}>
                {TICKET_PRIORITY[ticket.priority].label}
              </Badge>
              <span>{TICKET_KIND[ticket.kind]}</span>
              <span>Opened {formatDate(ticket.opened_at)}</span>
              {ticket.assigned_to && <span>· {ticket.assigned_to.name}</span>}
            </div>
          </div>
        )}
        pagination={
          tickets.data
            ? {
                page,
                limit: LIMIT,
                total: tickets.data.total,
                label: 'tickets',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
      <OpenTicketModal open={opening} onOpenChange={setOpening} />
      <UpdateTicketModal
        open={Boolean(updating)}
        onOpenChange={(open) => !open && setUpdating(null)}
        ticket={updating}
      />
      <ResolveTicketModal
        open={Boolean(resolving)}
        onOpenChange={(open) => !open && setResolving(null)}
        ticket={resolving}
      />
      <DecisionModal
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        mode='cancel'
        title={`Cancel ${cancelling?.ticket_no ?? 'ticket'}?`}
        description='Use this for a ticket raised by mistake. The asset goes back to where it was.'
        submitText='Cancel ticket'
        placeholder='Raised twice'
        loading={cancel.isPending}
        onSubmit={async (note) => {
          if (!cancelling) return
          await cancel.mutateAsync({ id: cancelling.id, note: note ?? '' })
          alerts.success('Ticket cancelled')
          setCancelling(null)
        }}
      />
    </Card>
  )
}

function SchedulesView({ search, onChange, access }: TabProps) {
  const page = search.page ?? 1
  const schedules = useSchedules({
    page,
    limit: LIMIT,
    search: search.search,
    state: search.state,
  })
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const toggle = useInventoryMutation((schedule: Schedule) =>
    inventoryApi.updateSchedule(schedule.id, { is_active: !schedule.is_active })
  )
  const start = useInventoryMutation((schedule: Schedule) =>
    inventoryApi.startSchedule(schedule.id)
  )
  const filtered = Boolean(search.search || search.state)

  useShortcut('app.refresh', () => void schedules.refetch())

  const run = async (action: Promise<unknown>, message: string) => {
    try {
      await action
      alerts.success(message)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const openForm = (schedule: Schedule | null) => {
    setEditing(schedule)
    setFormOpen(true)
  }

  const actions = (schedule: Schedule) =>
    access.manage && (
      <div className='inline-flex gap-1'>
        {schedule.is_active && !schedule.open_ticket_id && (
          <Button
            size='sm'
            variant='outline'
            loading={start.isPending && start.variables?.id === schedule.id}
            onClick={(event) => {
              event.stopPropagation()
              void run(start.mutateAsync(schedule), `Ticket opened for ${schedule.title}`)
            }}
          >
            <Play />
            Start
          </Button>
        )}
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={schedule.is_active ? 'Pause schedule' : 'Resume schedule'}
          title={schedule.is_active ? 'Pause' : 'Resume'}
          onClick={(event) => {
            event.stopPropagation()
            void run(
              toggle.mutateAsync(schedule),
              schedule.is_active ? 'Schedule paused' : 'Schedule resumed'
            )
          }}
        >
          {schedule.is_active ? <Pause /> : <Play />}
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${schedule.title}`}
          onClick={(event) => {
            event.stopPropagation()
            openForm(schedule)
          }}
        >
          <Pencil />
        </Button>
      </div>
    )

  const stateBadge = (schedule: Schedule) =>
    schedule.is_active ? (
      <Badge tone={SCHEDULE_STATE[schedule.state].tone} dot>
        {SCHEDULE_STATE[schedule.state].label}
      </Badge>
    ) : (
      <Badge tone='neutral'>Paused</Badge>
    )

  const columns: Column<Schedule>[] = [
    {
      key: 'title',
      header: 'Service',
      cell: (schedule) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{schedule.title}</span>
          <span className='text-xs text-muted-foreground'>Every {schedule.interval_days} days</span>
        </span>
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      cell: (schedule) => (
        <Link
          to='/inventory/assets/$assetId'
          params={{ assetId: String(schedule.asset.id) }}
          search={{ tab: 'maintenance' }}
          onClick={(event) => event.stopPropagation()}
          className='grid min-w-0 hover:underline'
        >
          <span className='truncate font-semibold'>{schedule.asset.name}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {schedule.asset_tag}
          </span>
        </Link>
      ),
    },
    {
      key: 'next',
      header: 'Next due',
      cell: (schedule) => <span className='tabular'>{formatDate(schedule.next_due_on)}</span>,
    },
    {
      key: 'last',
      header: 'Last done',
      hideBelow: 'lg',
      cell: (schedule) => <span className='tabular'>{formatDate(schedule.last_done_on)}</span>,
    },
    {
      key: 'vendor',
      header: 'Vendor',
      hideBelow: 'xl',
      cell: (schedule) => schedule.vendor?.name ?? '—',
    },
    {
      key: 'state',
      header: 'State',
      cell: (schedule) => (
        <span className='grid justify-items-start gap-1'>
          {stateBadge(schedule)}
          {schedule.open_ticket_id && (
            <span className='text-[11px] text-muted-foreground'>Ticket open</span>
          )}
        </span>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={schedules.data ? `${schedules.data.total} schedules` : ''}
        onClear={filtered ? () => onChange({ search: undefined, state: undefined }) : undefined}
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Service or asset'
          label='Search schedules'
        />
        <FilterSelect
          id='schedule-state-filter'
          label='Filter by state'
          allLabel='All states'
          value={search.state}
          options={SCHEDULE_STATES.map((value) => ({
            value,
            label: SCHEDULE_STATE[value].label,
          }))}
          onChange={(value) => onChange({ state: pick(SCHEDULE_STATES, value) })}
        />
        {access.manage && (
          <Button size='sm' onClick={() => openForm(null)}>
            <Plus />
            Add schedule
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={schedules.data?.items ?? []}
        columns={columns}
        rowKey={(schedule) => schedule.id}
        loading={schedules.isFetching}
        error={schedules.isError ? schedules.error.message : null}
        onRetry={() => schedules.refetch()}
        onRowClick={access.manage ? openForm : undefined}
        empty={{
          icon: filtered ? CircleOff : CalendarClock,
          title: filtered ? 'No schedules match' : 'No preventive schedules yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Add a service that repeats, like an AC service every six months.',
          action: !filtered && access.manage && (
            <Button onClick={() => openForm(null)}>
              <Plus />
              Add schedule
            </Button>
          ),
        }}
        card={(schedule) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{schedule.title}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {schedule.asset_tag} · {schedule.asset.name}
                </span>
              </span>
              {stateBadge(schedule)}
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-xs text-muted-foreground'>
                Next {formatDate(schedule.next_due_on)} · every {schedule.interval_days} days
              </span>
              {actions(schedule)}
            </div>
          </div>
        )}
        pagination={
          schedules.data
            ? {
                page,
                limit: LIMIT,
                total: schedules.data.total,
                label: 'schedules',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
      <ScheduleModal open={formOpen} onOpenChange={setFormOpen} schedule={editing} />
    </Card>
  )
}
