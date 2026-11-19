import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Pencil,
  SearchX,
  SlidersHorizontal,
  Trash2,
  Warehouse,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  MOVEMENT_KINDS,
  inventoryApi,
  useInventoryAccess,
  useInventoryMutation,
  useMovements,
  useStockItem,
  type StockItemDetail,
} from '../api'
import { MOVEMENT_KIND, money, options, qty, STOCK_UNIT, stringId } from '../labels'
import { pick, type StockItemSearch } from '../search'
import { AdjustStockModal } from '../components/adjust-modal'
import { IssueStockModal } from '../components/issue-modal'
import { StorePicker } from '../components/pickers'
import { ReceiveStockModal } from '../components/receive-modal'
import { StockItemModal } from '../components/stock-item-modal'
import { MovementsTable } from '../components/stock-tab'

const route = getRouteApi('/_app/inventory/stock/$itemId')
const LIMIT = 20

type Modal = 'edit' | 'receive' | 'issue' | 'adjust' | 'delete' | null

export function StockItemPage() {
  const { itemId } = route.useParams()
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/inventory/stock/$itemId' })
  const id = Number(itemId)
  const access = useInventoryAccess()
  const item = useStockItem(Number.isFinite(id) ? id : null)
  const page = search.page ?? 1
  const kind = pick(MOVEMENT_KINDS, search.kind)
  const movements = useMovements(
    {
      page,
      limit: LIMIT,
      item_id: id,
      store_id: search.store_id,
      kind,
      from: search.from,
      to: search.to,
    },
    Number.isFinite(id)
  )
  const [modal, setModal] = useState<Modal>(null)
  const remove = useInventoryMutation(() => inventoryApi.removeStockItem(id))

  useShortcut('app.refresh', () => {
    void item.refetch()
    void movements.refetch()
  })

  const setSearch = (patch: Partial<StockItemSearch>) =>
    navigate({
      search: (prev) => ({ ...prev, ...('page' in patch ? {} : { page: undefined }), ...patch }),
      replace: true,
    })

  const back = (
    <Link
      to='/inventory'
      search={{ tab: 'stock' }}
      className='inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted-foreground hover:text-foreground'
    >
      <ArrowLeft className='size-4' />
      Stock
    </Link>
  )

  if (item.isPending) {
    return (
      <Page>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-36 w-full' />
        <Skeleton className='h-64 w-full' />
      </Page>
    )
  }

  if (item.isError) {
    return (
      <Page>
        {back}
        <Card>
          {item.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Stock item not found'
              description='It may have been removed, or the link is wrong.'
            />
          ) : (
            <ErrorState message={item.error.message} onRetry={() => item.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  const data = item.data
  const filtered = Boolean(search.store_id || kind || search.from || search.to)
  const close = (open: boolean) => !open && setModal(null)

  return (
    <Page>
      {back}
      <Header item={data} canStock={access.stock} onAction={setModal} />

      <Card className='overflow-hidden'>
        <div className='flex items-center gap-2 border-b px-4 py-3'>
          <Warehouse className='size-4 text-muted-foreground' />
          <h2 className='font-bold'>In each store</h2>
        </div>
        {data.balances.length === 0 ? (
          <p className='px-4 py-6 text-center text-sm text-muted-foreground'>
            Not in any store yet. Receive stock to add it.
          </p>
        ) : (
          <ul className='grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3'>
            {data.balances.map((balance) => (
              <li
                key={balance.store.id}
                className='flex items-center justify-between gap-3 px-4 py-3'
              >
                <span className='grid min-w-0'>
                  <span className='truncate font-semibold'>{balance.store.name}</span>
                  <span className='tabular text-xs text-muted-foreground'>
                    {money(balance.value)}
                  </span>
                </span>
                <span className='flex shrink-0 items-center gap-2'>
                  <span className='tabular font-bold'>{qty(balance.quantity, data.unit)}</span>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSearch({ store_id: balance.store.id })}
                  >
                    Ledger
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className='overflow-hidden'>
        <div className='border-b px-4 pt-3'>
          <h2 className='font-bold'>Ledger</h2>
        </div>
        <ListToolbar
          summary={movements.data ? `${movements.data.total} entries` : ''}
          onClear={
            filtered
              ? () =>
                  setSearch({
                    store_id: undefined,
                    kind: undefined,
                    from: undefined,
                    to: undefined,
                  })
              : undefined
          }
        >
          <StorePicker
            id='item-ledger-store'
            label='Filter by store'
            allLabel='All stores'
            value={stringId(search.store_id)}
            onChange={(value) => setSearch({ store_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='item-ledger-kind'
            label='Filter by entry'
            allLabel='All entries'
            value={kind}
            options={options(MOVEMENT_KIND)}
            onChange={(value) => setSearch({ kind: pick(MOVEMENT_KINDS, value) })}
          />
          <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
            <span className='w-10 shrink-0 sm:w-auto'>From</span>
            <Input
              type='date'
              aria-label='From date'
              value={search.from ?? ''}
              max={search.to}
              className='h-9 sm:w-40'
              onChange={(event) => setSearch({ from: event.target.value || undefined })}
            />
          </label>
          <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
            <span className='w-10 shrink-0 sm:w-auto'>To</span>
            <Input
              type='date'
              aria-label='To date'
              value={search.to ?? ''}
              min={search.from}
              className='h-9 sm:w-40'
              onChange={(event) => setSearch({ to: event.target.value || undefined })}
            />
          </label>
        </ListToolbar>
        <MovementsTable
          rows={movements.data?.items ?? []}
          loading={movements.isFetching}
          error={movements.isError ? movements.error.message : null}
          onRetry={() => movements.refetch()}
          filtered={filtered}
          showItem={false}
          pagination={
            movements.data
              ? {
                  page,
                  limit: LIMIT,
                  total: movements.data.total,
                  label: 'entries',
                  onPageChange: (next) => setSearch({ page: next }),
                }
              : undefined
          }
        />
      </Card>

      <StockItemModal open={modal === 'edit'} onOpenChange={close} item={data} />
      <ConfirmDialog
        open={modal === 'delete'}
        onOpenChange={close}
        title={`Delete ${data.name}?`}
        description='Only an item that was never received, issued or adjusted can be deleted. Mark it not in use otherwise.'
        confirmText='Delete item'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(undefined)
            alerts.success(`${data.name} deleted`)
            setModal(null)
            void navigate({ to: '/inventory', search: { tab: 'stock' } })
          } catch (error) {
            alerts.error(toApiError(error).message)
            setModal(null)
          }
        }}
      />
      <ReceiveStockModal
        open={modal === 'receive'}
        onOpenChange={close}
        itemId={data.id}
        storeId={search.store_id}
      />
      <IssueStockModal
        open={modal === 'issue'}
        onOpenChange={close}
        itemId={data.id}
        storeId={search.store_id}
      />
      <AdjustStockModal
        open={modal === 'adjust'}
        onOpenChange={close}
        itemId={data.id}
        storeId={search.store_id}
      />
    </Page>
  )
}

function Header({
  item,
  canStock,
  onAction,
}: {
  item: StockItemDetail
  canStock: boolean
  onAction: (modal: Modal) => void
}) {
  const out = item.quantity <= 0
  return (
    <Card className='gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='grid min-w-0 gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl font-extrabold tracking-tight'>{item.name}</h1>
            {out ? (
              <Badge tone='danger' dot>
                Out of stock
              </Badge>
            ) : item.low ? (
              <Badge tone='warning' dot>
                Low stock
              </Badge>
            ) : (
              <Badge tone='success' dot>
                In stock
              </Badge>
            )}
            {!item.is_active && <Badge tone='neutral'>Not in use</Badge>}
          </div>
          <p className='text-sm text-muted-foreground'>
            <span className='font-mono'>{item.code}</span> · {item.category.name} ·{' '}
            {STOCK_UNIT[item.unit]}
          </p>
          {item.description && <p className='text-sm'>{item.description}</p>}
        </div>
        {canStock && (
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' size='sm' onClick={() => onAction('edit')}>
              <Pencil />
              Edit
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='text-destructive hover:bg-destructive/10'
              onClick={() => onAction('delete')}
            >
              <Trash2 />
              Delete
            </Button>
            <Button variant='outline' size='sm' onClick={() => onAction('adjust')}>
              <SlidersHorizontal />
              Adjust
            </Button>
            <Button variant='outline' size='sm' onClick={() => onAction('issue')}>
              <ArrowUpFromLine />
              Issue
            </Button>
            <Button size='sm' onClick={() => onAction('receive')}>
              <ArrowDownToLine />
              Receive
            </Button>
          </div>
        )}
      </div>
      <dl className='grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 text-sm sm:grid-cols-4'>
        <Fact label='In stock' value={qty(item.quantity, item.unit)} />
        <Fact label='Value' value={money(item.value)} />
        <Fact label='Average rate' value={money(item.average_rate)} />
        <Fact label='Reorder at' value={qty(item.reorder_level, item.unit)} />
      </dl>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid'>
      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </dt>
      <dd className='tabular font-semibold'>{value}</dd>
    </div>
  )
}
