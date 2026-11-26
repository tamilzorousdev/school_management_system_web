import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Download, Printer } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  PAYMENT_MODES,
  libraryApi,
  useLibraryMutation,
  type FinePayment,
  type PaymentMode,
} from '../api'
import { optionalAmount, optionalText, requiredAmount, textOrNull } from '../form-utils'
import { PAYMENT_MODE, downloadFineReceipt, openFineReceipt, optionsOf, today } from '../labels'
import { FormError } from './library-parts'

export interface FineTarget {
  id: number
  balance: number
  reason: string
  member_name?: string
}

const COLLECT_FORM = 'library-collect-fine'
const WAIVE_FORM = 'library-waive-fine'

const collectSchema = (balance: number) =>
  z.object({
    amount: requiredAmount(0.01, balance, 'Amount'),
    mode: z.enum(PAYMENT_MODES, { message: 'Choose how it was paid' }),
    reference: optionalText(60, 'Reference'),
    paid_on: z
      .string()
      .min(1, 'Choose the payment date')
      .refine((value) => value <= today(), 'Payment date cannot be in the future'),
    notes: optionalText(255, 'Notes'),
  })

type CollectValues = z.infer<ReturnType<typeof collectSchema>>

export function CollectFineModal({ fine, onClose }: { fine: FineTarget; onClose: () => void }) {
  const [paid, setPaid] = useState<FinePayment | null>(null)
  const pay = useLibraryMutation((values: CollectValues) =>
    libraryApi.payFine(fine.id, {
      amount: Number(values.amount),
      mode: values.mode,
      reference: textOrNull(values.reference),
      paid_on: values.paid_on,
      notes: textOrNull(values.notes),
    })
  )

  if (paid) return <ReceiptStep payment={paid} onClose={onClose} />

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Collect fine'
      description={`${fine.member_name ? `${fine.member_name} · ` : ''}${fine.reason}. Balance ${rupees(fine.balance)}.`}
      formId={COLLECT_FORM}
      submitText='Collect'
      loading={pay.isPending}
    >
      <CollectForm
        balance={fine.balance}
        onSubmit={async (values) => {
          const result = await pay.mutateAsync(values)
          alerts.success(`${rupees(result.payment.amount)} collected`, {
            description: `Receipt ${result.payment.receipt_no}`,
          })
          setPaid(result.payment)
        }}
      />
    </AppModal>
  )
}

function CollectForm({
  balance,
  onSubmit,
}: {
  balance: number
  onSubmit: (values: CollectValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CollectValues>({
    resolver: zodResolver(collectSchema(balance)),
    defaultValues: {
      amount: String(balance),
      mode: 'cash',
      reference: '',
      paid_on: today(),
      notes: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      const field = apiError.fieldErrors[0]?.field
      if (field === 'amount' || field === 'mode' || field === 'reference' || field === 'paid_on') {
        setError(field, { message: apiError.fieldErrors[0].message })
      } else {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <form id={COLLECT_FORM} noValidate onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <FormError message={errors.root?.message} />
      </div>
      <FormField id='fine-amount' label='Amount (₹)' required error={errors.amount?.message}>
        <Input
          id='fine-amount'
          inputMode='decimal'
          autoFocus
          aria-invalid={Boolean(errors.amount)}
          {...register('amount')}
        />
      </FormField>
      <FormField id='fine-mode' label='Paid by' required error={errors.mode?.message}>
        <Controller
          control={control}
          name='mode'
          render={({ field }) => (
            <Combobox
              id='fine-mode'
              label='Paid by'
              placeholder='Choose how it was paid'
              value={field.value}
              options={optionsOf(PAYMENT_MODE)}
              onChange={(next) => field.onChange(next as PaymentMode | undefined)}
              className='sm:w-full'
              invalid={Boolean(errors.mode)}
              highlightSelected={false}
            />
          )}
        />
      </FormField>
      <FormField id='fine-paid-on' label='Paid on' required error={errors.paid_on?.message}>
        <Controller
          control={control}
          name='paid_on'
          render={({ field }) => (
            <Input
              id='fine-paid-on'
              type='date'
              max={today()}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              aria-invalid={Boolean(errors.paid_on)}
            />
          )}
        />
      </FormField>
      <FormField
        id='fine-reference'
        label='Reference'
        hint='UPI, card or cheque reference'
        error={errors.reference?.message}
      >
        <Input id='fine-reference' {...register('reference')} />
      </FormField>
      <FormField
        id='fine-notes'
        label='Notes'
        error={errors.notes?.message}
        className='sm:col-span-2'
      >
        <Input id='fine-notes' {...register('notes')} />
      </FormField>
    </form>
  )
}

function ReceiptStep({ payment, onClose }: { payment: FinePayment; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Fine collected'
      description={`${payment.member.name} · receipt ${payment.receipt_no}`}
      footer={
        <DialogFooter>
          <Button
            variant='primary'
            onClick={() => openFineReceipt(payment.id)}
            className='h-9 w-[112px] px-4 gap-2 font-medium'
          >
            <Printer className='size-4' />
            Print
          </Button>
          <Button
            variant='outline'
            loading={downloading}
            onClick={async () => {
              setDownloading(true)
              await downloadFineReceipt(payment.id, payment.receipt_no)
              setDownloading(false)
            }}
            className='h-9 w-[134px] px-4 gap-2 font-medium border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] dark:bg-card dark:text-foreground dark:border-border'
          >
            <Download className='size-4' />
            Download PDF
          </Button>
          <Button variant='secondary' onClick={onClose}>Done</Button>
        </DialogFooter>
      }
    >
      <div className='grid gap-3 text-sm'>
        <div className='flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3'>
          <CheckCircle2 className='size-5 shrink-0 text-success' />
          <div className='grid'>
            <span className='tabular text-xl font-extrabold'>{rupees(payment.amount)}</span>
            <span className='text-xs text-muted-foreground'>
              {PAYMENT_MODE[payment.mode]} · {formatDate(payment.paid_on)}
              {payment.reference ? ` · ${payment.reference}` : ''}
            </span>
          </div>
        </div>
        <p className='text-muted-foreground'>{payment.fine_reason}</p>
      </div>
    </AppModal>
  )
}

const waiveSchema = (balance: number) =>
  z.object({
    amount: optionalAmount(balance, 'Amount').refine(
      (value) => !value || Number(value) > 0,
      'Amount must be more than 0'
    ),
    reason: z.string().trim().min(3, 'Give a reason (3 to 255 characters)').max(255),
  })

type WaiveValues = z.infer<ReturnType<typeof waiveSchema>>

export function WaiveFineModal({ fine, onClose }: { fine: FineTarget; onClose: () => void }) {
  const waive = useLibraryMutation((values: WaiveValues) =>
    libraryApi.waiveFine(fine.id, {
      amount: values.amount ? Number(values.amount) : undefined,
      reason: values.reason,
    })
  )
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WaiveValues>({
    resolver: zodResolver(waiveSchema(fine.balance)),
    defaultValues: { amount: '', reason: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await waive.mutateAsync(values)
      alerts.success('Fine waived')
      onClose()
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Waive fine'
      description={`${fine.member_name ? `${fine.member_name} · ` : ''}${fine.reason}. Balance ${rupees(fine.balance)}.`}
      formId={WAIVE_FORM}
      submitText='Waive'
      loading={waive.isPending}
    >
      <form id={WAIVE_FORM} noValidate onSubmit={submit} className='grid gap-4'>
        <FormError message={errors.root?.message} />
        <FormField
          id='waive-amount'
          label='Amount to waive (₹)'
          hint={`Leave empty to waive the whole balance of ${rupees(fine.balance)}`}
          error={errors.amount?.message}
        >
          <Input id='waive-amount' inputMode='decimal' {...register('amount')} />
        </FormField>
        <FormField id='waive-reason' label='Reason' required error={errors.reason?.message}>
          <Input
            id='waive-reason'
            autoFocus
            placeholder='Student was in hospital'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
