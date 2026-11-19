import { useState } from 'react'
import { CircleOff, ClipboardList, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import {
  REQUISITION_STATUSES,
  useRequisitions,
  type InventoryAccess,
  type Requisition,
} from '../api'
import { options, REQUISITION_STATUS, stringId } from '../labels'
import { pick, type InventorySearch, type InventorySearchPatch } from '../search'
import { DepartmentPicker, StorePicker } from './pickers'
import { RequisitionModal } from './requisition-modal'
import { RequisitionSheet } from './requisition-sheet'
import { requisitionFor } from './stock-form'

const LIMIT = 20
const SORTS = ['created_at', 'needed_by'] as const

export function RequisitionsTab({
  search,
  onChange,
  access,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}) {
  const page = search.page ?? 1
  const status = pick(REQUISITION_STATUSES, search.status)
  const sort = pick(SORTS, search.sort)
  const requisitions = useRequisitions({
    page,
    limit: LIMIT,
    search: search.search,
    status,
    department_id: search.department_id,
    store_id: search.store_id,
    sort,
    order: search.order,
  })
  const [creating, setCreating] = useState(false)
  const filtered = Boolean(search.search || status || search.department_id || search.store_id)

  useShortcut('app.refresh', () => void requisitions.refetch())

  const statusBadge = (requisition: Requisition) => (
    <Badge tone={REQUISITION_STATUS[requisition.status].tone} dot>
      {REQUISITION_STATUS[requisition.status].label}
    </Badge>
  )

  const columns: Column<Requisition>[] = [
    {
      key: 'requisition',
      header: 'Requisition',
      sortKey: 'created_at',
      cell: (requisition) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{requisition.purpose}</span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>
            {requisition.requisition_no} · {formatDate(requisition.created_at)}
          </span>
        </span>
      ),
    },
    { key: 'for', header: 'For', cell: requisitionFor },
    {
      key: 'store',
      header: 'Store',
      hideBelow: 'lg',
      cell: (requisition) => requisition.store.name,
    },
    {
      key: 'items',
      header: 'Items',
      hideBelow: 'xl',
      cell: (requisition) => <span className='tabular'>{requisition.lines.length}</span>,
    },
    {
      key: 'needed_by',
      header: 'Needed by',
      sortKey: 'needed_by',
      hideBelow: 'lg',
      cell: (requisition) => <span className='tabular'>{formatDate(requisition.needed_by)}</span>,
    },
    { key: 'status', header: 'Status', cell: statusBadge },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={requisitions.data ? `${requisitions.data.total} requisitions` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  status: undefined,
                  department_id: undefined,
                  store_id: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Number or purpose'
          label='Search requisitions'
        />
        <FilterSelect
          id='requisition-status-filter'
          label='Filter by status'
          allLabel='All statuses'
          value={status}
          options={options(REQUISITION_STATUS)}
          onChange={(value) => onChange({ status: pick(REQUISITION_STATUSES, value) })}
        />
        <DepartmentPicker
          id='requisition-department-filter'
          label='Filter by department'
          allLabel='All departments'
          value={stringId(search.department_id)}
          onChange={(value) => onChange({ department_id: value ? Number(value) : undefined })}
        />
        <StorePicker
          id='requisition-store-filter'
          label='Filter by store'
          allLabel='All stores'
          value={stringId(search.store_id)}
          onChange={(value) => onChange({ store_id: value ? Number(value) : undefined })}
        />
        {access.stock && (
          <Button size='sm' onClick={() => setCreating(true)}>
            <Plus />
            New requisition
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={requisitions.data?.items ?? []}
        columns={columns}
        rowKey={(requisition) => requisition.id}
        loading={requisitions.isFetching}
        error={requisitions.isError ? requisitions.error.message : null}
        onRetry={() => requisitions.refetch()}
        onRowClick={(requisition) => onChange({ open: requisition.id, page: search.page })}
        sort={{ sort: sort ?? 'created_at', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : ClipboardList,
          title: filtered ? 'No requisitions match' : 'No requisitions yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Departments and teachers ask the store for stock here.',
          action: !filtered && access.stock && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New requisition
            </Button>
          ),
        }}
        card={(requisition) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{requisition.purpose}</span>
                <span className='truncate font-mono text-[11px] text-muted-foreground'>
                  {requisition.requisition_no}
                </span>
              </span>
              {statusBadge(requisition)}
            </div>
            <span className='truncate text-xs text-muted-foreground'>
              {requisitionFor(requisition)} · {requisition.store.name} · {requisition.lines.length}{' '}
              items
              {requisition.needed_by ? ` · by ${formatDate(requisition.needed_by)}` : ''}
            </span>
          </div>
        )}
        pagination={
          requisitions.data
            ? {
                page,
                limit: LIMIT,
                total: requisitions.data.total,
                label: 'requisitions',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
      <RequisitionModal
        open={creating}
        onOpenChange={setCreating}
        onCreated={(id) => onChange({ open: id, page: search.page })}
      />
      <RequisitionSheet
        id={search.open}
        onClose={() => onChange({ open: undefined, page: search.page })}
        access={access}
      />
    </Card>
  )
}
