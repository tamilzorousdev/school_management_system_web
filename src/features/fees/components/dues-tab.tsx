import { useState } from 'react'
import { AlertTriangle, CalendarClock, IndianRupee, ReceiptIndianRupee, Wallet } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useClasses } from '@/features/setup/api'
import {
  useFeeInsights,
  useInstallments,
  useInvoices,
  type FeeInvoice,
  type FeePayment,
  type InvoiceStatus,
} from '../api'
import { STATUS_OPTIONS, invoicesText, rupees, wholeRupees } from '../labels'
import type { FeesSearch } from '../search'
import { InvoiceModal, InvoiceStatusBadge } from './invoice-modal'
import { PaymentModal } from './payment-modal'
import { ReceiptModal } from './receipt-modal'

const LIMIT = 20

export function DuesTab({
  search,
  canManage,
  onChange,
}: {
  search: FeesSearch
  canManage: boolean
  onChange: (patch: Partial<FeesSearch>) => void
}) {
  const page = search.page ?? 1
  const insights = useFeeInsights()
  const classes = useClasses()
  const installments = useInstallments()
  const invoices = useInvoices({
    page,
    limit: LIMIT,
    search: search.search,
    status: search.status,
    class_id: search.class_id,
    section_id: search.section_id,
    installment: search.installment,
    overdue: search.overdue,
    sort: search.sort,
    order: search.order,
  })
  const [paying, setPaying] = useState<FeeInvoice | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null)
  const filtered = Boolean(
    search.search ||
    search.status ||
    search.class_id ||
    search.section_id ||
    search.installment ||
    search.overdue
  )
  const sections = (classes.data ?? []).find((item) => item.id === search.class_id)?.sections ?? []
  const stats = insights.data

  useShortcut('app.refresh', () => {
    void invoices.refetch()
    void insights.refetch()
  })

  const cards: Insight[] = [
    {
      key: 'collected',
      label: 'Collected',
      value: wholeRupees(stats?.collected ?? 0),
      hint: `of ${wholeRupees(stats?.total_billed ?? 0)} billed`,
      icon: Wallet,
      tone: 'success',
      active: search.status === 'paid',
      onClick: () => onChange({ status: search.status === 'paid' ? undefined : 'paid' }),
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: wholeRupees(stats?.outstanding ?? 0),
      hint: `${stats?.by_status.unpaid ?? 0} unpaid, ${stats?.by_status.partly_paid ?? 0} part paid`,
      icon: CalendarClock,
      tone: 'warning',
      active: search.status === 'unpaid',
      onClick: () => onChange({ status: search.status === 'unpaid' ? undefined : 'unpaid' }),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: wholeRupees(stats?.overdue_amount ?? 0),
      hint: `${stats?.students_overdue ?? 0} students`,
      icon: AlertTriangle,
      tone: 'danger',
      active: Boolean(search.overdue),
      onClick: () => onChange({ overdue: search.overdue ? undefined : true }),
    },
    {
      key: 'today',
      label: 'Collected today',
      value: wholeRupees(stats?.todays_collection ?? 0),
      hint: `${stats?.todays_payments ?? 0} payments`,
      icon: IndianRupee,
      tone: 'info',
    },
  ]

  const studentCell = (invoice: FeeInvoice) => (
    <span className='grid min-w-0'>
      <span className='truncate font-bold'>{invoice.student.full_name}</span>
      <span className='truncate text-xs text-muted-foreground'>
        <span className='font-mono'>{invoice.student.admission_no}</span>
        {invoice.student.class_section ? ` · ${invoice.student.class_section}` : ''}
      </span>
    </span>
  )

  const payButton = (invoice: FeeInvoice) =>
    canManage &&
    invoice.balance > 0 &&
    invoice.status !== 'cancelled' && (
      <Button
        size='sm'
        variant='outline'
        aria-label={`Record payment for ${invoice.student.full_name}, ${invoice.invoice_no}`}
        onClick={(event) => {
          event.stopPropagation()
          setPaying(invoice)
        }}
      >
        <IndianRupee />
        Record payment
      </Button>
    )

  const columns: Column<FeeInvoice>[] = [
    { key: 'student', header: 'Student', cell: studentCell, sortKey: 'student' },
    {
      key: 'invoice',
      header: 'Invoice',
      hideBelow: 'xl',
      sortKey: 'invoice_no',
      cell: (invoice) => (
        <span className='grid'>
          <span className='font-mono text-xs'>{invoice.invoice_no}</span>
          <span className='text-xs text-muted-foreground'>{invoice.installment}</span>
        </span>
      ),
    },
    {
      key: 'due',
      header: 'Due date',
      sortKey: 'due_date',
      cell: (invoice) => <span className='tabular'>{formatDate(invoice.due_date)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      hideBelow: 'lg',
      sortKey: 'total',
      cell: (invoice) => <span className='tabular'>{rupees(invoice.total)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      hideBelow: 'xl',
      cell: (invoice) => (
        <span className='tabular text-muted-foreground'>{rupees(invoice.paid)}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      sortKey: 'balance',
      cell: (invoice) => <span className='tabular font-bold'>{rupees(invoice.balance)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (invoice) => <InvoiceStatusBadge invoice={invoice} />,
    },
    { key: 'actions', header: '', align: 'right', cell: payButton },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={invoices.data ? invoicesText(invoices.data.total) : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    status: undefined,
                    class_id: undefined,
                    section_id: undefined,
                    installment: undefined,
                    overdue: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Student, admission or invoice no.'
            label='Search invoices'
          />
          <FilterSelect
            id='fees-class-filter'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) =>
              onChange({ class_id: value ? Number(value) : undefined, section_id: undefined })
            }
          />
          {search.class_id && sections.length > 0 && (
            <FilterSelect
              id='fees-section-filter'
              label='Filter by section'
              allLabel='All sections'
              value={search.section_id ? String(search.section_id) : undefined}
              options={sections.map((section) => ({
                value: String(section.id),
                label: `Section ${section.name}`,
              }))}
              onChange={(value) => onChange({ section_id: value ? Number(value) : undefined })}
            />
          )}
          <FilterSelect
            id='fees-status-filter'
            label='Filter by status'
            allLabel='Open and paid'
            value={search.status}
            options={STATUS_OPTIONS}
            onChange={(value) => onChange({ status: value as InvoiceStatus | undefined })}
          />
          <FilterSelect
            id='fees-installment-filter'
            label='Filter by installment'
            allLabel='All installments'
            value={search.installment}
            options={(installments.data ?? []).map((item) => ({
              value: item.installment,
              label: item.installment,
              hint: formatDate(item.due_date),
            }))}
            onChange={(value) => onChange({ installment: value })}
          />
        </ListToolbar>
        <DataTable
          rows={invoices.data?.items ?? []}
          columns={columns}
          rowKey={(invoice) => invoice.id}
          loading={invoices.isFetching}
          error={invoices.isError ? invoices.error.message : null}
          onRetry={() => invoices.refetch()}
          onRowClick={(invoice) => onChange({ invoice_id: invoice.id })}
          sort={{ sort: search.sort ?? 'due_date', order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange({ sort: next.sort, order: next.order })}
          empty={{
            icon: ReceiptIndianRupee,
            title: filtered ? 'No invoices match' : 'No invoices yet',
            description: filtered
              ? 'Try other filters or clear them.'
              : 'Set up the fee plan of each class, then raise invoices from the Fee plans tab.',
          }}
          pagination={
            invoices.data
              ? {
                  page,
                  limit: LIMIT,
                  total: invoices.data.total,
                  label: 'invoices',
                  onPageChange: (next) => onChange({ page: next }),
                }
              : undefined
          }
          card={(invoice) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                {studentCell(invoice)}
                <InvoiceStatusBadge invoice={invoice} />
              </div>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='grid text-xs text-muted-foreground'>
                  <span>
                    {invoice.installment} · due {formatDate(invoice.due_date)}
                  </span>
                  <span className='tabular'>
                    Balance{' '}
                    <span className='font-bold text-foreground'>{rupees(invoice.balance)}</span> of{' '}
                    {rupees(invoice.total)}
                  </span>
                </span>
              </div>
            </div>
          )}
        />
      </Card>
      {search.invoice_id && (
        <InvoiceModal
          invoiceId={search.invoice_id}
          canManage={canManage}
          onClose={() => onChange({ invoice_id: undefined })}
          onRecordPayment={(invoice) => {
            onChange({ invoice_id: undefined })
            setPaying(invoice)
          }}
        />
      )}
      {paying && (
        <PaymentModal
          invoice={paying}
          onClose={() => setPaying(null)}
          onPaid={(payment) => {
            setPaying(null)
            setReceiptPayment(payment)
          }}
        />
      )}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          onClose={() => {
            const invId = receiptPayment.invoice_id
            setReceiptPayment(null)
            onChange({ invoice_id: invId })
          }}
        />
      )}
    </div>
  )
}
