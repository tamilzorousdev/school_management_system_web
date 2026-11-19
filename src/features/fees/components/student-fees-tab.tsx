import { useState } from 'react'
import { FileDown, Gavel, IndianRupee, ReceiptIndianRupee } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { useMe } from '@/features/auth/api'
import { feeAccess } from '../access'
import { feesApi, useFeesMutation, useStudentFees, type FeeInvoice, type FeePayment } from '../api'
import {
  PAYMENT_MODES,
  STUDENT_FEE_STATUS,
  formErrors,
  openAdvanceReceipt,
  rupees,
} from '../labels'
import { RaiseFineModal } from './fines-tab'
import { InvoiceModal, InvoiceStatusBadge } from './invoice-modal'
import { PaymentModal } from './payment-modal'
import { PaymentListItem, ReversePaymentModal } from './payment-reversal'
import { ReceiptModal } from './receipt-modal'
import { StudentPaymentModal } from './student-payment-modal'

export function StudentFeesTab({ studentId }: { studentId: number }) {
  const access = feeAccess(useMe().data)
  const fees = useStudentFees(studentId)
  const [openId, setOpenId] = useState<number | null>(null)
  const [paying, setPaying] = useState<FeeInvoice | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<FeePayment | null>(null)
  const [reversing, setReversing] = useState<FeePayment | null>(null)
  const [collecting, setCollecting] = useState(false)
  const [fining, setFining] = useState(false)
  const useCredit = useFeesMutation(() => feesApi.applyCredit(studentId))
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
          <span className='flex flex-wrap items-center gap-3'>
            <span className='text-xs text-muted-foreground'>
              {data.next_due_date ? `Next due ${formatDate(data.next_due_date)}` : 'Nothing due'}
              {data.last_payment
                ? ` · Last paid ${rupees(data.last_payment.amount)} on ${formatDate(data.last_payment.date)}`
                : ''}
            </span>
            {access.fine && (
              <Button size='sm' variant='outline' onClick={() => setFining(true)}>
                <Gavel />
                Raise fine
              </Button>
            )}
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
        {(access.collect || data.credit_balance > 0) && (
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <span className='text-sm text-muted-foreground'>
              {data.credit_balance > 0 ? (
                <>
                  Advance credit{' '}
                  <span className='tabular font-bold text-foreground'>
                    {rupees(data.credit_balance)}
                  </span>
                  , used on the next invoices
                </>
              ) : (
                'No advance credit'
              )}
            </span>
            {access.collect && (
              <span className='flex flex-wrap gap-2'>
                {data.credit_balance > 0 && data.balance > 0 && (
                  <Button
                    size='sm'
                    variant='outline'
                    loading={useCredit.isPending}
                    onClick={async () => {
                      try {
                        const result = await useCredit.mutateAsync(undefined)
                        alerts.success(`${rupees(result.applied_amount)} of advance credit used`)
                      } catch (error) {
                        formErrors(error)
                      }
                    }}
                  >
                    Use credit now
                  </Button>
                )}
                <Button size='sm' onClick={() => setCollecting(true)}>
                  <IndianRupee />
                  Record payment
                </Button>
              </span>
            )}
          </div>
        )}
        {data.previous_dues.amount > 0 && (
          <p className='rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm'>
            <span className='font-semibold'>{rupees(data.previous_dues.amount)}</span> of the
            balance is from {data.previous_dues.academic_years.join(', ')} (
            {data.previous_dues.invoices === 1
              ? '1 invoice'
              : `${data.previous_dues.invoices} invoices`}
            ).
          </p>
        )}
        {data.advances.length > 0 && (
          <div className='grid gap-1.5'>
            <h3 className='text-xs font-semibold text-muted-foreground'>Advance receipts</h3>
            <ul className='divide-y rounded-lg border'>
              {data.advances.map((advance) => (
                <li
                  key={advance.collection_id}
                  className='flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm'
                >
                  <span className='grid min-w-0'>
                    <span className='truncate font-mono text-xs'>{advance.receipt_no}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {formatDate(advance.paid_on)} · {PAYMENT_MODES[advance.mode]} · from{' '}
                      {rupees(advance.collected)} paid
                    </span>
                  </span>
                  <span className='flex items-center gap-2'>
                    <span className='tabular font-bold'>{rupees(advance.amount)}</span>
                    <Button
                      size='sm'
                      variant='outline'
                      aria-label={`Advance receipt ${advance.receipt_no}`}
                      onClick={() => openAdvanceReceipt(advance.collection_id)}
                    >
                      <FileDown />
                      Receipt
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
                      {invoice.kind === 'fine' && (
                        <Badge tone='danger' className='mr-1.5 align-middle'>
                          Fine
                        </Badge>
                      )}
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
                    {access.collect && invoice.balance > 0 && invoice.status !== 'cancelled' && (
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

      {data.upcoming.length > 0 && (
        <Card className='overflow-hidden'>
          <div className='border-b px-4 py-3'>
            <h2 className='font-bold'>Upcoming installments</h2>
            <p className='text-xs text-muted-foreground'>
              In this year’s fee plan, not billed yet. Amounts are estimates before concessions.
            </p>
          </div>
          <ul className='divide-y'>
            {data.upcoming.map((item) => (
              <li
                key={item.installment}
                className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'
              >
                <span className='grid min-w-0'>
                  <span className='font-semibold'>{item.installment}</span>
                  <span className='text-xs text-muted-foreground'>
                    Due {formatDate(item.due_date)} ·{' '}
                    {item.lines
                      .map((line) => `${line.head_name} ${rupees(line.amount)}`)
                      .join(', ')}
                  </span>
                </span>
                <span className='flex items-center gap-2'>
                  <span className='tabular text-sm font-bold'>≈ {rupees(item.amount)}</span>
                  <Badge tone='neutral'>Not billed</Badge>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.payments.length > 0 && (
        <Card className='overflow-hidden'>
          <h2 className='border-b px-4 py-3 font-bold'>Payments</h2>
          <ul className='divide-y'>
            {data.payments.map((payment) => (
              <PaymentListItem
                key={payment.id}
                payment={payment}
                showInstallment
                canReverse={access.adjust}
                onReceipt={() => setReceiptPayment(payment)}
                onReverse={() => setReversing(payment)}
              />
            ))}
          </ul>
        </Card>
      )}

      {openId && (
        <InvoiceModal
          invoiceId={openId}
          access={access}
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
      {collecting && <StudentPaymentModal fees={data} onClose={() => setCollecting(false)} />}
      {fining && (
        <RaiseFineModal
          student={{ id: studentId, name: data.student.full_name }}
          onClose={() => setFining(false)}
        />
      )}
      {reversing && <ReversePaymentModal payment={reversing} onClose={() => setReversing(null)} />}
    </div>
  )
}
