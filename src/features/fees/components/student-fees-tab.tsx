import { useState } from 'react'
import { FileDown, IndianRupee, ReceiptIndianRupee } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { can, useMe } from '@/features/auth/api'
import { useStudentFees, type FeeInvoice, type FeePayment } from '../api'
import { PAYMENT_MODES, STUDENT_FEE_STATUS, rupees } from '../labels'
import { InvoiceModal, InvoiceStatusBadge } from './invoice-modal'
import { PaymentModal } from './payment-modal'
import { ReceiptModal } from './receipt-modal'

export function StudentFeesTab({ studentId }: { studentId: number }) {
  const canManage = can(useMe().data, 'fees.manage')
  const fees = useStudentFees(studentId)
  const [openId, setOpenId] = useState<number | null>(null)
  const [paying, setPaying] = useState<FeeInvoice | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null)
  const data = fees.data

  if (fees.isPending) {
    return (
      <div className='grid gap-3'>
        <Skeleton className='h-24' />
        <Skeleton className='h-48' />
      </div>
    )
  }
  if (fees.isError || !data) {
    return (
      <ErrorState message={fees.error?.message ?? 'Not found'} onRetry={() => fees.refetch()} />
    )
  }

  const status = STUDENT_FEE_STATUS[data.status]
  const stats: [string, string, string?][] = [
    ['Billed', rupees(data.total)],
    ['Paid', rupees(data.paid)],
    ['Balance', rupees(data.balance)],
    [
      'Overdue',
      rupees(data.overdue_amount),
      data.overdue_amount > 0 ? 'text-destructive' : undefined,
    ],
  ]

  return (
    <div className='grid gap-4'>
      <Card className='grid gap-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h2 className='font-bold'>Fee status</h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <span className='text-xs text-muted-foreground'>
            {data.next_due_date ? `Next due ${formatDate(data.next_due_date)}` : 'Nothing due'}
            {data.last_payment
              ? ` · Last paid ${rupees(data.last_payment.amount)} on ${formatDate(data.last_payment.date)}`
              : ''}
          </span>
        </div>
        <dl className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {stats.map(([label, value, tone]) => (
            <div key={label} className='grid gap-0.5 rounded-lg border px-3 py-2'>
              <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
              <dd className={`tabular text-lg font-extrabold ${tone ?? ''}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className='overflow-hidden'>
        <h2 className='border-b px-4 py-3 font-bold'>Invoices</h2>
        {data.invoices.length ? (
          <ul className='divide-y'>
            {data.invoices.map((invoice) => (
              <li key={invoice.id}>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={() => setOpenId(invoice.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setOpenId(invoice.id)
                    }
                  }}
                  className='flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:bg-muted/40'
                >
                  <span className='grid min-w-0'>
                    <span className='font-semibold'>
                      {invoice.installment}{' '}
                      <span className='font-mono text-xs font-normal text-muted-foreground'>
                        {invoice.invoice_no}
                      </span>
                    </span>
                    <span className='tabular text-xs text-muted-foreground'>
                      Due {formatDate(invoice.due_date)} · {rupees(invoice.paid)} paid of{' '}
                      {rupees(invoice.total)}
                    </span>
                  </span>
                  <span className='flex items-center gap-2'>
                    <span className='tabular text-sm font-bold'>{rupees(invoice.balance)}</span>
                    <InvoiceStatusBadge invoice={invoice} />
                    {canManage && invoice.balance > 0 && invoice.status !== 'cancelled' && (
                      <Button
                        size='sm'
                        variant='outline'
                        aria-label={`Record payment for ${invoice.invoice_no}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setPaying(invoice)
                        }}
                      >
                        <IndianRupee />
                        Pay
                      </Button>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ReceiptIndianRupee}
            title='No invoices yet'
            description='Invoices appear here once the office raises them from the Fees page.'
          />
        )}
      </Card>

      {data.payments.length > 0 && (
        <Card className='overflow-hidden'>
          <h2 className='border-b px-4 py-3 font-bold'>Payments</h2>
          <ul className='divide-y'>
            {data.payments.map((payment) => (
              <li
                key={payment.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-2.5'
              >
                <span className='grid min-w-0'>
                  <span className='tabular font-semibold'>
                    {rupees(payment.amount)}{' '}
                    <span className='font-normal text-muted-foreground'>
                      · {PAYMENT_MODES[payment.mode]} · {payment.installment}
                    </span>
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {formatDate(payment.paid_on)} · {payment.receipt_no}
                  </span>
                </span>
                <Button
                  size='sm'
                  variant='outline'
                  aria-label={`Receipt ${payment.receipt_no}`}
                  onClick={() => setReceiptPayment(payment)}
                >
                  <FileDown />
                  Receipt
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {openId && (
        <InvoiceModal
          invoiceId={openId}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onRecordPayment={(invoice) => {
            setOpenId(null)
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
            setOpenId(invId)
          }}
        />
      )}
    </div>
  )
}
