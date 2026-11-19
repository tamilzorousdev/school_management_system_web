import { useState } from 'react'
import { Ban, BadgePercent, CalendarClock, FileDown, IndianRupee, Undo2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  feesApi,
  useFeesMutation,
  useInvoice,
  type FeeInvoice,
  type FeeInvoiceDetail,
  type FeePayment,
} from '../api'
import type { FeeAccess } from '../access'
import {
  BENEFIT_KINDS,
  INVOICE_STATUS,
  amountError,
  formErrors,
  openInvoicePdf,
  round2,
  rupees,
} from '../labels'
import { PaymentListItem, ReversePaymentModal } from './payment-reversal'
import {
  PendingRequests,
  RefundList,
  RefundModal,
  RescheduleModal,
  WriteOffModal,
} from './requests'
import { ReceiptModal } from './receipt-modal'

export function InvoiceStatusBadge({ invoice }: { invoice: FeeInvoice }) {
  if (invoice.is_overdue) {
    return (
      <Badge tone='danger'>
        Overdue {invoice.days_overdue} {invoice.days_overdue === 1 ? 'day' : 'days'}
      </Badge>
    )
  }
  const status = INVOICE_STATUS[invoice.status]
  return <Badge tone={status.tone}>{status.label}</Badge>
}

export function InvoiceModal({
  invoiceId,
  access,
  onClose,
  onRecordPayment,
}: {
  invoiceId: number
  access: FeeAccess
  onClose: () => void
  onRecordPayment: (invoice: FeeInvoice) => void
}) {
  const invoice = useInvoice(invoiceId)
  const [editingDiscount, setEditingDiscount] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)
  const [reversing, setReversing] = useState<FeePayment | null>(null)
  const [refunding, setRefunding] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [writingOff, setWritingOff] = useState(false)
  const data = invoice.data
  const open = (access.adjust || access.collect) && data && data.status !== 'cancelled'
  const waiting = (kind: string, paymentId?: number) =>
    Boolean(
      data?.pending_requests.some(
        (row) => row.kind === kind && (paymentId === undefined || row.payment_id === paymentId)
      )
    )

  const footer = data ? (
    <DialogFooter className='flex-wrap gap-2'>
      <Button variant='outline' className='sm:mr-auto' onClick={() => openInvoicePdf(data.id)}>
        <FileDown />
        Invoice PDF
      </Button>
      {open && access.adjust && data.paid === 0 && !waiting('cancel') && (
        <Button
          variant='ghost'
          className='text-destructive hover:bg-destructive/10'
          onClick={() => setCancelling(true)}
        >
          <Ban />
          Cancel invoice
        </Button>
      )}
      {open && access.adjust && data.balance > 0 && !waiting('write_off') && (
        <Button
          variant='ghost'
          className='text-destructive hover:bg-destructive/10'
          onClick={() => setWritingOff(true)}
        >
          Write off
        </Button>
      )}
      {open && access.adjust && data.balance > 0 && !waiting('reschedule') && (
        <Button variant='outline' onClick={() => setRescheduling(true)}>
          <CalendarClock />
          Due date
        </Button>
      )}
      {open && access.adjust && data.paid > data.refunded && !waiting('refund') && (
        <Button variant='outline' onClick={() => setRefunding(true)}>
          <Undo2 />
          Refund
        </Button>
      )}
      {open && access.adjust && !waiting('discount') && (
        <Button variant='outline' onClick={() => setEditingDiscount(true)}>
          <BadgePercent />
          Discount
        </Button>
      )}
      {open && access.collect && data.balance > 0 && (
        <Button onClick={() => onRecordPayment(data)}>
          <IndianRupee />
          Record payment
        </Button>
      )}
    </DialogFooter>
  ) : undefined

  return (
    <AppModal
      open
      onOpenChange={(next) => !next && onClose()}
      title={data ? `Invoice ${data.invoice_no}` : 'Invoice'}
      description={
        data
          ? `${data.student.full_name} · ${data.student.admission_no}${data.student.class_section ? ` · Class ${data.student.class_section}` : ''}`
          : undefined
      }
      size='lg'
      footer={footer ?? <span />}
    >
      {invoice.isPending ? (
        <div className='grid gap-3'>
          <Skeleton className='h-16' />
          <Skeleton className='h-40' />
        </div>
      ) : invoice.isError || !data ? (
        <ErrorState
          message={invoice.error?.message ?? 'Not found'}
          onRetry={() => invoice.refetch()}
        />
      ) : (
        <div className='grid min-w-0 gap-5'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
            <InvoiceStatusBadge invoice={data} />
            <span>
              <span className='text-muted-foreground'>Installment </span>
              <span className='font-semibold'>{data.installment}</span>
            </span>
            <span>
              <span className='text-muted-foreground'>Due </span>
              <span className='tabular font-semibold'>{formatDate(data.due_date)}</span>
              {data.original_due_date && (
                <span className='text-xs text-muted-foreground'>
                  {' '}
                  (first {formatDate(data.original_due_date)})
                </span>
              )}
            </span>
          </div>
          {data.status === 'cancelled' && (
            <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
              Cancelled{data.cancel_reason ? `: ${data.cancel_reason}` : ''}
            </p>
          )}
          <PendingRequests invoice={data} canApprove={access.approve} />
          <InvoiceLines invoice={data} />
          {editingDiscount && (
            <DiscountForm invoice={data} onDone={() => setEditingDiscount(false)} />
          )}
          <section className='grid gap-2'>
            <h3 className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Payments
            </h3>
            {data.payments.length ? (
              <ul className='divide-y rounded-lg border'>
                {data.payments.map((payment) => (
                  <PaymentListItem
                    key={payment.id}
                    payment={payment}
                    canReverse={access.adjust && !waiting('reversal', payment.id)}
                    onReceipt={() => setSelectedPayment(payment)}
                    onReverse={() => setReversing(payment)}
                  />
                ))}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>No payments yet.</p>
            )}
          </section>
          <RefundList invoice={data} />
        </div>
      )}
      {cancelling && data && (
        <CancelInvoiceModal invoice={data} onClose={() => setCancelling(false)} />
      )}
      {selectedPayment && (
        <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
      {reversing && <ReversePaymentModal payment={reversing} onClose={() => setReversing(null)} />}
      {refunding && data && <RefundModal invoice={data} onClose={() => setRefunding(false)} />}
      {writingOff && data && <WriteOffModal invoice={data} onClose={() => setWritingOff(false)} />}
      {rescheduling && data && (
        <RescheduleModal invoice={data} onClose={() => setRescheduling(false)} />
      )}
    </AppModal>
  )
}

function CancelInvoiceModal({
  invoice,
  onClose,
}: {
  invoice: FeeInvoiceDetail
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const cancel = useFeesMutation(() => feesApi.cancel(invoice.id, reason.trim()))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Ask to cancel this invoice?'
      description={`Once approved, ${invoice.invoice_no} for ${invoice.student.full_name} (${rupees(invoice.total)}) will no longer be due. You can raise the installment again later.`}
      formId='fee-cancel-form'
      submitText='Send for approval'
      cancelText='Keep invoice'
      loading={cancel.isPending}
    >
      <form
        id='fee-cancel-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (reason.trim().length < 3) {
            setErrors({ reason: 'Give the reason, for example: raised twice by mistake' })
            return
          }
          setErrors({})
          try {
            await cancel.mutateAsync(undefined)
            alerts.success('Cancellation sent for approval')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                INVOICE_HAS_PAYMENTS: 'reason',
                INVOICE_CANCELLED: 'reason',
                REQUEST_PENDING: 'reason',
                YEAR_ARCHIVED: 'reason',
              })
            )
          }
        }}
      >
        <FormField id='cancel-reason' label='Reason' required error={errors.reason}>
          <Textarea
            id='cancel-reason'
            autoFocus
            rows={3}
            maxLength={200}
            value={reason}
            placeholder='Raised twice by mistake'
            aria-invalid={Boolean(errors.reason) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function InvoiceLines({ invoice }: { invoice: FeeInvoiceDetail }) {
  return (
    <div className='overflow-hidden rounded-lg border'>
      <table className='w-full text-sm'>
        <tbody className='divide-y'>
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td className='px-3 py-2'>
                <span className='font-semibold'>{line.head_name}</span>
                {line.description && (
                  <span className='block text-xs text-muted-foreground'>{line.description}</span>
                )}
              </td>
              <td className='tabular px-3 py-2 text-right align-top'>{rupees(line.amount)}</td>
            </tr>
          ))}
          {invoice.benefits.map((benefit, index) => {
            const head = invoice.lines.find((line) => line.fee_head_id === benefit.fee_head_id)
            return (
              <tr key={`${benefit.benefit_id}-${benefit.fee_head_id ?? 0}-${index}`}>
                <td className='px-3 py-2'>
                  <span className='font-semibold'>{benefit.name}</span>
                  <span className='block text-xs text-muted-foreground'>
                    {BENEFIT_KINDS[benefit.kind]}
                    {head ? ` on ${head.head_name}` : ''}
                  </span>
                </td>
                <td className='tabular px-3 py-2 text-right align-top text-success'>
                  − {rupees(benefit.amount)}
                </td>
              </tr>
            )
          })}
          {invoice.discount > 0 && (
            <tr>
              <td className='px-3 py-2'>
                <span className='font-semibold'>Discount</span>
                {invoice.discount_reason && (
                  <span className='block text-xs text-muted-foreground'>
                    {invoice.discount_reason}
                  </span>
                )}
              </td>
              <td className='tabular px-3 py-2 text-right align-top text-success'>
                − {rupees(invoice.discount)}
              </td>
            </tr>
          )}
          <tr className='bg-muted/40 font-bold'>
            <td className='px-3 py-2'>Total</td>
            <td className='tabular px-3 py-2 text-right'>{rupees(invoice.total)}</td>
          </tr>
          <tr>
            <td className='px-3 py-2 text-muted-foreground'>Paid</td>
            <td className='tabular px-3 py-2 text-right'>{rupees(invoice.paid)}</td>
          </tr>
          {invoice.refunded > 0 && (
            <tr>
              <td className='px-3 py-2 text-muted-foreground'>Refunded</td>
              <td className='tabular px-3 py-2 text-right'>{rupees(invoice.refunded)}</td>
            </tr>
          )}
          <tr className='font-bold'>
            <td className='px-3 py-2'>Balance</td>
            <td className='tabular px-3 py-2 text-right'>{rupees(invoice.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DiscountForm({ invoice, onDone }: { invoice: FeeInvoiceDetail; onDone: () => void }) {
  const [mode, setMode] = useState<'amount' | 'percent'>('amount')
  const [amount, setAmount] = useState(String(invoice.discount || ''))
  const base = round2(invoice.gross - invoice.benefit)
  const [percentage, setPercentage] = useState(
    invoice.discount && base > 0 ? String(round2((invoice.discount / base) * 100)) : ''
  )
  const [reason, setReason] = useState(invoice.discount_reason ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const max = round2(base - invoice.paid)
  const maxPercent = base > 0 ? round2((max / base) * 100) : 100

  const computedRupees =
    mode === 'percent' ? round2(((Number(percentage) || 0) / 100) * base) : Number(amount) || 0

  const computedPercent =
    mode === 'amount' && base > 0
      ? round2(((Number(amount) || 0) / base) * 100)
      : Number(percentage) || 0

  const save = useFeesMutation(() => feesApi.discount(invoice.id, computedRupees, reason.trim()))

  return (
    <form
      noValidate
      className='grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[14rem_1fr_auto] sm:items-start'
      onSubmit={async (event) => {
        event.preventDefault()
        const next: Record<string, string> = {}
        const valToTest = mode === 'percent' ? String(computedRupees) : amount
        const message = valToTest.trim() ? amountError(valToTest, max, 'discount') : undefined
        if (message) next.discount = message
        else if (mode === 'percent') {
          const p = Number(percentage)
          if (p < 0 || p > 100) next.discount = 'Enter a valid percentage between 0 and 100'
          else if (p > maxPercent)
            next.discount = `Percentage cannot exceed ${maxPercent}% (${rupees(max)})`
        }
        if (reason.trim().length < 3) next.reason = 'Give the reason, for the approver'
        setErrors(next)
        if (Object.keys(next).length) return
        try {
          await save.mutateAsync(undefined)
          alerts.success('Discount sent for approval', {
            description: 'The invoice changes once the AO or school admin approves it.',
          })
          onDone()
        } catch (error) {
          setErrors(
            formErrors(error, {
              DISCOUNT_TOO_HIGH: 'discount',
              NO_CHANGE: 'discount',
              REQUEST_PENDING: 'discount',
            })
          )
        }
      }}
    >
      <div className='grid gap-1.5'>
        <div className='flex items-center justify-between'>
          <span className='text-xs font-semibold text-muted-foreground'>Discount Type</span>
          <div className='inline-flex rounded-md border bg-muted/60 p-0.5 text-xs'>
            <button
              type='button'
              onClick={() => {
                setMode('amount')
                if (percentage) setAmount(String(computedRupees || ''))
              }}
              className={cn(
                'rounded px-2 py-0.5 font-medium transition-colors',
                mode === 'amount'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ₹ Flat
            </button>
            <button
              type='button'
              onClick={() => {
                setMode('percent')
                if (amount) setPercentage(String(computedPercent || ''))
              }}
              className={cn(
                'rounded px-2 py-0.5 font-medium transition-colors',
                mode === 'percent'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              % Percent
            </button>
          </div>
        </div>

        {mode === 'amount' ? (
          <FormField id='discount-amount' label='' error={errors.discount}>
            <div className='relative'>
              <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
                ₹
              </span>
              <Input
                id='discount-amount'
                type='number'
                inputMode='decimal'
                min={0}
                step='0.01'
                className='tabular pl-7'
                value={amount}
                placeholder='0.00'
                aria-invalid={Boolean(errors.discount) || undefined}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </FormField>
        ) : (
          <FormField id='discount-percent' label='' error={errors.discount}>
            <div className='relative'>
              <Input
                id='discount-percent'
                type='number'
                inputMode='decimal'
                min={0}
                max={100}
                step='0.1'
                className='tabular pr-7'
                value={percentage}
                placeholder='0'
                aria-invalid={Boolean(errors.discount) || undefined}
                onChange={(event) => setPercentage(event.target.value)}
              />
              <span className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground'>
                %
              </span>
            </div>
          </FormField>
        )}
      </div>

      <FormField id='discount-reason' label='Reason' error={errors.reason}>
        <Input
          id='discount-reason'
          value={reason}
          maxLength={200}
          placeholder='For example: sibling concession'
          aria-invalid={Boolean(errors.reason) || undefined}
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>

      <div className='flex gap-2 sm:pt-6'>
        <Button type='button' variant='ghost' onClick={onDone}>
          Close
        </Button>
        <Button type='submit' loading={save.isPending}>
          Send for approval
        </Button>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground sm:col-span-3'>
        <span>
          Up to {rupees(max)} ({maxPercent}%). Enter 0 to remove.
        </span>
        {mode === 'percent' && Number(percentage) > 0 && (
          <span className='font-medium text-foreground'>
            {percentage}% equals{' '}
            <span className='font-bold text-emerald-600 dark:text-emerald-400'>
              {rupees(computedRupees)}
            </span>{' '}
            discount
          </span>
        )}
        {mode === 'amount' && Number(amount) > 0 && (
          <span className='font-medium text-foreground'>
            {rupees(Number(amount))} equals{' '}
            <span className='font-bold text-emerald-600 dark:text-emerald-400'>
              {computedPercent}%
            </span>{' '}
            of gross
          </span>
        )}
      </div>
    </form>
  )
}
