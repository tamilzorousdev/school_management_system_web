import { useState } from 'react'
import { FileDown, Undo2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { feesApi, useFeesMutation, type FeePayment } from '../api'
import { PAYMENT_MODES, PAYMENT_STATUS, formErrors, rupees } from '../labels'

const FORM_ID = 'fee-reverse-form'

export function ReversedBadge({ payment }: { payment: FeePayment }) {
  if (payment.status !== 'reversed') return null
  return <Badge tone={PAYMENT_STATUS.reversed.tone}>{PAYMENT_STATUS.reversed.label}</Badge>
}

export function PaymentAmount({ payment }: { payment: FeePayment }) {
  return (
    <span
      className={cn(
        'tabular font-semibold',
        payment.status === 'reversed' && 'text-muted-foreground line-through'
      )}
    >
      {rupees(payment.amount)}
    </span>
  )
}

export function PaymentListItem({
  payment,
  showInstallment = false,
  canReverse,
  onReceipt,
  onReverse,
}: {
  payment: FeePayment
  showInstallment?: boolean
  canReverse: boolean
  onReceipt: () => void
  onReverse: () => void
}) {
  const reversed = payment.status === 'reversed'
  return (
    <li className='flex flex-wrap items-center justify-between gap-2 px-3 py-2.5'>
      <span className='grid min-w-0'>
        <span className='flex flex-wrap items-center gap-x-1.5 gap-y-1'>
          <PaymentAmount payment={payment} />
          <span className='text-muted-foreground'>
            · {PAYMENT_MODES[payment.mode]}
            {showInstallment ? ` · ${payment.installment}` : ''}
          </span>
          <ReversedBadge payment={payment} />
        </span>
        <span className='truncate text-xs text-muted-foreground'>
          {formatDate(payment.paid_on)} · {payment.receipt_no}
          {payment.reference ? ` · ${payment.reference}` : ''}
        </span>
        {reversed && (
          <span className='text-xs text-muted-foreground'>
            Reversed{payment.reversed_by ? ` by ${payment.reversed_by}` : ''}
            {payment.reversed_at ? ` on ${formatDate(payment.reversed_at)}` : ''}
            {payment.reversal_reason ? `: ${payment.reversal_reason}` : ''}
          </span>
        )}
      </span>
      <span className='flex gap-1.5'>
        {canReverse && !reversed && (
          <Button
            size='sm'
            variant='ghost'
            className='text-destructive hover:bg-destructive/10'
            aria-label={`Reverse payment ${payment.receipt_no}`}
            onClick={onReverse}
          >
            <Undo2 />
            Reverse
          </Button>
        )}
        <Button
          size='sm'
          variant='outline'
          aria-label={`Receipt ${payment.receipt_no}`}
          onClick={onReceipt}
        >
          <FileDown />
          Receipt
        </Button>
      </span>
    </li>
  )
}

export function ReversePaymentModal({
  payment,
  onClose,
}: {
  payment: FeePayment
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const reverse = useFeesMutation(() => feesApi.reverse(payment.id, reason.trim()))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Ask to reverse payment ${payment.receipt_no}?`}
      description={`Once approved, ${rupees(payment.amount)} from ${payment.student.full_name} on ${formatDate(payment.paid_on)} will no longer count as paid, and the invoice balance goes back up by that amount. The payment and its receipt stay on record, marked reversed.`}
      formId={FORM_ID}
      submitText='Send for approval'
      loading={reverse.isPending}
    >
      <form
        id={FORM_ID}
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (reason.trim().length < 3) {
            setErrors({ reason: 'Give the reason, for example: cheque bounced' })
            return
          }
          setErrors({})
          try {
            await reverse.mutateAsync(undefined)
            alerts.success('Reversal sent for approval')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                PAYMENT_ALREADY_REVERSED: 'reason',
                YEAR_ARCHIVED: 'reason',
                REQUEST_PENDING: 'reason',
              })
            )
          }
        }}
      >
        <FormField id='reverse-reason' label='Reason' required error={errors.reason}>
          <Textarea
            id='reverse-reason'
            autoFocus
            rows={3}
            maxLength={300}
            value={reason}
            placeholder='Cheque bounced'
            aria-invalid={Boolean(errors.reason) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
