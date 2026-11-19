import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleOff,
  ClipboardList,
  IndianRupee,
  Package,
  PackageX,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import {
  MOVEMENT_KINDS,
  useMovements,
  useReceipts,
  useStockInsights,
  useStockItems,
  type InventoryAccess,
  type Movement,
  type Receipt,
  type StockItem,
} from '../api'
import { MOVEMENT_KIND, money, options, qty, stringId, wholeMoney } from '../labels'
import { pick, STOCK_VIEWS, type InventorySearch, type InventorySearchPatch } from '../search'
import { AdjustStockModal } from './adjust-modal'
import { IssueStockModal } from './issue-modal'
import {
  CategoryPicker,
  DepartmentPicker,
  StockItemPicker,
  StorePicker,
  VendorPicker,
} from './pickers'
import { ReceiveStockModal } from './receive-modal'
import { StockItemModal } from './stock-item-modal'
import { StockReceiptSheet } from './stock-receipt-sheet'

const LIMIT = 20
const ITEM_SORTS = ['name', 'code', 'quantity', 'value'] as const
const LEDGER_SORTS = ['created_at', 'moved_on'] as const
const RECEIPT_SORTS = ['received_on', 'receipt_no', 'total', 'vendor'] as const

interface TabProps {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  access: InventoryAccess
}

type StockModal = 'item' | 'receive' | 'issue' | 'adjust' | null

const CLEAR: InventorySearchPatch = {
  search: undefined,
  category_id: undefined,
  store_id: undefined,
  vendor_id: undefined,
  item_id: undefined,
  department_id: undefined,
  kind: undefined,
  low: undefined,
  is_active: undefined,
  from: undefined,
  to: undefined,
  sort: undefined,
  order: undefined,
  open: undefined,
}

export function StockTab({ search, onChange, access }: TabProps) {
  const view = pick(STOCK_VIEWS, search.view) ?? 'items'
  const navigate = useNavigate()
  const insights = useStockInsights()
  const [modal, setModal] = useState<StockModal>(null)
  const data = insights.data

  useShortcut('app.refresh', () => void insights.refetch())

  const showItems = (patch: InventorySearchPatch) => onChange({ ...CLEAR, view: 'items', ...patch })

  const cards: Insight[] = [
    {
      key: 'items',
      label: 'Stock items',
      value: data?.items ?? 0,
      hint: `${wholeMoney(data?.received_this_month ?? 0)} received this month`,
      icon: Package,
      tone: 'primary',
      active: view === 'items' && !search.low,
      onClick: () => showItems({}),
    },
    {
      key: 'value',
      label: 'Stock value',
      value: wholeMoney(data?.stock_value ?? 0),
      hint: `${wholeMoney(data?.issued_this_month ?? 0)} issued this month`,
      icon: IndianRupee,
      tone: 'success',
    },
    {
      key: 'low',
      label: 'Low stock',
      value: data?.low_stock ?? 0,
      hint: `${data?.out_of_stock ?? 0} out of stock`,
      icon: data?.out_of_stock ? PackageX : TriangleAlert,
      tone: data?.low_stock ? 'danger' : 'success',
      active: view === 'items' && search.low === true,
      onClick: () => (search.low ? showItems({}) : showItems({ low: true })),
    },
    {
      key: 'requisitions',
      label: 'Requisitions waiting',
      value: data?.pending_requisitions ?? 0,
      hint: `${data?.to_issue ?? 0} approved, to issue`,
      icon: ClipboardList,
      tone: data?.pending_requisitions ? 'warning' : 'neutral',
      onClick: () =>
        void navigate({ to: '/inventory', search: { tab: 'requisitions', status: 'pending' } }),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SegmentedControl
          label='Stock view'
          value={view}
          onChange={(next) => onChange({ ...CLEAR, view: next })}
          options={[
            { value: 'items', label: 'Items' },
            { value: 'receipts', label: 'Goods received' },
            { value: 'ledger', label: 'Ledger' },
          ]}
        />
        {access.stock && (
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' onClick={() => setModal('item')}>
              <Plus />
              Add item
            </Button>
            <Button size='sm' variant='outline' onClick={() => setModal('adjust')}>
              <SlidersHorizontal />
              Adjust
            </Button>
            <Button size='sm' variant='outline' onClick={() => setModal('issue')}>
              <ArrowUpFromLine />
              Issue
            </Button>
            <Button size='sm' onClick={() => setModal('receive')}>
              <ArrowDownToLine />
              Receive stock
            </Button>
          </div>
        )}
      </div>
      {view === 'items' && (
        <ItemsView
          search={search}
          onChange={onChange}
          onAdd={() => setModal('item')}
          access={access}
        />
      )}
      {view === 'receipts' && (
        <ReceiptsView
          search={search}
          onChange={onChange}
          onAdd={() => setModal('receive')}
          access={access}
        />
      )}
      {view === 'ledger' && <LedgerView search={search} onChange={onChange} />}
      <StockItemModal open={modal === 'item'} onOpenChange={(open) => !open && setModal(null)} />
      <ReceiveStockModal
        open={modal === 'receive'}
        onOpenChange={(open) => !open && setModal(null)}
      />
      <IssueStockModal open={modal === 'issue'} onOpenChange={(open) => !open && setModal(null)} />
      <AdjustStockModal
        open={modal === 'adjust'}
        onOpenChange={(open) => !open && setModal(null)}
      />
    </div>
  )
}

function ItemsView({
  search,
  onChange,
  onAdd,
  access,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  onAdd: () => void
  access: InventoryAccess
}) {
  const navigate = useNavigate()
  const page = search.page ?? 1
  const sort = pick(ITEM_SORTS, search.sort)
  const items = useStockItems({
    page,
    limit: LIMIT,
    search: search.search,
    category_id: search.category_id,
    store_id: search.store_id,
    low: search.low,
    is_active: search.is_active,
    sort,
    order: search.order,
  })
  const filtered = Boolean(
    search.search ||
    search.category_id ||
    search.store_id ||
    search.low ||
    search.is_active !== undefined
  )
  const open = (item: StockItem) =>
    void navigate({ to: '/inventory/stock/$itemId', params: { itemId: String(item.id) } })

  useShortcut('app.refresh', () => void items.refetch())

  const quantity = (item: StockItem) => (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      <span className='tabular font-bold'>{qty(item.quantity, item.unit)}</span>
      {item.quantity <= 0 ? (
        <Badge tone='danger'>Out</Badge>
      ) : (
        item.low && <Badge tone='warning'>Low</Badge>
      )}
    </span>
  )

  const columns: Column<StockItem>[] = [
    {
      key: 'name',
      header: 'Item',
      sortKey: 'name',
      cell: (item) => (
        <span className='grid min-w-0'>
          <span className='flex items-center gap-1.5'>
            <span className='truncate font-bold'>{item.name}</span>
            {!item.is_active && <Badge tone='neutral'>Not in use</Badge>}
          </span>
          <span className='truncate font-mono text-[11px] text-muted-foreground'>{item.code}</span>
        </span>
      ),
    },
    { key: 'category', header: 'Category', hideBelow: 'lg', cell: (item) => item.category.name },
    { key: 'quantity', header: 'In stock', sortKey: 'quantity', cell: quantity },
    {
      key: 'reorder',
      header: 'Reorder at',
      hideBelow: 'xl',
      cell: (item) => <span className='tabular'>{qty(item.reorder_level, item.unit)}</span>,
    },
    {
      key: 'rate',
      header: 'Avg. rate',
      align: 'right',
      hideBelow: 'lg',
      cell: (item) => <span className='tabular'>{money(item.average_rate)}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      sortKey: 'value',
      align: 'right',
      cell: (item) => <span className='tabular font-semibold'>{money(item.value)}</span>,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={items.data ? `${items.data.total} items` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  category_id: undefined,
                  store_id: undefined,
                  low: undefined,
                  is_active: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Item name or code'
          label='Search stock items'
        />
        <CategoryPicker
          id='stock-category-filter'
          label='Filter by category'
          kind='stock'
          allLabel='All categories'
          value={stringId(search.category_id)}
          onChange={(value) => onChange({ category_id: value ? Number(value) : undefined })}
        />
        <StorePicker
          id='stock-store-filter'
          label='Filter by store'
          allLabel='All stores'
          value={stringId(search.store_id)}
          onChange={(value) => onChange({ store_id: value ? Number(value) : undefined })}
        />
        <FilterSelect
          id='stock-low-filter'
          label='Filter by level'
          allLabel='Any level'
          value={search.low ? 'low' : undefined}
          options={[{ value: 'low', label: 'Low or out of stock' }]}
          onChange={(value) => onChange({ low: value ? true : undefined })}
        />
        <FilterSelect
          id='stock-active-filter'
          label='Filter by use'
          allLabel='In use and not'
          value={search.is_active === undefined ? undefined : search.is_active ? 'yes' : 'no'}
          options={[
            { value: 'yes', label: 'In use' },
            { value: 'no', label: 'Not in use' },
          ]}
          onChange={(value) =>
            onChange({ is_active: value === undefined ? undefined : value === 'yes' })
          }
        />
      </ListToolbar>
      <DataTable
        rows={items.data?.items ?? []}
        columns={columns}
        rowKey={(item) => item.id}
        loading={items.isFetching}
        error={items.isError ? items.error.message : null}
        onRetry={() => items.refetch()}
        onRowClick={open}
        sort={{ sort: sort ?? 'name', order: search.order ?? 'asc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : Package,
          title: filtered ? 'No items match these filters' : 'No stock items yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Add the consumables you keep in the stores, then receive stock against them.',
          action: !filtered && access.stock && (
            <Button onClick={onAdd}>
              <Plus />
              Add item
            </Button>
          ),
        }}
        card={(item) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{item.name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {item.code} · {item.category.name}
                </span>
              </span>
              <span className='tabular shrink-0 font-semibold'>{money(item.value)}</span>
            </div>
            {quantity(item)}
          </div>
        )}
        pagination={
          items.data
            ? {
                page,
                limit: LIMIT,
                total: items.data.total,
                label: 'items',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
    </Card>
  )
}

function DateRange({
  from,
  to,
  onChange,
}: {
  from?: string
  to?: string
  onChange: (patch: { from?: string; to?: string }) => void
}) {
  return (
    <>
      <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
        <span className='w-10 shrink-0 sm:w-auto'>From</span>
        <Input
          type='date'
          aria-label='From date'
          value={from ?? ''}
          max={to}
          className='h-9 sm:w-40'
          onChange={(event) => onChange({ from: event.target.value || undefined })}
        />
      </label>
      <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
        <span className='w-10 shrink-0 sm:w-auto'>To</span>
        <Input
          type='date'
          aria-label='To date'
          value={to ?? ''}
          min={from}
          className='h-9 sm:w-40'
          onChange={(event) => onChange({ to: event.target.value || undefined })}
        />
      </label>
    </>
  )
}

function ReceiptsView({
  search,
  onChange,
  onAdd,
  access,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
  onAdd: () => void
  access: InventoryAccess
}) {
  const page = search.page ?? 1
  const sort = pick(RECEIPT_SORTS, search.sort)
  const receipts = useReceipts({
    page,
    limit: LIMIT,
    sort,
    order: search.order,
    search: search.search,
    store_id: search.store_id,
    vendor_id: search.vendor_id,
    from: search.from,
    to: search.to,
  })
  const filtered = Boolean(
    search.search || search.store_id || search.vendor_id || search.from || search.to
  )

  useShortcut('app.refresh', () => void receipts.refetch())

  const columns: Column<Receipt>[] = [
    {
      key: 'received_on',
      header: 'Received',
      sortKey: 'received_on',
      cell: (receipt) => <span className='tabular'>{formatDate(receipt.received_on)}</span>,
    },
    {
      key: 'receipt',
      header: 'Receipt',
      sortKey: 'receipt_no',
      cell: (receipt) => (
        <span className='truncate font-mono text-xs font-bold'>{receipt.receipt_no}</span>
      ),
    },
    { key: 'store', header: 'Store', cell: (receipt) => receipt.store.name },
    {
      key: 'vendor',
      header: 'Vendor',
      sortKey: 'vendor',
      hideBelow: 'lg',
      cell: (receipt) => (
        <span className='grid min-w-0'>
          <span className='truncate'>{receipt.vendor?.name ?? '—'}</span>
          {receipt.invoice_no && (
            <span className='truncate text-xs text-muted-foreground'>
              Invoice {receipt.invoice_no}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'lines',
      header: 'Items',
      hideBelow: 'xl',
      cell: (receipt) => <span className='tabular'>{receipt.lines.length}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      sortKey: 'total',
      align: 'right',
      cell: (receipt) => <span className='tabular font-bold'>{money(receipt.total)}</span>,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={receipts.data ? `${receipts.data.total} receipts` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  store_id: undefined,
                  vendor_id: undefined,
                  from: undefined,
                  to: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Receipt, invoice or vendor'
          label='Search receipts'
        />
        <StorePicker
          id='receipt-store-filter'
          label='Filter by store'
          allLabel='All stores'
          value={stringId(search.store_id)}
          onChange={(value) => onChange({ store_id: value ? Number(value) : undefined })}
        />
        <VendorPicker
          id='receipt-vendor-filter'
          label='Filter by vendor'
          allLabel='All vendors'
          value={stringId(search.vendor_id)}
          onChange={(value) => onChange({ vendor_id: value ? Number(value) : undefined })}
        />
        <DateRange from={search.from} to={search.to} onChange={onChange} />
      </ListToolbar>
      <DataTable
        rows={receipts.data?.items ?? []}
        columns={columns}
        rowKey={(receipt) => receipt.id}
        loading={receipts.isFetching}
        error={receipts.isError ? receipts.error.message : null}
        onRetry={() => receipts.refetch()}
        onRowClick={(receipt) => onChange({ open: receipt.id, page: search.page })}
        sort={{ sort: sort ?? 'received_on', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: filtered ? CircleOff : ReceiptText,
          title: filtered ? 'No receipts match' : 'No goods received yet',
          description: filtered
            ? 'Try another search or date range.'
            : 'Every delivery received into a store shows up here.',
          action: !filtered && access.stock && (
            <Button onClick={onAdd}>
              <ArrowDownToLine />
              Receive stock
            </Button>
          ),
        }}
        card={(receipt) => (
          <div className='flex items-start justify-between gap-2'>
            <span className='grid min-w-0'>
              <span className='truncate font-mono text-xs font-bold'>{receipt.receipt_no}</span>
              <span className='truncate text-xs text-muted-foreground'>
                {formatDate(receipt.received_on)} · {receipt.store.name}
                {receipt.vendor ? ` · ${receipt.vendor.name}` : ''}
              </span>
            </span>
            <span className='tabular shrink-0 font-bold'>{money(receipt.total)}</span>
          </div>
        )}
        pagination={
          receipts.data
            ? {
                page,
                limit: LIMIT,
                total: receipts.data.total,
                label: 'receipts',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
      <StockReceiptSheet
        id={search.open}
        onClose={() => onChange({ open: undefined, page: search.page })}
      />
    </Card>
  )
}

function LedgerView({
  search,
  onChange,
}: {
  search: InventorySearch
  onChange: (patch: InventorySearchPatch) => void
}) {
  const page = search.page ?? 1
  const kind = pick(MOVEMENT_KINDS, search.kind)
  const sort = pick(LEDGER_SORTS, search.sort)
  const movements = useMovements({
    page,
    limit: LIMIT,
    search: search.search,
    item_id: search.item_id,
    store_id: search.store_id,
    kind,
    department_id: search.department_id,
    from: search.from,
    to: search.to,
    sort,
    order: search.order,
  })
  const filtered = Boolean(
    search.search ||
    search.item_id ||
    search.store_id ||
    kind ||
    search.department_id ||
    search.from ||
    search.to
  )

  useShortcut('app.refresh', () => void movements.refetch())

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={movements.data ? `${movements.data.total} entries` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  item_id: undefined,
                  store_id: undefined,
                  kind: undefined,
                  department_id: undefined,
                  from: undefined,
                  to: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Item, reference or note'
          label='Search ledger'
        />
        <StockItemPicker
          id='ledger-item-filter'
          label='Filter by item'
          allLabel='All items'
          value={stringId(search.item_id)}
          onChange={(value) => onChange({ item_id: value ? Number(value) : undefined })}
        />
        <StorePicker
          id='ledger-store-filter'
          label='Filter by store'
          allLabel='All stores'
          value={stringId(search.store_id)}
          onChange={(value) => onChange({ store_id: value ? Number(value) : undefined })}
        />
        <FilterSelect
          id='ledger-kind-filter'
          label='Filter by entry'
          allLabel='All entries'
          value={kind}
          options={options(MOVEMENT_KIND)}
          onChange={(value) => onChange({ kind: pick(MOVEMENT_KINDS, value) })}
        />
        <DepartmentPicker
          id='ledger-department-filter'
          label='Filter by department'
          allLabel='All departments'
          value={stringId(search.department_id)}
          onChange={(value) => onChange({ department_id: value ? Number(value) : undefined })}
        />
        <DateRange from={search.from} to={search.to} onChange={onChange} />
      </ListToolbar>
      <MovementsTable
        rows={movements.data?.items ?? []}
        loading={movements.isFetching}
        error={movements.isError ? movements.error.message : null}
        onRetry={() => movements.refetch()}
        filtered={filtered}
        sort={{ sort: sort ?? 'created_at', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        pagination={
          movements.data
            ? {
                page,
                limit: LIMIT,
                total: movements.data.total,
                label: 'entries',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
      />
    </Card>
  )
}

export function MovementsTable({
  rows,
  loading,
  error,
  onRetry,
  filtered,
  sort,
  onSortChange,
  pagination,
  showItem = true,
}: {
  rows: Movement[]
  loading: boolean
  error: string | null
  onRetry: () => void
  filtered: boolean
  sort?: { sort?: string; order: 'asc' | 'desc' }
  onSortChange?: (next: { sort?: string; order: 'asc' | 'desc' }) => void
  pagination?: {
    page: number
    limit: number
    total: number
    label: string
    onPageChange: (page: number) => void
  }
  showItem?: boolean
}) {
  const towards = (movement: Movement) =>
    [movement.department?.name, movement.person, movement.section?.name].filter(Boolean).join(' · ')

  const change = (movement: Movement) => (
    <span
      className={
        movement.quantity < 0
          ? 'tabular font-bold text-destructive'
          : 'tabular font-bold text-success'
      }
    >
      {movement.quantity > 0 ? '+' : ''}
      {qty(movement.quantity, movement.unit)}
    </span>
  )

  const columns: Column<Movement>[] = [
    {
      key: 'moved_on',
      header: 'Date',
      sortKey: 'moved_on',
      cell: (movement) => <span className='tabular'>{formatDate(movement.moved_on)}</span>,
    },
    ...(showItem
      ? [
          {
            key: 'item',
            header: 'Item',
            cell: (movement: Movement) => (
              <span className='truncate font-semibold'>{movement.item.name}</span>
            ),
          },
        ]
      : []),
    {
      key: 'kind',
      header: 'Entry',
      cell: (movement) => (
        <span className='grid justify-items-start gap-0.5'>
          <Badge tone={MOVEMENT_KIND[movement.kind].tone}>
            {MOVEMENT_KIND[movement.kind].label}
          </Badge>
          {movement.reference && (
            <span className='font-mono text-[11px] text-muted-foreground'>
              {movement.reference}
            </span>
          )}
        </span>
      ),
    },
    { key: 'store', header: 'Store', hideBelow: 'lg', cell: (movement) => movement.store.name },
    {
      key: 'to',
      header: 'For',
      hideBelow: 'xl',
      cell: (movement) => (
        <span className='grid min-w-0 text-sm'>
          <span className='truncate'>{towards(movement) || '—'}</span>
          {movement.note && (
            <span className='truncate text-xs text-muted-foreground'>{movement.note}</span>
          )}
        </span>
      ),
    },
    { key: 'quantity', header: 'Change', align: 'right', cell: change },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (movement) => (
        <span className='tabular'>{qty(movement.balance_after, movement.unit)}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      hideBelow: 'lg',
      cell: (movement) => <span className='tabular'>{money(movement.value)}</span>,
    },
    {
      key: 'created_at',
      header: 'By',
      sortKey: 'created_at',
      hideBelow: 'xl',
      cell: (movement) => (
        <span className='text-xs text-muted-foreground'>{movement.by ?? '—'}</span>
      ),
    },
  ]

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(movement) => movement.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sort={sort}
      onSortChange={onSortChange}
      empty={{
        icon: filtered ? CircleOff : ReceiptText,
        title: filtered ? 'No entries match' : 'No stock movements yet',
        description: filtered
          ? 'Try another item, store or date range.'
          : 'Receipts, issues, returns and adjustments are recorded here.',
      }}
      card={(movement) => (
        <div className='grid gap-1'>
          <div className='flex items-start justify-between gap-2'>
            <span className='grid min-w-0'>
              <span className='truncate font-semibold'>
                {showItem ? movement.item.name : MOVEMENT_KIND[movement.kind].label}
              </span>
              <span className='truncate text-xs text-muted-foreground'>
                {formatDate(movement.moved_on)} · {movement.store.name}
                {showItem ? ` · ${MOVEMENT_KIND[movement.kind].label}` : ''}
              </span>
            </span>
            {change(movement)}
          </div>
          <span className='text-xs text-muted-foreground'>
            Balance {qty(movement.balance_after, movement.unit)}
            {towards(movement) ? ` · ${towards(movement)}` : ''}
          </span>
        </div>
      )}
      pagination={pagination}
    />
  )
}
