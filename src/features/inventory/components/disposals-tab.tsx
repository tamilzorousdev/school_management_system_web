import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, CircleOff, Plus, Trash2, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import {
  DISPOSAL_STATUSES,
  inventoryApi,
  useDisposals,
  useInventoryMutation,
  type Disposal,
  type InventoryAccess,
} from '../api'
import { DISPOSAL_METHOD, DISPOSAL_STATUS, money, options } from '../labels'
import { pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { DecisionModal } from './decision-modal'
import { DisposalModal } from './disposal-modal'

const LIMIT = 20
const STATUS_OPTIONS = options(DISPOSAL_STATUS)
const METHOD_OPTIONS = options(DISPOSAL_METHOD)

export function DisposalsTab(props: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const { search, onChange, access } = props
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [decision, setDecision] = useState<{
    disposal: Disposal
    mode: 'approve' | 'reject'
  } | null>(null)
  const status = pick(DISPOSAL_STATUSES, search.status)
  const page = search.page ?? 1
  const disposals = useDisposals({
    page,
    limit: LIMIT,
    search: search.search,
    status,
    method: search.method,
  })
  const approve = useInventoryMutation(({ id, note }: { id: number; note: string | null }) =>
    inventoryApi.approveDisposal(id, note)
  )
  const reject = useInventoryMutation(({ id, note }: { id: number; note: string }) =>
    inventoryApi.rejectDisposal(id, note)
  )
  const rows = disposals.data?.items ?? []

  useShortcut('app.refresh', () => void disposals.refetch())

  const actions = (disposal: Disposal) =>
    access.approve &&
    disposal.status === 'requested' && (
      <div className='inline-flex flex-wrap justify-end gap-1'>
        <Button
          size='sm'
          variant='outline'
          onClick={(event) => {
            event.stopPropagation()
            setDecision({ disposal, mode: 'approve' })
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
            setDecision({ disposal, mode: 'reject' })
          }}
        >
          <X />
          Reject
        </Button>
      </div>
    )

  const statusBadge = (disposal: Disposal) => (
    <Badge tone={DISPOSAL_STATUS[disposal.status].tone} dot>
      {DISPOSAL_STATUS[disposal.status].label}
    </Badge>
  )

  const columns: Column<Disposal>[] = [
    {
      key: 'number',
      header: 'Disposal',
      cell: (disposal) => (
        <span className='grid'>
          <span className='font-mono text-xs font-semibold'>{disposal.disposal_no}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatDate(disposal.created_at)}
          </span>
        </span>
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      cell: (disposal) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{disposal.asset.name}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {disposal.asset_tag}
          </span>
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      cell: (disposal) => (
        <span className='grid min-w-0'>
          <span>{DISPOSAL_METHOD[disposal.method]}</span>
          <span className='line-clamp-1 text-xs text-muted-foreground'>{disposal.reason}</span>
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Book / realised',
      align: 'right',
      hideBelow: 'lg',
      cell: (disposal) => (
        <span className='grid'>
          <span className='tabular'>{money(disposal.book_value)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {money(disposal.value_realised)}
          </span>
        </span>
      ),
    },
    {
      key: 'by',
      header: 'Requested by',
      hideBelow: 'xl',
      cell: (disposal) => disposal.requested_by ?? '—',
    },
    { key: 'status', header: 'Status', cell: statusBadge },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: actions,
    },
  ]

  const filtered = Boolean(search.search || status || search.method)

  return (
    <div className='grid gap-6'>
      {access.manage && (
        <div className='flex justify-end'>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New disposal
          </Button>
        </div>
      )}
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={disposals.data ? `${disposals.data.total} disposals` : ''}
          onClear={
            filtered
              ? () => onChange({ search: undefined, status: undefined, method: undefined })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Number, tag or reason'
            label='Search disposals'
          />
          <FilterSelect
            id='disposals-status'
            label='Filter by status'
            allLabel='All statuses'
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => onChange({ status: value as InventorySearch['status'] })}
          />
          <FilterSelect
            id='disposals-method'
            label='Filter by method'
            allLabel='All methods'
            value={search.method}
            options={METHOD_OPTIONS}
            onChange={(value) => onChange({ method: value as InventorySearch['method'] })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(disposal) => disposal.id}
          loading={disposals.isFetching}
          error={disposals.isError ? disposals.error.message : null}
          onRetry={() => disposals.refetch()}
          onRowClick={(disposal) =>
            void navigate({
              to: '/inventory/assets/$assetId',
              params: { assetId: String(disposal.asset.id) },
              search: { tab: 'history' },
            })
          }
          empty={{
            icon: filtered ? CircleOff : Trash2,
            title: filtered ? 'No disposals match' : 'No disposals yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Assets sold, scrapped, donated or written off are recorded here.',
          }}
          card={(disposal) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>{disposal.asset.name}</span>
                  <span className='truncate font-mono text-[11px] text-muted-foreground'>
                    {disposal.disposal_no} · {disposal.asset_tag}
                  </span>
                </span>
                {statusBadge(disposal)}
              </div>
              <span className='text-xs text-muted-foreground'>
                {DISPOSAL_METHOD[disposal.method]} · {disposal.reason}
              </span>
              {actions(disposal)}
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: disposals.data?.total ?? 0,
            label: 'disposals',
            onPageChange: (next) => onChange({ page: next }),
          }}
        />
      </Card>
      <DisposalModal open={creating} onOpenChange={setCreating} />
      <DecisionModal
        open={Boolean(decision)}
        onOpenChange={(next) => !next && setDecision(null)}
        mode={decision?.mode ?? 'approve'}
        title={
          decision?.mode === 'reject'
            ? `Reject ${decision.disposal.disposal_no}?`
            : `Approve ${decision?.disposal.disposal_no ?? 'disposal'}?`
        }
        description={
          decision?.mode === 'reject'
            ? 'The asset stays on the register.'
            : 'The asset leaves the active register for good.'
        }
        loading={approve.isPending || reject.isPending}
        onSubmit={async (note) => {
          if (!decision) return
          if (decision.mode === 'approve') {
            await approve.mutateAsync({ id: decision.disposal.id, note })
            alerts.success(`${decision.disposal.asset_tag} disposed`)
          } else {
            await reject.mutateAsync({ id: decision.disposal.id, note: note ?? '' })
            alerts.success(`${decision.disposal.disposal_no} rejected`)
          }
          setDecision(null)
        }}
      />
    </div>
  )
}
