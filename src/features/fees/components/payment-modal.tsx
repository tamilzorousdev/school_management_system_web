import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { today } from '@/features/attendance/labels'
import {
  feesApi,
  useFeesMutation,
  type FeeInvoice,
  type FeePayment,
  type PaymentMode,
} from '../api'
import { MODE_OPTIONS, amountError, formErrors, rupees } from '../labels'

const FORM_ID = 'fee-payment-form'

const CARD_NETWORKS = [
  { value: 'Visa', label: 'Visa' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: 'RuPay', label: 'RuPay' },
  { value: 'Amex', label: 'American Express' },
  { value: 'Other', label: 'Other Card' },
]

const COMMON_BANKS = [
  { value: 'State Bank of India', label: 'State Bank of India (SBI)' },
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Canara Bank', label: 'Canara Bank' },
  { value: 'Indian Bank', label: 'Indian Bank' },
  { value: 'Bank of Baroda', label: 'Bank of Baroda' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
  { value: 'Punjab National Bank', label: 'Punjab National Bank' },
  { value: 'Union Bank of India', label: 'Union Bank of India' },
]

export function PaymentModal({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: FeeInvoice
  onClose: () => void
  onPaid: (payment: FeePayment) => void
}) {
  const [amount, setAmount] = useState(String(invoice.balance))
  const [mode, setMode] = useState<PaymentMode | undefined>('cash')
  const [paidOn, setPaidOn] = useState(today())
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mode-specific fields
  const [upiRef, setUpiRef] = useState('')
  const [upiVpa, setUpiVpa] = useState('')

  const [cardNetwork, setCardNetwork] = useState('Visa')
  const [cardLast4, setCardLast4] = useState('')
  const [cardAuth, setCardAuth] = useState('')

  const [bankUtr, setBankUtr] = useState('')
  const [bankName, setBankName] = useState('')

  const [chequeNo, setChequeNo] = useState('')
  const [chequeBank, setChequeBank] = useState('')
  const [chequeBranch, setChequeBranch] = useState('')
  const [chequeDate, setChequeDate] = useState(today())

  const pay = useFeesMutation(
    (payload: {
      amount: number
      mode: PaymentMode
      reference?: string
      paid_on: string
      notes?: string
    }) => feesApi.pay(invoice.id, payload)
  )

  const clear = (field: string) => errors[field] && setErrors((prev) => ({ ...prev, [field]: '' }))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Record payment'
      description={`${invoice.student.full_name} · ${invoice.invoice_no} · ${invoice.installment}. Balance ${rupees(invoice.balance)}.`}
      formId={FORM_ID}
      submitText='Record payment'
      loading={pay.isPending}
    >
      <form
        id={FORM_ID}
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          const amountMessage = amountError(amount, invoice.balance)
          if (amountMessage) next.amount = amountMessage
          else if (Number(amount) <= 0) next.amount = 'Enter an amount more than 0'
          if (!mode) next.mode = 'Choose how it was paid'
          if (!paidOn) next.paid_on = 'Choose the payment date'
          else if (paidOn > today()) next.paid_on = 'Payment date cannot be in the future'

          let resolvedReference: string | undefined = undefined

          if (mode === 'upi') {
            if (!upiRef.trim()) next.upiRef = 'Enter the UPI transaction ID or UTR'
            resolvedReference = upiVpa.trim()
              ? `UPI Ref: ${upiRef.trim()} (${upiVpa.trim()})`
              : `UPI Ref: ${upiRef.trim()}`
          } else if (mode === 'card') {
            if (!cardAuth.trim()) next.cardAuth = 'Enter the auth or transaction code'
            resolvedReference = `${cardNetwork}${cardLast4.trim() ? ` ····${cardLast4.trim()}` : ''} (Auth: ${cardAuth.trim()})`
          } else if (mode === 'bank_transfer') {
            if (!bankUtr.trim()) next.bankUtr = 'Enter the UTR or transfer reference'
            if (!bankName.trim()) next.bankName = 'Enter or select the bank name'
            resolvedReference = `UTR: ${bankUtr.trim()} · ${bankName.trim()}`
          } else if (mode === 'cheque') {
            if (!chequeNo.trim()) next.chequeNo = 'Enter the cheque number'
            if (!chequeBank.trim()) next.chequeBank = 'Enter the bank name'
            if (!chequeDate) next.chequeDate = 'Enter the cheque date'
            resolvedReference = `Chq #${chequeNo.trim()} · ${chequeBank.trim()}${chequeBranch.trim() ? ` (${chequeBranch.trim()})` : ''} · Dt: ${chequeDate}`
          }

          setErrors(next)
          if (Object.keys(next).length) return

          try {
            const payment = await pay.mutateAsync({
              amount: Number(amount),
              mode: mode!,
              reference: resolvedReference,
              paid_on: paidOn,
              notes: notes.trim() || undefined,
            })
            alerts.success(`Payment of ${rupees(payment.amount)} recorded`, {
              description: `Receipt ${payment.receipt_no} · balance ${rupees(payment.invoice_balance)}`,
            })
            onPaid(payment)
          } catch (error) {
            setErrors(
              formErrors(error, { PAYMENT_EXCEEDS_BALANCE: 'amount', INVOICE_PAID: 'amount' })
            )
          }
        }}
      >
        <FormField id='payment-amount' label='Amount' required error={errors.amount}>
          <div className='relative'>
            <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
              ₹
            </span>
            <Input
              id='payment-amount'
              type='number'
              inputMode='decimal'
              min={0}
              step='0.01'
              className='tabular pl-7'
              value={amount}
              aria-invalid={Boolean(errors.amount) || undefined}
              onChange={(event) => {
                setAmount(event.target.value)
                clear('amount')
              }}
            />
          </div>
        </FormField>

        <FormField id='payment-mode' label='Paid by' required error={errors.mode}>
          <Combobox
            id='payment-mode'
            label='Paid by'
            value={mode}
            options={MODE_OPTIONS}
            placeholder='Choose how it was paid'
            searchPlaceholder='Search payment modes'
            invalid={Boolean(errors.mode)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => {
              setMode(value as PaymentMode | undefined)
              clear('mode')
              setErrors({})
            }}
          />
        </FormField>

        {/* Dynamic Mode-Specific Fields */}
        {mode === 'upi' && (
          <div className='grid gap-4 rounded-lg border bg-muted/20 p-3 sm:col-span-2 sm:grid-cols-2'>
            <FormField
              id='upi-ref'
              label='UPI Ref / UTR number'
              required
              error={errors.upiRef}
              hint='12-digit transaction ID or reference'
            >
              <Input
                id='upi-ref'
                value={upiRef}
                maxLength={50}
                placeholder='e.g. 412233445566'
                aria-invalid={Boolean(errors.upiRef) || undefined}
                onChange={(event) => {
                  setUpiRef(event.target.value)
                  clear('upiRef')
                }}
              />
            </FormField>

            <FormField id='upi-vpa' label='Sender UPI ID / VPA' hint='Optional sender address'>
              <Input
                id='upi-vpa'
                value={upiVpa}
                maxLength={60}
                placeholder='e.g. parent@okaxis'
                onChange={(event) => setUpiVpa(event.target.value)}
              />
            </FormField>
          </div>
        )}

        {mode === 'card' && (
          <div className='grid gap-4 rounded-lg border bg-muted/20 p-3 sm:col-span-2 sm:grid-cols-3'>
            <FormField id='card-network' label='Card network' required>
              <Combobox
                id='card-network'
                label='Card network'
                value={cardNetwork}
                options={CARD_NETWORKS}
                placeholder='Network'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => setCardNetwork(value || 'Visa')}
              />
            </FormField>

            <FormField id='card-last4' label='Last 4 digits' hint='Optional card digits'>
              <Input
                id='card-last4'
                value={cardLast4}
                maxLength={4}
                placeholder='e.g. 4321'
                onChange={(event) => setCardLast4(event.target.value.replace(/\D/g, ''))}
              />
            </FormField>

            <FormField
              id='card-auth'
              label='Auth / Approval code'
              required
              error={errors.cardAuth}
              hint='POS slip authorization'
            >
              <Input
                id='card-auth'
                value={cardAuth}
                maxLength={40}
                placeholder='e.g. TXN98765'
                aria-invalid={Boolean(errors.cardAuth) || undefined}
                onChange={(event) => {
                  setCardAuth(event.target.value)
                  clear('cardAuth')
                }}
              />
            </FormField>
          </div>
        )}

        {mode === 'bank_transfer' && (
          <div className='grid gap-4 rounded-lg border bg-muted/20 p-3 sm:col-span-2 sm:grid-cols-2'>
            <FormField
              id='bank-utr'
              label='UTR / Ref number'
              required
              error={errors.bankUtr}
              hint='NEFT / RTGS / IMPS reference'
            >
              <Input
                id='bank-utr'
                value={bankUtr}
                maxLength={50}
                placeholder='e.g. HDFCN261107...'
                aria-invalid={Boolean(errors.bankUtr) || undefined}
                onChange={(event) => {
                  setBankUtr(event.target.value)
                  clear('bankUtr')
                }}
              />
            </FormField>

            <FormField id='bank-name' label='Sending bank name' required error={errors.bankName}>
              <Combobox
                id='bank-name'
                label='Bank name'
                value={bankName}
                options={COMMON_BANKS}
                placeholder='Choose or enter bank'
                searchPlaceholder='Search bank'
                invalid={Boolean(errors.bankName)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => {
                  setBankName(value || '')
                  clear('bankName')
                }}
              />
            </FormField>
          </div>
        )}

        {mode === 'cheque' && (
          <div className='grid gap-4 rounded-lg border bg-muted/20 p-3 sm:col-span-2 sm:grid-cols-2'>
            <FormField
              id='cheque-no'
              label='Cheque number'
              required
              error={errors.chequeNo}
              hint='6-digit cheque number'
            >
              <Input
                id='cheque-no'
                value={chequeNo}
                maxLength={20}
                placeholder='e.g. 000123'
                aria-invalid={Boolean(errors.chequeNo) || undefined}
                onChange={(event) => {
                  setChequeNo(event.target.value)
                  clear('chequeNo')
                }}
              />
            </FormField>

            <FormField id='cheque-date' label='Cheque date' required error={errors.chequeDate}>
              <Input
                id='cheque-date'
                type='date'
                value={chequeDate}
                aria-invalid={Boolean(errors.chequeDate) || undefined}
                onChange={(event) => {
                  setChequeDate(event.target.value)
                  clear('chequeDate')
                }}
              />
            </FormField>

            <FormField id='cheque-bank' label='Bank name' required error={errors.chequeBank}>
              <Combobox
                id='cheque-bank'
                label='Bank name'
                value={chequeBank}
                options={COMMON_BANKS}
                placeholder='Choose or enter bank'
                searchPlaceholder='Search bank'
                invalid={Boolean(errors.chequeBank)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => {
                  setChequeBank(value || '')
                  clear('chequeBank')
                }}
              />
            </FormField>

            <FormField id='cheque-branch' label='Branch name' hint='Optional branch location'>
              <Input
                id='cheque-branch'
                value={chequeBranch}
                maxLength={50}
                placeholder='e.g. Anna Nagar Branch'
                onChange={(event) => setChequeBranch(event.target.value)}
              />
            </FormField>
          </div>
        )}

        <FormField id='payment-date' label='Payment date' required error={errors.paid_on}>
          <Input
            id='payment-date'
            type='date'
            value={paidOn}
            max={today()}
            aria-invalid={Boolean(errors.paid_on) || undefined}
            onChange={(event) => {
              setPaidOn(event.target.value)
              clear('paid_on')
            }}
          />
        </FormField>

        <FormField id='payment-notes' label='Notes' error={errors.notes} className='sm:col-span-2'>
          <Input
            id='payment-notes'
            value={notes}
            maxLength={300}
            placeholder='Optional, for example who paid or counter remarks'
            onChange={(event) => setNotes(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
