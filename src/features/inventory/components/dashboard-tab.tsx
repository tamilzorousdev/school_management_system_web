import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  BadgeIndianRupee,
  Boxes,
  CalendarClock,
  ClipboardList,
  HandHelping,
  Package,
  PackageX,
  ShieldAlert,
  Trash2,
  Undo2,
  Wrench,
} from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  inventoryApi,
  useInventoryDashboard,
  useInventoryMutation,
  type Disposal,
  type InventoryAccess,
} from '../api'
import {
  assigneeText,
  DISPOSAL_METHOD,
  qty,
  REQUISITION_STATUS,
  SCHEDULE_STATE,
  TRANSFER_STATUS,
  WARRANTY_STATE,
  wholeMoney,
} from '../labels'
import type { InventorySearch, InventorySearchPatch } from '../search'
import { DecisionModal } from './decision-modal'
import { ScanInput } from './pickers'
import { ReceiveStockModal } from './receive-modal'

type Search = Partial<InventorySearch>

export function DashboardTab({
  access,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const navigate = useNavigate()
  const dashboard = useInventoryDashboard()
  const [scanError, setScanError] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)
  const [receiving, setReceiving] = useState<number | null>(null)
  const [deciding, setDeciding] = useState<{
    disposal: Disposal
    mode: 'approve' | 'reject'
  } | null>(null)
  const start = useInventoryMutation(inventoryApi.startSchedule)
  const decide = useInventoryMutation(
    ({ id, mode, note }: { id: number; mode: 'approve' | 'reject'; note: string | null }) =>
      mode === 'approve'
        ? inventoryApi.approveDisposal(id, note)
        : inventoryApi.rejectDisposal(id, note ?? '')
  )

  const go = (search: Search) =>
    navigate({ to: '/inventory', search: { tab: 'dashboard', ...search } })
  const openAsset = (id: number) =>
    navigate({
      to: '/inventory/assets/$assetId',
      params: { assetId: String(id) },
      search: { tab: 'details' },
    })

  const lookup = async (code: string) => {
    setScanError(null)
    setLooking(true)
    try {
      const asset = await inventoryApi.lookup(code)
      await openAsset(asset.id)
    } catch (error) {
      const apiError = toApiError(error)
      setScanError(
        apiError.isNotFound ? `No asset with the tag or serial "${code}"` : apiError.message
      )
    } finally {
      setLooking(false)
    }
  }

  const startSchedule = async (id: number) => {
    try {
      const ticket = await start.mutateAsync(id)
      alerts.success(`Ticket ${ticket.ticket_no} opened`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  if (dashboard.isError && !dashboard.data) {
    return (
      <Card>
        <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
      </Card>
    )
  }

  const data = dashboard.data
  const assets = data?.assets
  const stock = data?.stock
  const cards: Insight[] = [
    {
      key: 'assets',
      label: 'Assets',
      value: qty(assets?.total ?? 0),
      hint: `${wholeMoney(assets?.total_cost ?? 0)} cost`,
      icon: Boxes,
      tone: 'primary',
      onClick: () => go({ tab: 'assets' }),
    },
    {
      key: 'book',
      label: 'Book value',
      value: wholeMoney(assets?.book_value ?? 0),
      hint: 'After depreciation',
      icon: BadgeIndianRupee,
      tone: 'info',
      onClick: () => go({ tab: 'reports', view: 'assets' }),
    },
    {
      key: 'allocated',
      label: 'Allocated',
      value: qty(assets?.allocated ?? 0),
      hint: `${assets?.in_store ?? 0} in store · ${assets?.in_maintenance ?? 0} in repair`,
      icon: HandHelping,
      tone: 'success',
      onClick: () => go({ tab: 'assets', status: 'allocated' }),
    },
    {
      key: 'warranty',
      label: 'Warranty ending',
      value: qty(assets?.warranty_expiring ?? 0),
      hint: 'Warranty or AMC',
      icon: ShieldAlert,
      tone: assets?.warranty_expiring ? 'warning' : 'success',
      onClick: () => go({ tab: 'assets', warranty: 'expiring' }),
    },
    {
      key: 'overdue',
      label: 'Overdue returns',
      value: qty(assets?.overdue_returns ?? 0),
      hint: `${assets?.unacknowledged ?? 0} not acknowledged`,
      icon: Undo2,
      tone: assets?.overdue_returns ? 'danger' : 'success',
      onClick: () => go({ tab: 'allocations', status: 'active', overdue: true }),
    },
    {
      key: 'stock',
      label: 'Stock value',
      value: wholeMoney(stock?.stock_value ?? 0),
      hint: `${stock?.items ?? 0} items`,
      icon: Package,
      tone: 'primary',
      onClick: () => go({ tab: 'stock' }),
    },
    {
      key: 'low',
      label: 'Low stock',
      value: qty(stock?.low_stock ?? 0),
      hint: `${stock?.out_of_stock ?? 0} out of stock`,
      icon: PackageX,
      tone: stock?.out_of_stock ? 'danger' : stock?.low_stock ? 'warning' : 'success',
      onClick: () => go({ tab: 'stock', low: true }),
    },
    {
      key: 'tickets',
      label: 'Open repairs',
      value: qty(data?.open_tickets ?? 0),
      hint: `${data?.maintenance_due ?? 0} services due`,
      icon: Wrench,
      tone: data?.open_tickets ? 'warning' : 'success',
      onClick: () => go({ tab: 'maintenance', view: 'tickets', active: true }),
    },
    {
      key: 'due',
      label: 'Maintenance due',
      value: qty(data?.maintenance_due ?? 0),
      hint: 'Overdue or due soon',
      icon: CalendarClock,
      tone: data?.maintenance_due ? 'warning' : 'success',
      onClick: () => go({ tab: 'maintenance', view: 'schedules' }),
    },
    {
      key: 'transfers',
      label: 'Transfers waiting',
      value: qty(data?.pending_transfers ?? 0),
      hint: 'For approval',
      icon: ArrowRightLeft,
      tone: data?.pending_transfers ? 'warning' : 'neutral',
      onClick: () => go({ tab: 'transfers', status: 'requested' }),
    },
    {
      key: 'requisitions',
      label: 'Requisitions waiting',
      value: qty(stock?.pending_requisitions ?? 0),
      hint: `${stock?.to_issue ?? 0} approved, to issue`,
      icon: ClipboardList,
      tone: stock?.pending_requisitions ? 'warning' : 'neutral',
      onClick: () => go({ tab: 'requisitions', status: 'pending' }),
    },
    {
      key: 'disposals',
      label: 'Disposals waiting',
      value: qty(data?.pending_disposals ?? 0),
      hint: 'For approval',
      icon: Trash2,
      tone: data?.pending_disposals ? 'warning' : 'neutral',
      onClick: () => go({ tab: 'disposals', status: 'requested' }),
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='grid gap-2 p-4'>
        <div className='grid gap-0.5'>
          <h2 className='font-bold'>Find an asset</h2>
          <p className='text-xs text-muted-foreground'>
            Scan the tag label or type the tag or serial number.
          </p>
        </div>
        <ScanInput
          id='inventory-lookup'
          label='Scan or type an asset tag'
          placeholder='Asset tag or serial number'
          loading={looking}
          autoFocus={false}
          onSubmit={lookup}
        />
        {scanError && (
          <p role='alert' className='text-sm font-medium text-destructive'>
            {scanError}
          </p>
        )}
      </Card>

      <InsightCards items={cards} loading={dashboard.isPending} />

      <div className='grid gap-4 lg:grid-cols-2'>
        <ListCard
          title='Low stock'
          empty='Every item is above its reorder level.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'stock', low: true })}
          rows={(data?.low_stock ?? []).map((item) => ({
            key: item.id,
            title: (
              <Link
                to='/inventory/stock/$itemId'
                params={{ itemId: String(item.id) }}
                search={{}}
                className='hover:underline'
              >
                {item.name}
              </Link>
            ),
            detail: `${qty(item.quantity, item.unit)} left · reorder at ${qty(item.reorder_level, item.unit)}`,
            badge:
              item.quantity <= 0 ? (
                <Badge tone='danger'>Out</Badge>
              ) : (
                <Badge tone='warning'>Low</Badge>
              ),
            action: access.stock && (
              <Button size='sm' variant='outline' onClick={() => setReceiving(item.id)}>
                Receive
              </Button>
            ),
          }))}
        />
        <ListCard
          title='Maintenance due'
          empty='No preventive maintenance is due.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'maintenance', view: 'schedules' })}
          rows={(data?.maintenance_due_list ?? []).map((schedule) => ({
            key: schedule.id,
            title: schedule.title,
            detail: `${schedule.asset.name} · due ${formatDate(schedule.next_due_on)}`,
            badge: (
              <Badge tone={SCHEDULE_STATE[schedule.state].tone}>
                {SCHEDULE_STATE[schedule.state].label}
              </Badge>
            ),
            action:
              access.manage &&
              (schedule.open_ticket_id ? (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() =>
                    go({ tab: 'maintenance', view: 'tickets', open: schedule.open_ticket_id! })
                  }
                >
                  Ticket open
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  loading={start.isPending && start.variables === schedule.id}
                  onClick={() => void startSchedule(schedule.id)}
                >
                  Start
                </Button>
              )),
          }))}
        />
        <ListCard
          title='Warranty ending soon'
          empty='No warranty or AMC is ending soon.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'assets', warranty: 'expiring' })}
          rows={(data?.warranty_expiring ?? []).map((asset) => ({
            key: asset.id,
            title: asset.name,
            detail: `${asset.asset_tag} · ${
              asset.warranty_until ? `warranty to ${formatDate(asset.warranty_until)}` : ''
            }${asset.amc_until ? ` · AMC to ${formatDate(asset.amc_until)}` : ''}`,
            badge: (
              <Badge tone={WARRANTY_STATE[asset.warranty_state].tone}>
                {WARRANTY_STATE[asset.warranty_state].label}
              </Badge>
            ),
            onClick: () => void openAsset(asset.id),
          }))}
        />
        <ListCard
          title='Overdue returns'
          empty='Nothing is overdue.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'allocations', status: 'active', overdue: true })}
          rows={(data?.overdue_returns ?? []).map((allocation) => ({
            key: allocation.id,
            title: allocation.asset.name,
            detail: `${assigneeText(allocation.assignee)} · due ${formatDate(allocation.expected_return_on)}`,
            badge: <Badge tone='danger'>Overdue</Badge>,
            onClick: () => void openAsset(allocation.asset.id),
          }))}
        />
        <ListCard
          title='Requisitions waiting'
          empty='No requisitions waiting.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'requisitions', status: 'pending' })}
          rows={(data?.requisitions ?? []).map((requisition) => ({
            key: requisition.id,
            title: requisition.requisition_no,
            detail: `${requisition.purpose} · ${
              requisition.department?.name ??
              requisition.requested_for?.name ??
              requisition.store.name
            }`,
            badge: (
              <Badge tone={REQUISITION_STATUS[requisition.status].tone}>
                {REQUISITION_STATUS[requisition.status].label}
              </Badge>
            ),
            onClick: () => go({ tab: 'requisitions', open: requisition.id }),
          }))}
        />
        <ListCard
          title='Transfers waiting'
          empty='No transfers waiting for approval.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'transfers', status: 'requested' })}
          rows={(data?.transfers ?? []).map((transfer) => ({
            key: transfer.id,
            title: transfer.transfer_no,
            detail: `${transfer.items.length} ${transfer.items.length === 1 ? 'asset' : 'assets'} to ${assigneeText(transfer.to)}`,
            badge: (
              <Badge tone={TRANSFER_STATUS[transfer.status].tone}>
                {TRANSFER_STATUS[transfer.status].label}
              </Badge>
            ),
            onClick: () => go({ tab: 'transfers', open: transfer.id }),
          }))}
        />
        <ListCard
          title='Disposals waiting'
          empty='No disposals waiting for approval.'
          loading={dashboard.isPending}
          onViewAll={() => go({ tab: 'disposals', status: 'requested' })}
          rows={(data?.disposals ?? []).map((disposal) => ({
            key: disposal.id,
            title: disposal.asset.name,
            detail: `${DISPOSAL_METHOD[disposal.method]} · ${disposal.reason}`,
            action: access.approve && disposal.status === 'requested' && (
              <div className='flex gap-1'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setDeciding({ disposal, mode: 'approve' })}
                >
                  Approve
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-destructive hover:bg-destructive/10'
                  onClick={() => setDeciding({ disposal, mode: 'reject' })}
                >
                  Reject
                </Button>
              </div>
            ),
          }))}
        />
      </div>

      <ReceiveStockModal
        open={receiving !== null}
        onOpenChange={(open) => !open && setReceiving(null)}
        itemId={receiving ?? undefined}
      />
      <DecisionModal
        open={Boolean(deciding)}
        onOpenChange={(open) => !open && setDeciding(null)}
        mode={deciding?.mode ?? 'approve'}
        title={
          deciding?.mode === 'reject'
            ? `Reject disposal of ${deciding.disposal.asset.name}?`
            : `Approve disposal of ${deciding?.disposal.asset.name ?? 'asset'}?`
        }
        description={
          deciding?.mode === 'reject'
            ? 'The asset stays on the register.'
            : 'The asset leaves the active register.'
        }
        loading={decide.isPending}
        onSubmit={async (note) => {
          if (!deciding) return
          await decide.mutateAsync({ id: deciding.disposal.id, mode: deciding.mode, note })
          alerts.success(deciding.mode === 'approve' ? 'Disposal approved' : 'Disposal rejected')
          setDeciding(null)
        }}
      />
    </div>
  )
}

interface ListRow {
  key: number
  title: ReactNode
  detail: string
  badge?: ReactNode
  action?: ReactNode
  onClick?: () => void
}

function ListCard({
  title,
  rows,
  empty,
  loading,
  onViewAll,
}: {
  title: string
  rows: ListRow[]
  empty: string
  loading: boolean
  onViewAll: () => void
}) {
  return (
    <Card className='overflow-hidden'>
      <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
        <h3 className='font-bold'>{title}</h3>
        <Button size='sm' variant='ghost' onClick={onViewAll}>
          View all
        </Button>
      </div>
      {loading ? (
        <div className='grid gap-2 p-4'>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className='h-10' />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className='px-4 py-6 text-center text-sm text-muted-foreground'>{empty}</p>
      ) : (
        <ul className='grid divide-y'>
          {rows.map((row) => (
            <li key={row.key} className='flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5'>
              {row.onClick ? (
                <button
                  type='button'
                  onClick={row.onClick}
                  className='grid min-w-0 flex-1 text-left outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40'
                >
                  <span className='truncate text-sm font-semibold'>{row.title}</span>
                  <span className='truncate text-xs text-muted-foreground'>{row.detail}</span>
                </button>
              ) : (
                <span className='grid min-w-0 flex-1'>
                  <span className='truncate text-sm font-semibold'>{row.title}</span>
                  <span className='truncate text-xs text-muted-foreground'>{row.detail}</span>
                </span>
              )}
              {row.badge}
              {row.action}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
