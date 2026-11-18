import { CreditCard } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import { useOnlineOrders, type OnlineOrder, type OnlineOrderStatus } from '../api'
import { ONLINE_ORDER_STATUS, ONLINE_ORDER_STATUS_OPTIONS, rupees } from '../labels'
import type { FeesSearch } from '../search'

const LIMIT = 20

function StatusBadge({ order }: { order: OnlineOrder }) {
  const status = ONLINE_ORDER_STATUS[order.status]
  return <Badge tone={status.tone}>{status.label}</Badge>
}

function GatewayIds({ order }: { order: OnlineOrder }) {
  return (
    <span className='grid min-w-0 font-mono text-xs'>
      <span className='truncate'>{order.gateway_order_id}</span>
      {order.gateway_payment_id && (
        <span className='truncate text-muted-foreground'>{order.gateway_payment_id}</span>
      )}
    </span>
  )
}

export function OnlinePaymentsTab({
  search,
  onChange,
  onOpenInvoice,
}: {
  search: FeesSearch
  onChange: (patch: Partial<FeesSearch>) => void
  onOpenInvoice: (invoiceId: number) => void
}) {
  const page = search.page ?? 1
  const orders = useOnlineOrders({
    page,
    limit: LIMIT,
    status: search.online_status,
    search: search.search,
    order: search.order,
  })
  const filtered = Boolean(search.search || search.online_status)

  useShortcut('app.refresh', () => void orders.refetch())

  const columns: Column<OnlineOrder>[] = [
    {
      key: 'started',
      header: 'Started',
      sortKey: 'created_at',
      cell: (order) => <span className='tabular'>{formatDateTime(order.created_at)}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      cell: (order) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{order.student.full_name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {order.student.class_section ? `${order.student.class_section} · ` : ''}
            {order.invoice_no}
          </span>
        </span>
      ),
    },
    {
      key: 'razorpay',
      header: 'Razorpay ids',
      hideBelow: 'lg',
      cell: (order) => <GatewayIds order={order} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order) => (
        <span className='grid justify-items-start gap-0.5'>
          <StatusBadge order={order} />
          {order.status === 'paid' && order.paid_at && (
            <span className='tabular text-xs text-muted-foreground'>
              {formatDateTime(order.paid_at)}
            </span>
          )}
          {order.status === 'failed' && order.failure_reason && (
            <span className='text-xs text-muted-foreground'>{order.failure_reason}</span>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (order) => <span className='tabular font-bold'>{rupees(order.amount)}</span>,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <p className='border-b px-4 py-3 text-sm text-muted-foreground'>
        Payments parents start in the app with Razorpay. Paid ones are already recorded on the
        invoice with a receipt. Not finished means the parent opened the checkout but did not
        complete it.
      </p>
      <ListToolbar
        summary={
          orders.data
            ? `${orders.data.total} online ${orders.data.total === 1 ? 'payment' : 'payments'}`
            : ''
        }
        onClear={
          filtered ? () => onChange({ search: undefined, online_status: undefined }) : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Invoice no. or Razorpay id'
          label='Search online payments'
        />
        <FilterSelect
          id='online-status-filter'
          label='Filter by status'
          allLabel='All statuses'
          value={search.online_status}
          options={ONLINE_ORDER_STATUS_OPTIONS}
          onChange={(value) => onChange({ online_status: value as OnlineOrderStatus | undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={orders.data?.items ?? []}
        columns={columns}
        rowKey={(order) => order.id}
        loading={orders.isFetching}
        error={orders.isError ? orders.error.message : null}
        onRetry={() => orders.refetch()}
        onRowClick={(order) => onOpenInvoice(order.invoice_id)}
        sort={{ sort: 'created_at', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ order: next.order })}
        empty={{
          icon: CreditCard,
          title: filtered ? 'No online payments match' : 'No online payments yet',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'When parents pay in the app, each attempt shows up here.',
        }}
        pagination={
          orders.data
            ? {
                page,
                limit: LIMIT,
                total: orders.data.total,
                label: 'online payments',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
        card={(order) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{order.student.full_name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {formatDateTime(order.created_at)} · {order.invoice_no}
                </span>
              </span>
              <span className='grid justify-items-end gap-1'>
                <span className='tabular font-bold'>{rupees(order.amount)}</span>
                <StatusBadge order={order} />
              </span>
            </div>
            <GatewayIds order={order} />
          </div>
        )}
      />
    </Card>
  )
}
