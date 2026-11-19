import { useState, type ReactNode } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarClock,
  ChevronDown,
  FileText,
  HandHelping,
  History,
  ImageOff,
  Info,
  Pencil,
  Plus,
  Printer,
  SearchCheck,
  SearchX,
  ShieldOff,
  Trash2,
  Undo2,
  Wrench,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  inventoryApi,
  inventoryFiles,
  useAllocations,
  useAsset,
  useAssetHistory,
  useInventoryAccess,
  useInventoryMutation,
  useSchedules,
  useTickets,
  type Asset,
  type InventoryAccess,
  type Schedule,
} from '../api'
import { AllocateModal } from '../components/allocate-modal'
import { AssetFormModal } from '../components/asset-form-modal'
import { AssetStatusBadge, ConditionBadge } from '../components/asset-shared'
import { DecisionModal } from '../components/decision-modal'
import { DisposalModal } from '../components/disposal-modal'
import type { PickedAsset } from '../components/pickers'
import { ReturnModal } from '../components/return-modal'
import { ScheduleModal } from '../components/schedule-modal'
import { OpenTicketModal } from '../components/ticket-modals'
import { TransferModal } from '../components/transfer-modal'
import {
  ALLOCATION_STATUS,
  ASSET_CONDITION,
  ASSIGNEE_TYPE,
  EVENT_KIND,
  FUNDING_SOURCE,
  SCHEDULE_STATE,
  TICKET_KIND,
  TICKET_PRIORITY,
  TICKET_STATUS,
  WARRANTY_STATE,
  assigneeText,
  money,
  openInventoryFile,
  reportError,
} from '../labels'
import type { AssetPageTab } from '../search'

const route = getRouteApi('/_app/inventory/assets/$assetId')

type Dialog =
  | 'edit'
  | 'allocate'
  | 'return'
  | 'transfer'
  | 'ticket'
  | 'lost'
  | 'found'
  | 'dispose'
  | 'delete'
  | 'schedule'

export function AssetPage() {
  const { assetId } = route.useParams()
  const { tab } = route.useSearch()
  const navigate = useNavigate()
  const id = Number(assetId)
  const asset = useAsset(Number.isFinite(id) && id > 0 ? id : null)
  const access = useInventoryAccess()

  useShortcut('app.refresh', () => void asset.refetch())

  if (asset.isPending) return <AssetSkeleton />

  if (asset.isError) {
    return (
      <Page>
        <Card>
          {asset.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Asset not found'
              description='It may have been deleted, or the link is wrong.'
              action={
                <Button asChild variant='outline'>
                  <Link to='/inventory' search={{ tab: 'assets' }}>
                    Back to assets
                  </Link>
                </Button>
              }
            />
          ) : (
            <ErrorState message={asset.error.message} onRetry={() => asset.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  const data = asset.data
  const go = (next: AssetPageTab) =>
    navigate({
      to: '/inventory/assets/$assetId',
      params: { assetId },
      search: { tab: next },
      replace: true,
    })

  return (
    <Page>
      <Link
        to='/inventory'
        search={{ tab: 'assets' }}
        className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        All assets
      </Link>
      <AssetHeader asset={data} access={access} />
      <PageTabs
        label='Asset sections'
        value={tab}
        onChange={go}
        tabs={[
          { value: 'details', label: 'Details', icon: Info },
          {
            value: 'maintenance',
            label: 'Maintenance',
            icon: Wrench,
            count: data.open_tickets || undefined,
          },
          { value: 'allocations', label: 'Allocations', icon: HandHelping },
          { value: 'history', label: 'History', icon: History },
        ]}
      />
      {tab === 'details' && <DetailsSection asset={data} />}
      {tab === 'maintenance' && <MaintenanceSection asset={data} access={access} />}
      {tab === 'allocations' && <AllocationsSection asset={data} />}
      {tab === 'history' && <HistorySection asset={data} />}
    </Page>
  )
}

function AssetHeader({ asset, access }: { asset: Asset; access: InventoryAccess }) {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const markLost = useInventoryMutation((note: string) => inventoryApi.markLost(asset.id, note))
  const markFound = useInventoryMutation(() => inventoryApi.markFound(asset.id))
  const remove = useInventoryMutation(() => inventoryApi.removeAsset(asset.id))
  const picked: PickedAsset = {
    id: asset.id,
    asset_tag: asset.asset_tag,
    name: asset.name,
    status: asset.status,
  }
  const live = asset.status !== 'lost' && asset.status !== 'disposed'
  const close = (next: boolean) => !next && setDialog(null)
  const printLabel = () =>
    openInventoryFile(inventoryFiles.labels, inventoryFiles.labelsParams({ asset_ids: [asset.id] }))

  const primary =
    asset.status === 'in_store'
      ? { label: 'Allocate', icon: HandHelping, dialog: 'allocate' as const }
      : asset.status === 'allocated'
        ? { label: 'Take back', icon: Undo2, dialog: 'return' as const }
        : asset.status === 'lost'
          ? { label: 'Mark found', icon: SearchCheck, dialog: 'found' as const }
          : null

  return (
    <Card className='gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start gap-4'>
        <div className='grid min-w-0 flex-1 gap-1.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl font-extrabold tracking-tight'>{asset.name}</h1>
            <AssetStatusBadge status={asset.status} />
            <ConditionBadge condition={asset.condition} />
          </div>
          <p className='text-sm text-muted-foreground'>
            <span className='font-mono font-semibold text-foreground'>{asset.asset_tag}</span>
            {' · '}
            {asset.category.name}
            {asset.serial_no ? ` · S/N ${asset.serial_no}` : ''}
          </p>
          <div className='flex flex-wrap gap-1.5'>
            <Badge tone={WARRANTY_STATE[asset.warranty_state].tone}>
              {WARRANTY_STATE[asset.warranty_state].label}
              {asset.warranty_until ? ` · ${formatDate(asset.warranty_until)}` : ''}
            </Badge>
            {asset.open_tickets > 0 && (
              <Badge tone='warning'>
                {asset.open_tickets} open {asset.open_tickets === 1 ? 'ticket' : 'tickets'}
              </Badge>
            )}
            {asset.current_allocation?.overdue && <Badge tone='danger'>Return overdue</Badge>}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={printLabel}>
            <Printer />
            Label
          </Button>
          {access.manage && primary && (
            <Button onClick={() => setDialog(primary.dialog)}>
              <primary.icon />
              {primary.label}
            </Button>
          )}
          {access.manage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  More
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setDialog('edit')}>
                  <Pencil />
                  Edit details
                </DropdownMenuItem>
                {live && (
                  <DropdownMenuItem onSelect={() => setDialog('transfer')}>
                    <ArrowRightLeft />
                    Transfer
                  </DropdownMenuItem>
                )}
                {live && (
                  <DropdownMenuItem onSelect={() => setDialog('ticket')}>
                    <Wrench />
                    Open repair ticket
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {live && (
                  <DropdownMenuItem destructive onSelect={() => setDialog('lost')}>
                    <ShieldOff />
                    Mark lost
                  </DropdownMenuItem>
                )}
                {asset.status !== 'allocated' && asset.status !== 'disposed' && (
                  <DropdownMenuItem destructive onSelect={() => setDialog('dispose')}>
                    <Trash2 />
                    Dispose
                  </DropdownMenuItem>
                )}
                {asset.status === 'in_store' && (
                  <DropdownMenuItem destructive onSelect={() => setDialog('delete')}>
                    <Trash2 />
                    Delete (registered by mistake)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {asset.current_allocation && (
        <div className='flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm'>
          <Fact
            label={`With (${ASSIGNEE_TYPE[asset.current_allocation.assignee.type].toLowerCase()})`}
            value={assigneeText(asset.current_allocation.assignee)}
          />
          <Fact label='Since' value={formatDate(asset.current_allocation.allocated_on)} />
          <Fact
            label='Due back'
            value={formatDate(asset.current_allocation.expected_return_on)}
            tone={asset.current_allocation.overdue ? 'text-destructive' : undefined}
          />
          <Fact
            label='Received'
            value={
              asset.current_allocation.acknowledged_at
                ? formatDateTime(asset.current_allocation.acknowledged_at)
                : 'Not yet'
            }
            tone={asset.current_allocation.acknowledged_at ? 'text-success' : 'text-warning'}
          />
        </div>
      )}

      {dialog === 'edit' && <AssetFormModal open onOpenChange={close} asset={asset} />}
      <AllocateModal open={dialog === 'allocate'} onOpenChange={close} assets={[picked]} />
      <ReturnModal open={dialog === 'return'} onOpenChange={close} assets={[picked]} />
      <TransferModal open={dialog === 'transfer'} onOpenChange={close} assets={[picked]} />
      <OpenTicketModal open={dialog === 'ticket'} onOpenChange={close} asset={picked} />
      <DisposalModal open={dialog === 'dispose'} onOpenChange={close} asset={picked} />
      <DecisionModal
        open={dialog === 'lost'}
        onOpenChange={close}
        mode='reject'
        title={`Mark ${asset.asset_tag} lost?`}
        description='Any active allocation is closed. You can mark it found later.'
        noteLabel='What happened'
        placeholder='Missing after the annual day'
        submitText='Mark lost'
        loading={markLost.isPending}
        onSubmit={async (note) => {
          await markLost.mutateAsync(note ?? '')
          alerts.success(`${asset.asset_tag} marked lost`)
          setDialog(null)
        }}
      />
      <ConfirmDialog
        open={dialog === 'found'}
        onOpenChange={close}
        title={`${asset.asset_tag} was found?`}
        description='It goes back into store. Allocate it again when needed.'
        confirmText='Mark found'
        loading={markFound.isPending}
        onConfirm={async () => {
          try {
            await markFound.mutateAsync(undefined)
            alerts.success(`${asset.asset_tag} is back in store`)
          } catch (error) {
            reportError(error)
          }
          setDialog(null)
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={close}
        title={`Delete ${asset.asset_tag}?`}
        description='Only for an asset registered by mistake. Assets that were ever allocated keep their history and cannot be deleted; dispose of them instead.'
        confirmText='Delete asset'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(undefined)
            alerts.success(`${asset.asset_tag} deleted`)
            setDialog(null)
            void navigate({ to: '/inventory', search: { tab: 'assets' } })
          } catch (error) {
            reportError(error)
            setDialog(null)
          }
        }}
      />
    </Card>
  )
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className='grid'>
      <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      <span className={cn('font-semibold', tone)}>{value}</span>
    </div>
  )
}

function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('gap-4 p-4 sm:p-5', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='font-bold'>{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

function DetailsSection({ asset }: { asset: Asset }) {
  return (
    <div className='grid gap-4 lg:grid-cols-3'>
      <SectionCard title='Details' className='lg:col-span-2'>
        <DetailList
          items={[
            { label: 'Asset tag', value: asset.asset_tag, mono: true },
            { label: 'Category', value: asset.category.name },
            { label: 'Make', value: asset.make ?? '—' },
            { label: 'Model', value: asset.model ?? '—' },
            {
              label: 'Serial number',
              value: asset.serial_no ?? '—',
              mono: Boolean(asset.serial_no),
            },
            { label: 'Condition', value: ASSET_CONDITION[asset.condition].label },
            { label: 'Location', value: asset.location?.name ?? '—' },
            { label: 'Store', value: asset.store?.name ?? '—' },
            { label: 'Department', value: asset.department?.name ?? '—' },
            {
              label: 'Custodian',
              value: asset.custodian
                ? `${asset.custodian.name}${asset.custodian.detail ? ` · ${asset.custodian.detail}` : ''}`
                : '—',
            },
            { label: 'Next maintenance', value: formatDate(asset.next_maintenance_on) },
            { label: 'Registered', value: formatDateTime(asset.created_at) },
          ]}
        />
        {asset.description && (
          <p className='border-t pt-3 text-sm text-muted-foreground'>{asset.description}</p>
        )}
        {asset.notes && <p className='rounded-md bg-muted/60 px-3 py-2 text-sm'>{asset.notes}</p>}
      </SectionCard>

      <SectionCard title='Photo'>
        {asset.photo_url ? (
          <img
            src={asset.photo_url}
            alt={asset.name}
            className='aspect-[4/3] w-full rounded-lg border object-cover'
          />
        ) : (
          <div className='grid aspect-[4/3] place-items-center rounded-lg border border-dashed text-muted-foreground'>
            <span className='grid justify-items-center gap-1 text-sm'>
              <ImageOff className='size-6' />
              No photo
            </span>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title='Purchase'
        className='lg:col-span-2'
        action={
          asset.invoice_file_id && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => openInventoryFile(inventoryFiles.fileContent(asset.invoice_file_id!))}
            >
              <FileText />
              Open invoice
            </Button>
          )
        }
      >
        <DetailList
          items={[
            { label: 'Vendor', value: asset.vendor?.name ?? '—' },
            { label: 'Invoice number', value: asset.invoice_no ?? '—' },
            { label: 'Purchase date', value: formatDate(asset.purchase_date) },
            { label: 'Funded by', value: FUNDING_SOURCE[asset.funding_source] },
            { label: 'Cost', value: money(asset.cost) },
            { label: 'Book value today', value: money(asset.book_value) },
            { label: 'Residual value', value: money(asset.residual_value) },
          ]}
        />
      </SectionCard>

      <SectionCard title='Warranty and AMC'>
        <DetailList
          className='sm:grid-cols-1'
          items={[
            {
              label: 'Warranty',
              value: (
                <span className='flex flex-wrap items-center gap-2'>
                  {formatDate(asset.warranty_until)}
                  <Badge tone={WARRANTY_STATE[asset.warranty_state].tone}>
                    {WARRANTY_STATE[asset.warranty_state].label}
                  </Badge>
                </span>
              ),
            },
            { label: 'AMC until', value: formatDate(asset.amc_until) },
            { label: 'AMC vendor', value: asset.amc_vendor?.name ?? '—' },
          ]}
        />
      </SectionCard>
    </div>
  )
}

function MaintenanceSection({ asset, access }: { asset: Asset; access: InventoryAccess }) {
  const tickets = useTickets({ asset_id: asset.id, page: 1, limit: 50, sort: 'opened_at' })
  const schedules = useSchedules({ asset_id: asset.id, page: 1, limit: 50 })
  const start = useInventoryMutation((id: number) => inventoryApi.startSchedule(id))
  const [ticketOpen, setTicketOpen] = useState(false)
  const [schedule, setSchedule] = useState<{ item: Schedule | null } | null>(null)
  const live = asset.status !== 'lost' && asset.status !== 'disposed'
  const picked: PickedAsset = {
    id: asset.id,
    asset_tag: asset.asset_tag,
    name: asset.name,
    status: asset.status,
  }

  const startWork = async (item: Schedule) => {
    try {
      const ticket = await start.mutateAsync(item.id)
      alerts.success(`${ticket.ticket_no} opened`)
    } catch (error) {
      reportError(error)
    }
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <SectionCard
        title='Repair tickets'
        action={
          access.manage &&
          live && (
            <Button size='sm' onClick={() => setTicketOpen(true)}>
              <Plus />
              Open ticket
            </Button>
          )
        }
      >
        {tickets.isError ? (
          <ErrorState message={tickets.error.message} onRetry={() => tickets.refetch()} />
        ) : tickets.isPending ? (
          <Skeleton className='h-32' />
        ) : tickets.data.items.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title='No tickets'
            description='Repairs and services show here.'
          />
        ) : (
          <ul className='grid divide-y rounded-lg border'>
            {tickets.data.items.map((ticket) => (
              <li key={ticket.id} className='grid gap-1 px-3 py-2.5'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='truncate font-semibold'>{ticket.title}</span>
                    <span className='font-mono text-[11px] text-muted-foreground'>
                      {ticket.ticket_no} · {TICKET_KIND[ticket.kind]}
                    </span>
                  </span>
                  <span className='flex gap-1'>
                    <Badge tone={TICKET_PRIORITY[ticket.priority].tone}>
                      {TICKET_PRIORITY[ticket.priority].label}
                    </Badge>
                    <Badge tone={TICKET_STATUS[ticket.status].tone} dot>
                      {TICKET_STATUS[ticket.status].label}
                    </Badge>
                  </span>
                </div>
                <span className='text-xs text-muted-foreground'>
                  Opened {formatDate(ticket.opened_at)}
                  {ticket.resolved_at ? ` · resolved ${formatDate(ticket.resolved_at)}` : ''}
                  {ticket.downtime_days !== null ? ` · ${ticket.downtime_days} days down` : ''}
                  {ticket.cost !== null ? ` · ${money(ticket.cost)}` : ''}
                </span>
                {ticket.resolution && <span className='text-sm'>{ticket.resolution}</span>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title='Preventive schedules'
        action={
          access.manage &&
          live && (
            <Button size='sm' variant='outline' onClick={() => setSchedule({ item: null })}>
              <Plus />
              Add schedule
            </Button>
          )
        }
      >
        {schedules.isError ? (
          <ErrorState message={schedules.error.message} onRetry={() => schedules.refetch()} />
        ) : schedules.isPending ? (
          <Skeleton className='h-32' />
        ) : schedules.data.items.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title='No schedules'
            description='Add one for regular servicing, like an AC service every 6 months.'
          />
        ) : (
          <ul className='grid divide-y rounded-lg border'>
            {schedules.data.items.map((item) => (
              <li key={item.id} className='flex flex-wrap items-center gap-2 px-3 py-2.5'>
                <span className='grid min-w-0 flex-1'>
                  <span className='truncate font-semibold'>{item.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    Every {item.interval_days} days · next {formatDate(item.next_due_on)}
                    {item.last_done_on ? ` · last ${formatDate(item.last_done_on)}` : ''}
                  </span>
                </span>
                {item.is_active ? (
                  <Badge tone={SCHEDULE_STATE[item.state].tone}>
                    {SCHEDULE_STATE[item.state].label}
                  </Badge>
                ) : (
                  <Badge>Paused</Badge>
                )}
                {access.manage && (
                  <span className='flex gap-1'>
                    {item.is_active && !item.open_ticket_id && item.state !== 'scheduled' && (
                      <Button
                        size='sm'
                        variant='outline'
                        loading={start.isPending && start.variables === item.id}
                        onClick={() => void startWork(item)}
                      >
                        Start
                      </Button>
                    )}
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={`Edit ${item.title}`}
                      onClick={() => setSchedule({ item })}
                    >
                      <Pencil />
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <OpenTicketModal open={ticketOpen} onOpenChange={setTicketOpen} asset={picked} />
      <ScheduleModal
        open={Boolean(schedule)}
        onOpenChange={(next) => !next && setSchedule(null)}
        schedule={schedule?.item ?? null}
        asset={picked}
      />
    </div>
  )
}

function AllocationsSection({ asset }: { asset: Asset }) {
  const allocations = useAllocations({
    asset_id: asset.id,
    page: 1,
    limit: 50,
    sort: 'allocated_on',
    order: 'desc',
  })
  return (
    <SectionCard title='Who had it'>
      {allocations.isError ? (
        <ErrorState message={allocations.error.message} onRetry={() => allocations.refetch()} />
      ) : allocations.isPending ? (
        <Skeleton className='h-32' />
      ) : allocations.data.items.length === 0 ? (
        <EmptyState
          icon={HandHelping}
          title='Never allocated'
          description='It has stayed in store.'
        />
      ) : (
        <ul className='grid divide-y rounded-lg border'>
          {allocations.data.items.map((allocation) => (
            <li key={allocation.id} className='grid gap-1 px-3 py-2.5'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>
                    {assigneeText(allocation.assignee)}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {ASSIGNEE_TYPE[allocation.assignee.type]}
                  </span>
                </span>
                <span className='flex flex-wrap gap-1'>
                  <Badge tone={ALLOCATION_STATUS[allocation.status].tone} dot>
                    {ALLOCATION_STATUS[allocation.status].label}
                  </Badge>
                  {allocation.overdue && <Badge tone='danger'>Overdue</Badge>}
                </span>
              </div>
              <span className='tabular text-xs text-muted-foreground'>
                {formatDate(allocation.allocated_on)}
                {allocation.allocated_by ? ` by ${allocation.allocated_by}` : ''} →{' '}
                {allocation.returned_on
                  ? `returned ${formatDate(allocation.returned_on)}${allocation.return_condition ? ` (${ASSET_CONDITION[allocation.return_condition].label.toLowerCase()})` : ''}`
                  : allocation.expected_return_on
                    ? `due ${formatDate(allocation.expected_return_on)}`
                    : 'no return date'}
              </span>
              {allocation.remarks && <span className='text-sm'>{allocation.remarks}</span>}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function HistorySection({ asset }: { asset: Asset }) {
  const history = useAssetHistory(asset.id)
  return (
    <SectionCard title='Timeline'>
      {history.isError ? (
        <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
      ) : history.isPending ? (
        <Skeleton className='h-40' />
      ) : history.data.length === 0 ? (
        <EmptyState icon={History} title='Nothing recorded yet' />
      ) : (
        <ol className='grid gap-0'>
          {history.data.map((event, index) => (
            <li key={event.id} className='grid grid-cols-[1rem_1fr] gap-3'>
              <span className='relative flex justify-center'>
                <span
                  className={cn(
                    'mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-card ring-2',
                    EVENT_KIND[event.kind].tone === 'danger'
                      ? 'bg-destructive ring-destructive/30'
                      : EVENT_KIND[event.kind].tone === 'success'
                        ? 'bg-success ring-success/30'
                        : EVENT_KIND[event.kind].tone === 'warning'
                          ? 'bg-warning ring-warning/30'
                          : 'bg-primary ring-primary/30'
                  )}
                />
                {index < history.data.length - 1 && (
                  <span className='absolute top-4 bottom-0 w-px bg-border' />
                )}
              </span>
              <div className='grid gap-0.5 pb-4'>
                <span className='text-sm font-semibold'>{EVENT_KIND[event.kind].label}</span>
                {event.note && <span className='text-sm text-muted-foreground'>{event.note}</span>}
                <span className='text-xs text-muted-foreground'>
                  {formatDateTime(event.created_at)}
                  {event.actor ? ` · ${event.actor}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}

function AssetSkeleton() {
  return (
    <Page>
      <Skeleton className='h-5 w-24' />
      <Card className='gap-3 p-5'>
        <Skeleton className='h-7 w-64' />
        <Skeleton className='h-4 w-80' />
        <Skeleton className='h-6 w-48' />
      </Card>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-64 w-full' />
    </Page>
  )
}
