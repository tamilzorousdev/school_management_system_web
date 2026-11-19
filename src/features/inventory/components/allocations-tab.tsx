import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckCheck, CircleOff, HandHelping, Undo2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  ALLOCATION_STATUSES,
  inventoryApi,
  useAllocations,
  useInventoryMutation,
  type Allocation,
  type InventoryAccess,
} from '../api'
import {
  ALLOCATION_STATUS,
  ASSET_CONDITION,
  ASSIGNEE_TYPE,
  ASSIGNEE_TYPE_OPTIONS,
  assigneeText,
  idOrUndefined,
  options,
  reportError,
  stringId,
} from '../labels'
import { pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { AllocateModal } from './allocate-modal'
import { DepartmentPicker, LocationPicker, StaffPicker, type PickedAsset } from './pickers'
import { ReturnModal } from './return-modal'

const LIMIT = 20
const SORTS = ['allocated_on', 'expected_return_on', 'returned_on'] as const
const STATUS_OPTIONS = options(ALLOCATION_STATUS)
const FLAG_OPTIONS = [
  { value: 'overdue', label: 'Return overdue' },
  { value: 'unacknowledged', label: 'Not acknowledged' },
]

export function AllocationsTab(props: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const { search, onChange, access } = props
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<
    { kind: 'allocate' } | { kind: 'return'; assets: PickedAsset[] } | null
  >(null)
  const status = pick(ALLOCATION_STATUSES, search.status)
  const sort = pick(SORTS, search.sort)
  const page = search.page ?? 1
  const allocations = useAllocations({
    page,
    limit: LIMIT,
    search: search.search,
    sort,
    order: search.order,
    status,
    assignee_type: search.assignee_type,
    user_id: search.user_id,
    department_id: search.department_id,
    location_id: search.location_id,
    overdue: search.overdue,
    unacknowledged: search.unacknowledged,
  })
  const acknowledge = useInventoryMutation((id: number) => inventoryApi.acknowledge(id))
  const rows = allocations.data?.items ?? []

  useShortcut('app.refresh', () => void allocations.refetch())

  const openAsset = (allocation: Allocation) =>
    navigate({
      to: '/inventory/assets/$assetId',
      params: { assetId: String(allocation.asset.id) },
      search: { tab: 'allocations' },
    })

  const markReceived = async (allocation: Allocation) => {
    try {
      await acknowledge.mutateAsync(allocation.id)
      alerts.success(`${allocation.asset_tag} marked as received`)
    } catch (error) {
      reportError(error)
    }
  }

  const returnOne = (allocation: Allocation) =>
    setDialog({
      kind: 'return',
      assets: [
        {
          id: allocation.asset.id,
          asset_tag: allocation.asset_tag,
          name: allocation.asset.name,
          status: 'allocated',
        },
      ],
    })

  const actions = (allocation: Allocation) =>
    access.manage &&
    allocation.status === 'active' && (
      <div className='inline-flex flex-wrap justify-end gap-1'>
        {allocation.assignee.type === 'staff' && !allocation.acknowledged_at && (
          <Button
            size='sm'
            variant='outline'
            loading={acknowledge.isPending && acknowledge.variables === allocation.id}
            onClick={(event) => {
              event.stopPropagation()
              void markReceived(allocation)
            }}
          >
            <CheckCheck />
            Mark received
          </Button>
        )}
        <Button
          size='sm'
          variant='ghost'
          onClick={(event) => {
            event.stopPropagation()
            returnOne(allocation)
          }}
        >
          <Undo2 />
          Take back
        </Button>
      </div>
    )

  const statusBadges = (allocation: Allocation) => (
    <span className='flex flex-wrap gap-1'>
      <Badge tone={ALLOCATION_STATUS[allocation.status].tone} dot>
        {ALLOCATION_STATUS[allocation.status].label}
      </Badge>
      {allocation.overdue && <Badge tone='danger'>Overdue</Badge>}
      {allocation.status === 'active' &&
        allocation.assignee.type === 'staff' &&
        !allocation.acknowledged_at && <Badge tone='warning'>Not acknowledged</Badge>}
    </span>
  )

  const columns: Column<Allocation>[] = [
    {
      key: 'asset',
      header: 'Asset',
      cell: (allocation) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{allocation.asset.name}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {allocation.asset_tag}
          </span>
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'With',
      cell: (allocation) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{assigneeText(allocation.assignee)}</span>
          <span className='text-xs text-muted-foreground'>
            {ASSIGNEE_TYPE[allocation.assignee.type]}
          </span>
        </span>
      ),
    },
    {
      key: 'allocated_on',
      header: 'Given',
      sortKey: 'allocated_on',
      cell: (allocation) => (
        <span className='grid'>
          <span className='tabular'>{formatDate(allocation.allocated_on)}</span>
          {allocation.allocated_by && (
            <span className='text-xs text-muted-foreground'>by {allocation.allocated_by}</span>
          )}
        </span>
      ),
    },
    {
      key: 'expected_return_on',
      header: 'Due back',
      sortKey: 'expected_return_on',
      hideBelow: 'lg',
      cell: (allocation) => (
        <span className={allocation.overdue ? 'tabular font-semibold text-destructive' : 'tabular'}>
          {formatDate(allocation.expected_return_on)}
        </span>
      ),
    },
    {
      key: 'returned_on',
      header: 'Returned',
      sortKey: 'returned_on',
      hideBelow: 'xl',
      cell: (allocation) =>
        allocation.returned_on ? (
          <span className='grid'>
            <span className='tabular'>{formatDate(allocation.returned_on)}</span>
            {allocation.return_condition && (
              <span className='text-xs text-muted-foreground'>
                {ASSET_CONDITION[allocation.return_condition].label}
              </span>
            )}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (allocation) => (
        <span
          title={
            allocation.acknowledged_at
              ? `Received ${formatDateTime(allocation.acknowledged_at)}`
              : undefined
          }
        >
          {statusBadges(allocation)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: actions,
    },
  ]

  const flag = search.overdue ? 'overdue' : search.unacknowledged ? 'unacknowledged' : undefined
  const filtered = Boolean(
    search.search ||
    status ||
    search.assignee_type ||
    search.user_id ||
    search.department_id ||
    search.location_id ||
    flag
  )

  return (
    <div className='grid gap-6'>
      {access.manage && (
        <div className='flex flex-wrap justify-end gap-2'>
          <Button variant='outline' onClick={() => setDialog({ kind: 'return', assets: [] })}>
            <Undo2 />
            Take back
          </Button>
          <Button onClick={() => setDialog({ kind: 'allocate' })}>
            <HandHelping />
            Allocate
          </Button>
        </div>
      )}
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={allocations.data ? `${allocations.data.total} allocations` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    status: undefined,
                    assignee_type: undefined,
                    user_id: undefined,
                    department_id: undefined,
                    location_id: undefined,
                    overdue: undefined,
                    unacknowledged: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Asset tag, name or person'
            label='Search allocations'
          />
          <FilterSelect
            id='allocations-status'
            label='Filter by status'
            allLabel='Active and returned'
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => onChange({ status: value as InventorySearch['status'] })}
          />
          <FilterSelect
            id='allocations-flag'
            label='Filter by attention'
            allLabel='Everything'
            value={flag}
            options={FLAG_OPTIONS}
            onChange={(value) =>
              onChange({
                overdue: value === 'overdue' || undefined,
                unacknowledged: value === 'unacknowledged' || undefined,
              })
            }
          />
          <FilterSelect
            id='allocations-type'
            label='Filter by assignee type'
            allLabel='Anyone'
            value={search.assignee_type}
            options={ASSIGNEE_TYPE_OPTIONS}
            onChange={(value) =>
              onChange({ assignee_type: value as InventorySearch['assignee_type'] })
            }
          />
          <StaffPicker
            id='allocations-staff'
            label='Staff'
            allLabel='All staff'
            value={stringId(search.user_id)}
            onChange={(value) => onChange({ user_id: idOrUndefined(value) })}
          />
          <DepartmentPicker
            id='allocations-department'
            label='Department'
            allLabel='All departments'
            value={stringId(search.department_id)}
            onChange={(value) => onChange({ department_id: idOrUndefined(value) })}
          />
          <LocationPicker
            id='allocations-location'
            label='Location'
            allLabel='All locations'
            value={stringId(search.location_id)}
            onChange={(value) => onChange({ location_id: idOrUndefined(value) })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(allocation) => allocation.id}
          loading={allocations.isFetching}
          error={allocations.isError ? allocations.error.message : null}
          onRetry={() => allocations.refetch()}
          onRowClick={(allocation) => void openAsset(allocation)}
          sort={{ sort: sort ?? 'allocated_on', order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
          empty={{
            icon: filtered ? CircleOff : HandHelping,
            title: filtered ? 'No allocations match' : 'Nothing allocated yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Allocate assets in store to staff, departments or rooms.',
            action: !filtered && access.manage && (
              <Button onClick={() => setDialog({ kind: 'allocate' })}>
                <HandHelping />
                Allocate
              </Button>
            ),
          }}
          card={(allocation) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-bold'>{allocation.asset.name}</span>
                  <span className='truncate font-mono text-[11px] text-muted-foreground'>
                    {allocation.asset_tag}
                  </span>
                </span>
                {statusBadges(allocation)}
              </div>
              <span className='truncate text-sm'>{assigneeText(allocation.assignee)}</span>
              <span className='tabular text-xs text-muted-foreground'>
                Given {formatDate(allocation.allocated_on)}
                {allocation.expected_return_on
                  ? ` · due ${formatDate(allocation.expected_return_on)}`
                  : ''}
                {allocation.returned_on ? ` · returned ${formatDate(allocation.returned_on)}` : ''}
              </span>
              {actions(allocation)}
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: allocations.data?.total ?? 0,
            label: 'allocations',
            onPageChange: (next) => onChange({ page: next }),
          }}
        />
      </Card>
      <AllocateModal
        open={dialog?.kind === 'allocate'}
        onOpenChange={(next) => !next && setDialog(null)}
      />
      <ReturnModal
        open={dialog?.kind === 'return'}
        onOpenChange={(next) => !next && setDialog(null)}
        assets={dialog?.kind === 'return' ? dialog.assets : undefined}
      />
    </div>
  )
}
