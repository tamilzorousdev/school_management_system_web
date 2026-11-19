import { useState, type ReactNode } from 'react'
import { ArrowRight, ArrowRightLeft, Check, CircleOff, Plus, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  TRANSFER_STATUSES,
  inventoryApi,
  useInventoryMutation,
  useTransfer,
  useTransfers,
  type InventoryAccess,
  type Transfer,
} from '../api'
import { ASSIGNEE_TYPE, TRANSFER_STATUS, assigneeText, options, reportError } from '../labels'
import { pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { DecisionModal } from './decision-modal'
import { TransferModal } from './transfer-modal'

const LIMIT = 20
const STATUS_OPTIONS = options(TRANSFER_STATUS)

type Decision = { transfer: Transfer; mode: 'approve' | 'reject' }

export function TransfersTab(props: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const { search, onChange, access } = props
  const [creating, setCreating] = useState(false)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [cancelling, setCancelling] = useState<Transfer | null>(null)
  const status = pick(TRANSFER_STATUSES, search.status)
  const page = search.page ?? 1
  const transfers = useTransfers({ page, limit: LIMIT, search: search.search, status })
  const approve = useInventoryMutation(({ id, note }: { id: number; note: string | null }) =>
    inventoryApi.approveTransfer(id, note)
  )
  const reject = useInventoryMutation(({ id, note }: { id: number; note: string }) =>
    inventoryApi.rejectTransfer(id, note)
  )
  const cancel = useInventoryMutation((id: number) => inventoryApi.cancelTransfer(id))
  const rows = transfers.data?.items ?? []

  useShortcut('app.refresh', () => void transfers.refetch())

  const actions = (transfer: Transfer) =>
    transfer.status === 'requested' &&
    (access.approve || access.manage) && (
      <div className='inline-flex flex-wrap justify-end gap-1'>
        {access.approve && (
          <>
            <Button
              size='sm'
              variant='outline'
              onClick={(event) => {
                event.stopPropagation()
                setDecision({ transfer, mode: 'approve' })
              }}
            >
              <Check />
              Approve
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='text-destructive hover:bg-destructive/10'
              onClick={(event) => {
                event.stopPropagation()
                setDecision({ transfer, mode: 'reject' })
              }}
            >
              <X />
              Reject
            </Button>
          </>
        )}
        {access.manage && (
          <Button
            size='sm'
            variant='ghost'
            onClick={(event) => {
              event.stopPropagation()
              setCancelling(transfer)
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    )

  const statusBadge = (transfer: Transfer) => (
    <Badge tone={TRANSFER_STATUS[transfer.status].tone} dot>
      {TRANSFER_STATUS[transfer.status].label}
    </Badge>
  )

  const columns: Column<Transfer>[] = [
    {
      key: 'number',
      header: 'Transfer',
      cell: (transfer) => (
        <span className='grid'>
          <span className='font-mono text-xs font-semibold'>{transfer.transfer_no}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatDate(transfer.created_at)}
          </span>
        </span>
      ),
    },
    {
      key: 'assets',
      header: 'Assets',
      cell: (transfer) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>
            {transfer.items.length === 1
              ? transfer.items[0].name
              : `${transfer.items.length} assets`}
          </span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {transfer.items.map((item) => item.asset_tag).join(', ')}
          </span>
        </span>
      ),
    },
    {
      key: 'to',
      header: 'To',
      cell: (transfer) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{assigneeText(transfer.to)}</span>
          <span className='text-xs text-muted-foreground'>{ASSIGNEE_TYPE[transfer.to.type]}</span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (transfer) => <span className='line-clamp-2'>{transfer.reason}</span>,
    },
    { key: 'status', header: 'Status', cell: statusBadge },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: actions,
    },
  ]

  const filtered = Boolean(search.search || status)

  return (
    <div className='grid gap-6'>
      {access.manage && (
        <div className='flex justify-end'>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New transfer
          </Button>
        </div>
      )}
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={transfers.data ? `${transfers.data.total} transfers` : ''}
          onClear={filtered ? () => onChange({ search: undefined, status: undefined }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Transfer number, reason or tag'
            label='Search transfers'
          />
          <FilterSelect
            id='transfers-status'
            label='Filter by status'
            allLabel='All statuses'
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => onChange({ status: value as InventorySearch['status'] })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(transfer) => transfer.id}
          loading={transfers.isFetching}
          error={transfers.isError ? transfers.error.message : null}
          onRetry={() => transfers.refetch()}
          onRowClick={(transfer) => onChange({ open: transfer.id, page: search.page })}
          empty={{
            icon: filtered ? CircleOff : ArrowRightLeft,
            title: filtered ? 'No transfers match' : 'No transfers yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Move assets between staff, departments and rooms with a reason on record.',
            action: !filtered && access.manage && (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                New transfer
              </Button>
            ),
          }}
          card={(transfer) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-mono text-xs font-semibold'>{transfer.transfer_no}</span>
                {statusBadge(transfer)}
              </div>
              <span className='truncate text-sm font-semibold'>
                {transfer.items.length} {transfer.items.length === 1 ? 'asset' : 'assets'} →{' '}
                {transfer.to.name}
              </span>
              <span className='line-clamp-2 text-xs text-muted-foreground'>{transfer.reason}</span>
              {actions(transfer)}
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: transfers.data?.total ?? 0,
            label: 'transfers',
            onPageChange: (next) => onChange({ page: next }),
          }}
        />
      </Card>

      <TransferDetail
        id={search.open ?? null}
        onClose={() => onChange({ open: undefined, page: search.page })}
        actions={actions}
      />
      <TransferModal open={creating} onOpenChange={setCreating} />
      <DecisionModal
        open={Boolean(decision)}
        onOpenChange={(next) => !next && setDecision(null)}
        mode={decision?.mode ?? 'approve'}
        title={
          decision?.mode === 'reject'
            ? `Reject ${decision.transfer.transfer_no}?`
            : `Approve ${decision?.transfer.transfer_no ?? 'transfer'}?`
        }
        description={
          decision?.mode === 'reject'
            ? 'The assets stay where they are. The requester sees your reason.'
            : 'The assets move to the new holder now.'
        }
        loading={approve.isPending || reject.isPending}
        onSubmit={async (note) => {
          if (!decision) return
          if (decision.mode === 'approve') {
            await approve.mutateAsync({ id: decision.transfer.id, note })
            alerts.success(`${decision.transfer.transfer_no} approved`)
          } else {
            await reject.mutateAsync({ id: decision.transfer.id, note: note ?? '' })
            alerts.success(`${decision.transfer.transfer_no} rejected`)
          }
          setDecision(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(next) => !next && setCancelling(null)}
        title={`Cancel ${cancelling?.transfer_no ?? 'transfer'}?`}
        description='The request is withdrawn and the assets stay where they are.'
        confirmText='Cancel transfer'
        destructive
        loading={cancel.isPending}
        onConfirm={async () => {
          if (!cancelling) return
          try {
            await cancel.mutateAsync(cancelling.id)
            alerts.success(`${cancelling.transfer_no} cancelled`)
          } catch (error) {
            reportError(error)
          }
          setCancelling(null)
        }}
      />
    </div>
  )
}

function TransferDetail({
  id,
  onClose,
  actions,
}: {
  id: number | null
  onClose: () => void
  actions: (transfer: Transfer) => ReactNode
}) {
  const transfer = useTransfer(id)
  const data = transfer.data
  return (
    <Sheet open={Boolean(id)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.transfer_no ?? 'Transfer'}</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.items.length} ${data.items.length === 1 ? 'asset' : 'assets'} to ${data.to.name}`
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-5'>
          {transfer.isError ? (
            <ErrorState message={transfer.error.message} onRetry={() => transfer.refetch()} />
          ) : !data ? (
            <div className='grid gap-2'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Badge tone={TRANSFER_STATUS[data.status].tone} dot>
                  {TRANSFER_STATUS[data.status].label}
                </Badge>
                {actions(data)}
              </div>
              <DetailList
                items={[
                  {
                    label: 'To',
                    value: `${assigneeText(data.to)} (${ASSIGNEE_TYPE[data.to.type]})`,
                  },
                  { label: 'Reason', value: data.reason },
                  {
                    label: 'Requested',
                    value: `${formatDateTime(data.created_at)}${data.requested_by ? ` by ${data.requested_by}` : ''}`,
                  },
                  {
                    label: 'Decision',
                    value: data.decided_at
                      ? `${formatDateTime(data.decided_at)}${data.decided_by ? ` by ${data.decided_by}` : ''}`
                      : '—',
                  },
                  { label: 'Note', value: data.decision_note ?? '—' },
                  { label: 'Completed', value: formatDateTime(data.completed_at) },
                ]}
              />
              <div className='grid gap-2'>
                <h3 className='text-sm font-bold'>Assets</h3>
                <ul className='grid divide-y rounded-lg border'>
                  {data.items.map((item) => (
                    <li key={item.asset_id} className='grid gap-1 px-3 py-2'>
                      <span className='flex min-w-0 items-center justify-between gap-2'>
                        <span className='truncate font-semibold'>{item.name}</span>
                        <span className='font-mono text-[11px] text-muted-foreground'>
                          {item.asset_tag}
                        </span>
                      </span>
                      <span className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
                        <span className='truncate'>{item.from ?? 'In store'}</span>
                        <ArrowRight className='size-3 shrink-0' />
                        <span className='truncate text-foreground'>{data.to.name}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
