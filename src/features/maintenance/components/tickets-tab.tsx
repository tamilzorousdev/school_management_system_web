import { useState } from 'react'
import {
  Ban,
  CheckCircle2,
  CircleDot,
  CircleOff,
  Cpu,
  FileText,
  ImageIcon,
  IndianRupee,
  Pencil,
  Plus,
  Timer,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SEVERITY } from '@/features/fleet/labels'
import { useBusOptions } from '@/features/transport/api'
import { formatDate, formatNumber } from '@/lib/format'
import { useTicketInsights, useTickets, type Ticket, type TicketListParams } from '../api'
import {
  SERVICE_CATEGORY,
  SERVICE_CATEGORY_OPTIONS,
  TICKET_KIND,
  TICKET_KIND_OPTIONS,
  TICKET_SOURCE,
  TICKET_SOURCE_OPTIONS,
  TICKET_STATUS,
  TICKET_STATUS_OPTIONS,
  rupees,
  warrantyText,
} from '../labels'
import type { MaintenanceSearch, TabProps } from '../search'
import { CloseTicketModal } from './close-ticket-modal'
import { isPhone, openStoredFile } from '../helpers'
import { ActionSheet, BusCell, type SheetAction } from './shared'
import { TicketFormModal } from './ticket-form-modal'

const LIMIT = 20
const SORTS = ['opened_at', 'closed_at', 'cost', 'status'] as const
const OFF_ROAD_OPTIONS = [
  { value: 'true', label: 'Keeping a bus off road' },
  { value: 'false', label: 'Bus can still run' },
]

function TicketBadges({ ticket }: { ticket: Ticket }) {
  return (
    <span className='flex flex-wrap gap-1'>
      <Badge tone={TICKET_KIND[ticket.kind].tone}>{TICKET_KIND[ticket.kind].label}</Badge>
      <Badge tone={TICKET_SOURCE[ticket.source].tone}>{TICKET_SOURCE[ticket.source].label}</Badge>
      {ticket.severity && (
        <Badge tone={SEVERITY[ticket.severity].tone}>{SEVERITY[ticket.severity].label}</Badge>
      )}
      {ticket.off_road && ticket.status !== 'done' && <Badge tone='danger'>Off road</Badge>}
      {ticket.warranty_claim && (
        <Badge tone='success' title={warrantyText(ticket) ?? undefined}>
          Claim warranty
        </Badge>
      )}
    </span>
  )
}

function StatusBadge({ ticket }: { ticket: Ticket }) {
  const status = TICKET_STATUS[ticket.status]
  return (
    <Badge tone={status.tone} dot>
      {status.label}
    </Badge>
  )
}

const vendorName = (ticket: Ticket) => ticket.garage?.name ?? ticket.vendor

export function TicketsTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  adding,
  onAddingChange,
}: TabProps) {
  const busOptions = useBusOptions()
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [closing, setClosing] = useState<Ticket | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)
  const [sheet, setSheet] = useState<Ticket | null>(null)
  if (adding && !editOpen && editing) setEditing(null)

  const openEdit = (ticket: Ticket) => {
    setEditing(ticket)
    setEditOpen(true)
  }
  const sort = SORTS.find((item) => item === search.sort)
  const params: TicketListParams = {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    sort,
    order: sort ? search.order : undefined,
    status: search.status,
    source: search.source,
    kind: search.kind,
    category: search.category,
    off_road: search.off_road,
    vehicle_id: search.vehicle_id,
  }
  const tickets = useTickets(params)
  const insights = useTicketInsights(search.vehicle_id)
  const data = insights.data
  const rows = tickets.data?.items ?? []

  const only = (patch: Partial<MaintenanceSearch>) => {
    const active = Object.entries(patch).every(
      ([key, value]) => search[key as keyof MaintenanceSearch] === value
    )
    const cleared = { status: undefined, source: undefined, off_road: undefined }
    setSearch(active ? cleared : { ...cleared, ...patch })
  }

  const cards: Insight[] = [
    {
      key: 'open',
      label: 'Open',
      value: data?.open ?? 0,
      hint: `${data?.total ?? 0} tickets in all`,
      icon: CircleDot,
      tone: 'danger',
      active: search.status === 'open' && !search.source && search.off_road === undefined,
      onClick: () => only({ status: 'open' }),
    },
    {
      key: 'in_progress',
      label: 'In progress',
      value: data?.in_progress ?? 0,
      hint: 'At the garage',
      icon: Timer,
      tone: 'warning',
      active: search.status === 'in_progress' && !search.source,
      onClick: () => only({ status: 'in_progress' }),
    },
    {
      key: 'off_road',
      label: 'Off road',
      value: data?.off_road ?? 0,
      hint: 'Open tickets stopping a bus',
      icon: Ban,
      tone: 'danger',
      active: search.off_road === true,
      onClick: () => only({ off_road: true, status: 'open' }),
    },
    {
      key: 'obd',
      label: 'From OBD (open)',
      value: data?.obd_open ?? 0,
      hint: 'Raised by engine fault codes',
      icon: Cpu,
      tone: 'info',
      active: search.status === 'open' && search.source === 'obd',
      onClick: () => only({ status: 'open', source: 'obd' }),
    },
    {
      key: 'done',
      label: 'Done',
      value: data?.done ?? 0,
      hint: 'Closed tickets',
      icon: CheckCircle2,
      tone: 'success',
      active: search.status === 'done' && !search.source,
      onClick: () => only({ status: 'done' }),
    },
    {
      key: 'cost',
      label: 'Cost this month',
      value: rupees(data?.cost_this_month ?? 0),
      hint: 'Closed this month',
      icon: IndianRupee,
      tone: 'primary',
    },
  ]

  const ticketActions = (ticket: Ticket): SheetAction[] =>
    (
      [
        canManage &&
          ticket.status !== 'done' && {
            key: 'close',
            label: 'Close ticket',
            icon: <CheckCircle2 />,
            onClick: () => {
              setClosing(ticket)
              setCloseOpen(true)
            },
            className: 'text-success hover:bg-success/10',
          },
        ticket.bill_file && {
          key: 'bill',
          label: 'Open bill',
          icon: <FileText />,
          onClick: () => openStoredFile(ticket.bill_file),
        },
        ticket.photo_file && {
          key: 'photo',
          label: 'Open photo',
          icon: <ImageIcon />,
          onClick: () => openStoredFile(ticket.photo_file),
        },
        canManage && {
          key: 'edit',
          label: 'Edit',
          icon: <Pencil />,
          onClick: () => openEdit(ticket),
        },
      ] as (SheetAction | false | null)[]
    ).filter((action): action is SheetAction => Boolean(action))

  const actions = (ticket: Ticket) => (
    <div className='inline-flex gap-1'>
      {ticketActions(ticket).map((action) => (
        <Button
          key={action.key}
          variant='ghost'
          size='icon-sm'
          aria-label={`${action.label}: ${ticket.title}`}
          title={action.label}
          className={action.className}
          onClick={(event) => {
            event.stopPropagation()
            action.onClick()
          }}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  )

  const onRowClick = (ticket: Ticket) => {
    if (isPhone()) setSheet(ticket)
    else if (canManage) openEdit(ticket)
  }

  const columns: Column<Ticket>[] = [
    {
      key: 'title',
      header: 'Work',
      cell: (ticket) => (
        <div className='grid min-w-0 gap-1'>
          <span className='flex flex-wrap items-center gap-1.5'>
            <span className='font-bold'>{ticket.title}</span>
            {ticket.fault_code && (
              <span className='font-mono text-xs font-semibold text-destructive'>
                {ticket.fault_code}
              </span>
            )}
          </span>
          <span className='line-clamp-1 text-xs text-muted-foreground'>
            {[
              ticket.category ? SERVICE_CATEGORY[ticket.category] : null,
              ticket.reported_by ? `Reported by ${ticket.reported_by.name}` : null,
              ticket.description,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      ),
    },
    { key: 'bus', header: 'Bus', cell: (ticket) => <BusCell vehicle={ticket.vehicle} /> },
    { key: 'source', header: 'Type', cell: (ticket) => <TicketBadges ticket={ticket} /> },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (ticket) => <StatusBadge ticket={ticket} />,
    },
    {
      key: 'opened_at',
      header: 'Opened',
      sortKey: 'opened_at',
      hideBelow: 'lg',
      cell: (ticket) => <span className='tabular'>{formatDate(ticket.opened_at)}</span>,
    },
    {
      key: 'closed_at',
      header: 'Closed',
      sortKey: 'closed_at',
      hideBelow: 'xl',
      cell: (ticket) => <span className='tabular'>{formatDate(ticket.closed_at)}</span>,
    },
    {
      key: 'cost',
      header: 'Cost',
      sortKey: 'cost',
      hideBelow: 'lg',
      cell: (ticket) => (
        <div className='grid'>
          <span className='tabular font-semibold'>{rupees(ticket.cost)}</span>
          {(ticket.parts_cost !== null || ticket.labour_cost !== null) && (
            <span className='tabular text-xs text-muted-foreground'>
              Parts {rupees(ticket.parts_cost ?? 0)} · Labour {rupees(ticket.labour_cost ?? 0)}
            </span>
          )}
          {vendorName(ticket) && (
            <span className='truncate text-xs text-muted-foreground'>{vendorName(ticket)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      className: 'w-28',
      cell: actions,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.status ||
    search.source ||
    search.vehicle_id ||
    search.kind ||
    search.category ||
    search.off_road !== undefined
  )

  return (
    <>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            tickets.data
              ? `${tickets.data.total} ${tickets.data.total === 1 ? 'ticket' : 'tickets'}`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search title, fault code or vendor'
            label='Search tickets'
          />
          <FilterSelect
            id='ticket-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={TICKET_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as MaintenanceSearch['status'] })}
          />
          <FilterSelect
            id='ticket-kind-filter'
            label='Filter by type'
            allLabel='Services and repairs'
            value={search.kind}
            options={TICKET_KIND_OPTIONS}
            onChange={(value) => setSearch({ kind: value as MaintenanceSearch['kind'] })}
          />
          <FilterSelect
            id='ticket-category-filter'
            label='Filter by category'
            allLabel='All categories'
            value={search.category}
            options={SERVICE_CATEGORY_OPTIONS}
            onChange={(value) => setSearch({ category: value as MaintenanceSearch['category'] })}
          />
          <FilterSelect
            id='ticket-source-filter'
            label='Filter by source'
            allLabel='All sources'
            value={search.source}
            options={TICKET_SOURCE_OPTIONS}
            onChange={(value) => setSearch({ source: value as MaintenanceSearch['source'] })}
          />
          <FilterSelect
            id='ticket-off-road-filter'
            label='Filter by off road'
            allLabel='Off road or not'
            value={search.off_road === undefined ? undefined : String(search.off_road)}
            options={OFF_ROAD_OPTIONS}
            onChange={(value) => setSearch({ off_road: value ? value === 'true' : undefined })}
          />
          <FilterSelect
            id='ticket-bus-filter'
            label='Filter by bus'
            allLabel='All buses'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) => setSearch({ vehicle_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(ticket) => ticket.id}
          loading={tickets.isFetching}
          error={tickets.isError ? tickets.error.message : null}
          onRetry={() => tickets.refetch()}
          onRowClick={onRowClick}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<MaintenanceSearch>)}
          empty={{
            icon: filtered ? CircleOff : Wrench,
            title: filtered ? 'No tickets match these filters' : 'No services or repairs yet',
            description: filtered
              ? 'Try another bus, type or status, or clear the filters.'
              : 'Tickets come from engine fault codes, driver reports and failed pre-trip checks, or you can add one by hand.',
            action: !filtered && canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add ticket
              </Button>
            ),
          }}
          card={(ticket) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-bold'>{ticket.title}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {ticket.vehicle.name} · {ticket.vehicle.registration_no}
                    {ticket.category ? ` · ${SERVICE_CATEGORY[ticket.category]}` : ''}
                    {ticket.fault_code ? ` · ${ticket.fault_code}` : ''}
                  </span>
                </div>
                <StatusBadge ticket={ticket} />
              </div>
              <TicketBadges ticket={ticket} />
              <span className='tabular text-xs text-muted-foreground'>
                Opened {formatDate(ticket.opened_at)}
                {ticket.closed_at ? ` · closed ${formatDate(ticket.closed_at)}` : ''}
                {ticket.cost !== null ? ` · ${rupees(ticket.cost)}` : ''}
                {ticket.odometer_km !== null
                  ? ` · ${formatNumber(ticket.odometer_km, 0, 'km')}`
                  : ''}
              </span>
              {ticket.reported_by && (
                <span className='text-xs text-muted-foreground'>
                  Reported by {ticket.reported_by.name}
                </span>
              )}
              {canManage && ticket.status !== 'done' && (
                <span className='text-xs font-semibold text-primary'>Tap to edit or close</span>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: tickets.data?.total ?? 0,
            label: 'tickets',
            onPageChange,
          }}
        />
      </Card>
      <TicketFormModal
        open={adding || editOpen}
        onOpenChange={(open) => {
          if (open) return
          onAddingChange(false)
          setEditOpen(false)
        }}
        ticket={editing}
        defaultVehicleId={search.vehicle_id}
      />
      <CloseTicketModal ticket={closing} open={closeOpen} onOpenChange={setCloseOpen} />
      <ActionSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => !open && setSheet(null)}
        title={sheet?.title ?? ''}
        description={sheet ? `${sheet.vehicle.name} · ${sheet.vehicle.registration_no}` : undefined}
        actions={sheet ? ticketActions(sheet) : []}
      />
    </>
  )
}
