import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { today } from '@/features/attendance/labels'
import { feesApi, useFeesMutation, type ManualPaymentMode, type StudentFees } from '../api'
import {
  MANUAL_MODE_OPTIONS,
  amountError,
  formErrors,
  newIdempotencyKey,
  round2,
  rupees,
} from '../labels'

export function StudentPaymentModal({ fees, onClose }: { fees: StudentFees; onClose: () => void }) {
  const open = fees.invoices
    .filter((invoice) => invoice.status !== 'cancelled' && invoice.balance > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id)
  const [amount, setAmount] = useState(String(fees.balance || ''))
  const [mode, setMode] = useState<ManualPaymentMode>('cash')
  const [reference, setReference] = useState('')
  const [paidOn, setPaidOn] = useState(today())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key] = useState(newIdempotencyKey)
  const collect = useFeesMutation(() =>
    feesApi.collect(
      fees.student.id,
      { amount: Number(amount), mode, reference: reference.trim() || undefined, paid_on: paidOn },
      key
    )
  )

  const received = Number(amount) || 0
  const plan = open.map((invoice, index) => {
    const before = round2(open.slice(0, index).reduce((sum, item) => sum + item.balance, 0))
    return { invoice, part: round2(Math.max(0, Math.min(received - before, invoice.balance))) }
  })
  const advance = round2(Math.max(0, received - open.reduce((sum, item) => sum + item.balance, 0)))

  return (
    <AppModal
      open
      onOpenChange={(next) => !next && onClose()}
      title={`Record a payment for ${fees.student.full_name}`}
      description='It pays the unpaid invoices oldest first, one receipt each. Anything more is kept as advance credit and used on the next invoices.'
      formId='fee-collect-form'
      submitText='Record payment'
      loading={collect.isPending}
      size='lg'
    >
      <form
        id='fee-collect-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          const message = amountError(amount, 10000000)
          if (message) next.amount = message
          else if (!(Number(amount) > 0)) next.amount = 'Enter more than 0'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const result = await collect.mutateAsync(undefined)
            alerts.success(
              result.payments.length === 1
                ? `Payment recorded · ${result.payments[0]!.receipt_no}`
                : `Payment recorded on ${result.payments.length} invoices`,
              result.advance_amount > 0
                ? {
                    description: `${rupees(result.advance_amount)} kept as advance credit (receipt ${result.advance_receipt_no}).`,
                  }
                : undefined
            )
            onClose()
          } catch (error) {
            setErrors(formErrors(error, { IDEMPOTENCY_CONFLICT: 'amount' }))
          }
        }}
      >
        <FormField id='collect-amount' label='Amount received' required error={errors.amount}>
          <div className='relative'>
            <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
              ₹
            </span>
            <Input
              id='collect-amount'
              type='number'
              inputMode='decimal'
              min={0}
              step='0.01'
              className='tabular pl-7'
              value={amount}
              aria-invalid={Boolean(errors.amount) || undefined}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        </FormField>
        <FormField id='collect-mode' label='Paid by' required>
          <Combobox
            id='collect-mode'
            label='Paid by'
            value={mode}
            options={MANUAL_MODE_OPTIONS}
            placeholder='Choose'
            onChange={(value) => value && setMode(value as ManualPaymentMode)}
          />
        </FormField>
        <FormField id='collect-reference' label='Reference'>
          <Input
            id='collect-reference'
            value={reference}
            maxLength={200}
            placeholder='UPI, cheque or card reference'
            onChange={(event) => setReference(event.target.value)}
          />
        </FormField>
        <FormField id='collect-date' label='Paid on' required>
          <Input
            id='collect-date'
            type='date'
            value={paidOn}
            max={today()}
            onChange={(event) => setPaidOn(event.target.value)}
          />
        </FormField>
        <div className='overflow-hidden rounded-lg border sm:col-span-2'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/40 text-left text-xs text-muted-foreground'>
              <tr>
                <th className='px-3 py-2 font-semibold'>Invoice</th>
                <th className='px-3 py-2 text-right font-semibold'>Balance</th>
                <th className='px-3 py-2 text-right font-semibold'>This payment</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {plan.map(({ invoice, part }) => (
                <tr key={invoice.id} className={part ? undefined : 'text-muted-foreground'}>
                  <td className='px-3 py-2'>
                    <span className='font-semibold'>{invoice.installment}</span>
                    <span className='block text-xs text-muted-foreground'>
                      {invoice.invoice_no} · due {formatDate(invoice.due_date)}
                    </span>
                  </td>
                  <td className='tabular px-3 py-2 text-right'>{rupees(invoice.balance)}</td>
                  <td className='tabular px-3 py-2 text-right font-semibold'>{rupees(part)}</td>
                </tr>
              ))}
              {advance > 0 && (
                <tr className='bg-muted/40'>
                  <td className='px-3 py-2 font-semibold' colSpan={2}>
                    Kept as advance credit
                  </td>
                  <td className='tabular px-3 py-2 text-right font-semibold'>{rupees(advance)}</td>
                </tr>
              )}
              {!open.length && advance === 0 && (
                <tr>
                  <td className='px-3 py-2 text-muted-foreground' colSpan={3}>
                    Nothing is due. The whole amount is kept as advance credit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </form>
    </AppModal>
  )
}
