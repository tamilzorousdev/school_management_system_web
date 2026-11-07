import { useState } from 'react'
import { FileDown, Wallet } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import { useClasses } from '@/features/setup/api'
import { usePaymentSummary, usePayments, type FeePayment, type PaymentMode } from '../api'
import { MODE_OPTIONS, PAYMENT_MODES, rupees } from '../labels'
import type { FeesSearch } from '../search'
import { ReceiptModal } from './receipt-modal'

const LIMIT = 20

export function PaymentsTab({
  search,
  onChange,
}: {
  search: FeesSearch
  onChange: (patch: Partial<FeesSearch>) => void
}) {
  const page = search.page ?? 1
  const classes = useClasses()
  const filters = {
    from: search.from,
    to: search.to,
    mode: search.mode,
    class_id: search.class_id,
  }
  const payments = usePayments({
    ...filters,
    page,
    limit: LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
  })
  const summary = usePaymentSummary(filters)
  const filtered = Boolean(
    search.search || search.from || search.to || search.mode || search.class_id
  )
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)

  useShortcut('app.refresh', () => {
    void payments.refetch()
    void summary.refetch()
  })

  const receiptButton = (payment: FeePayment) => (
    <Button
      size='sm'
      variant='outline'
      aria-label={`Receipt ${payment.receipt_no}`}
      onClick={(event) => {
        event.stopPropagation()
        setSelectedPayment(payment)
      }}
    >
      <FileDown />
      Receipt
    </Button>
  )

  const columns: Column<FeePayment>[] = [
    {
      key: 'date',
      header: 'Date',
      sortKey: 'paid_on',
      cell: (payment) => <span className='tabular'>{formatDate(payment.paid_on)}</span>,
    },
    {
      key: 'receipt',
      header: 'Receipt',
      sortKey: 'receipt_no',
      hideBelow: 'lg',
      cell: (payment) => <span className='font-mono text-xs'>{payment.receipt_no}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      cell: (payment) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{payment.student.full_name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {payment.student.class_section ? `${payment.student.class_section} · ` : ''}
            {payment.installment}
          </span>
        </span>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      cell: (payment) => (
        <span className='grid'>
          <span>{PAYMENT_MODES[payment.mode]}</span>
          {payment.reference && (
            <span className='truncate text-xs text-muted-foreground'>{payment.reference}</span>
          )}
        </span>
      ),
    },
    {
      key: 'by',
      header: 'Received by',
      hideBelow: 'xl',
      cell: (payment) => payment.received_by ?? '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortKey: 'amount',
      cell: (payment) => <span className='tabular font-bold'>{rupees(payment.amount)}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: receiptButton },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-end gap-3 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <span className='text-xs font-semibold text-muted-foreground'>
            {filtered ? 'Collected for these filters' : 'Collected in all'}
          </span>
          <span className='tabular text-2xl font-extrabold tracking-tight'>
            {rupees(summary.data?.amount ?? 0)}
          </span>
        </div>
        <span className='tabular text-xs text-muted-foreground sm:mb-1'>
          {summary.data?.count ?? 0} payments
          {summary.data?.by_mode.length
            ? ` · ${summary.data.by_mode
                .map((row) => `${PAYMENT_MODES[row.mode]} ${rupees(row.amount)}`)
                .join(' · ')}`
            : ''}
        </span>
      </div>
      <ListToolbar
        summary={payments.data ? `${payments.data.total} payments` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  from: undefined,
                  to: undefined,
                  mode: undefined,
                  class_id: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Student, receipt or reference'
          label='Search payments'
        />
        <label className='flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto'>
          <span className='w-10 shrink-0 sm:w-auto'>From</span>
          <Input
            type='date'
            aria-label='From date'
            value={search.from ?? ''}
            max={search.to}
            className='h-9 sm:w-40'
            onChange={(event) => onChange({ from: event.target.value || undefined })}
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
            onChange={(event) => onChange({ to: event.target.value || undefined })}
          />
        </label>
        <FilterSelect
          id='payments-mode-filter'
          label='Filter by mode'
          allLabel='All modes'
          value={search.mode}
          options={MODE_OPTIONS}
          onChange={(value) => onChange({ mode: value as PaymentMode | undefined })}
        />
        <FilterSelect
          id='payments-class-filter'
          label='Filter by class'
          allLabel='All classes'
          value={search.class_id ? String(search.class_id) : undefined}
          options={(classes.data ?? []).map((item) => ({
            value: String(item.id),
            label: `Class ${item.name}`,
          }))}
          onChange={(value) => onChange({ class_id: value ? Number(value) : undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={payments.data?.items ?? []}
        columns={columns}
        rowKey={(payment) => payment.id}
        loading={payments.isFetching}
        error={payments.isError ? payments.error.message : null}
        onRetry={() => payments.refetch()}
        onRowClick={(payment) => onChange({ invoice_id: payment.invoice_id })}
        sort={{ sort: search.sort ?? 'paid_on', order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
        empty={{
          icon: Wallet,
          title: filtered ? 'No payments match' : 'No payments yet',
          description: filtered
            ? 'Try another date range or clear the filters.'
            : 'Payments recorded on invoices show up here.',
        }}
        pagination={
          payments.data
            ? {
                page,
                limit: LIMIT,
                total: payments.data.total,
                label: 'payments',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
        card={(payment) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{payment.student.full_name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {formatDate(payment.paid_on)} · {PAYMENT_MODES[payment.mode]} ·{' '}
                  {payment.receipt_no}
                </span>
              </span>
              <span className='tabular font-bold'>{rupees(payment.amount)}</span>
            </div>
          </div>
        )}
      />
      {selectedPayment && (
        <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </Card>
  )
}
