import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Receipt } from 'lucide-react'
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
import { hostelApi, useHostelMutation, type BillResult, type DepositSettleInput } from '../api'
import { labelOptions, REFUND_MODE } from '../labels'
import { HostelSelect } from './pickers'
import { applyApiError, nullIfEmpty, optionalAmount, optionalText } from './resident-form'
import { FormError } from './resident-form-parts'

const SETTLE_FORM_ID = 'hostel-deposit-settle'
const BILL_FORM_ID = 'hostel-bill-form'
const REFUND_OPTIONS = labelOptions(REFUND_MODE)

function BillSummary({ result }: { result: BillResult }) {
  const nothing = result.invoices_created === 0 && result.deposits_created === 0
  return (
    <div className='grid gap-4'>
      <div className='flex items-start gap-3 rounded-lg border p-3'>
        <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success'>
          {nothing ? <Receipt className='size-4' /> : <CircleCheck className='size-4' />}
        </span>
        <div className='grid gap-0.5 text-sm'>
          <span className='font-semibold'>
            {nothing
              ? 'Nothing new to bill'
              : `${result.invoices_created} fee ${result.invoices_created === 1 ? 'invoice' : 'invoices'} and ${result.deposits_created} ${result.deposits_created === 1 ? 'deposit' : 'deposits'} created`}
          </span>
          <span className='text-muted-foreground'>
            {nothing
              ? 'Every resident is already billed for the instalments that are due.'
              : `${rupees(result.amount)} billed. Collect it from the Fees page.`}
          </span>
        </div>
      </div>
      {result.skipped.length > 0 && (
        <div className='grid gap-2'>
          <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            Skipped ({result.skipped.length})
          </h3>
          <ul className='grid max-h-64 divide-y overflow-y-auto rounded-lg border'>
            {result.skipped.map((item) => (
              <li
                key={item.admission_id}
                className='flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-sm'
              >
                <span className='font-semibold'>{item.student_name}</span>
                <span className='text-muted-foreground'>{item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function BillResultDialog({
  result,
  onClose,
}: {
  result: BillResult | null
  onClose: () => void
}) {
  return (
    <AppModal
      open={Boolean(result)}
      onOpenChange={(next) => !next && onClose()}
      title='Hostel fee billing'
      footer={
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      }
    >
      {result && <BillSummary result={result} />}
    </AppModal>
  )
}

export function BillNowButton({
  admissionId,
  disabled,
}: {
  admissionId: number
  disabled?: boolean
}) {
  const bill = useHostelMutation(() => hostelApi.bill({ admission_ids: [admissionId] }))
  const [result, setResult] = useState<BillResult | null>(null)
  return (
    <>
      <Button
        variant='outline'
        size='sm'
        disabled={disabled}
        loading={bill.isPending}
        onClick={() =>
          void bill
            .mutateAsync(undefined)
            .then(setResult)
            .catch((error: unknown) => alerts.error(toApiError(error).message))
        }
      >
        <Receipt />
        Bill now
      </Button>
      <BillResultDialog result={result} onClose={() => setResult(null)} />
    </>
  )
}

export function BillModal({
  open,
  onOpenChange,
  hostelId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  hostelId?: number
}) {
  const bill = useHostelMutation((input: { hostel_id?: number }) => hostelApi.bill(input))
  const [result, setResult] = useState<BillResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hostel, setHostel] = useState<string | undefined>(hostelId ? String(hostelId) : undefined)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setHostel(hostelId ? String(hostelId) : undefined)
      setResult(null)
      setError(null)
    }
  }

  const close = (next: boolean) => {
    if (!next) onOpenChange(false)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={close}
      title={result ? 'Hostel fee billing' : 'Bill hostel fees'}
      description={
        result
          ? undefined
          : 'Creates a fee invoice for every instalment that is due and not billed yet, and a caution deposit for new residents. Residents without a bed are skipped.'
      }
      formId={result ? undefined : BILL_FORM_ID}
      submitText='Bill now'
      loading={bill.isPending}
      footer={
        result ? (
          <DialogFooter>
            <Button onClick={() => close(false)}>Done</Button>
          </DialogFooter>
        ) : undefined
      }
    >
      {result ? (
        <BillSummary result={result} />
      ) : (
        <form
          id={BILL_FORM_ID}
          noValidate
          className='grid gap-4'
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)
            try {
              setResult(await bill.mutateAsync({ hostel_id: hostel ? Number(hostel) : undefined }))
            } catch (caught) {
              setError(toApiError(caught).message)
            }
          }}
        >
          <FormError message={error ?? undefined} />
          <FormField id='bill-hostel' label='Hostel' hint='Leave as all hostels to bill everyone'>
            <HostelSelect
              id='bill-hostel'
              allLabel='All hostels'
              value={hostel}
              className='sm:w-full'
              onChange={setHostel}
            />
          </FormField>
        </form>
      )}
    </AppModal>
  )
}

const settleSchema = z
  .object({
    deduction_amount: optionalAmount,
    deduction_reason: optionalText(255, 'Reason'),
    refund_mode: z.string().min(1, 'Choose how the money goes back'),
    refund_reference: optionalText(60, 'Reference'),
  })
  .superRefine((values, context) => {
    if (Number(values.deduction_amount || 0) > 0 && !values.deduction_reason.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['deduction_reason'],
        message: 'Say why money is kept',
      })
    }
  })

type SettleValues = z.infer<typeof settleSchema>

export function SettleDepositModal({
  open,
  onOpenChange,
  admissionId,
  studentName,
  held,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  admissionId: number
  studentName: string
  held: number | null
}) {
  const settle = useHostelMutation((input: DepositSettleInput) =>
    hostelApi.settleDeposit(admissionId, input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Settle the caution deposit'
      description={`${studentName}${held !== null ? ` · ${rupees(held)} held` : ''}. Keep part of it for damages, refund the rest.`}
      formId={SETTLE_FORM_ID}
      submitText='Settle deposit'
      loading={settle.isPending}
    >
      {open && (
        <SettleForm
          held={held}
          onSubmit={async (input) => {
            await settle.mutateAsync(input)
            alerts.success('Deposit settled')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function SettleForm({
  held,
  onSubmit,
}: {
  held: number | null
  onSubmit: (input: DepositSettleInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SettleValues>({
    resolver: zodResolver(settleSchema),
    defaultValues: {
      deduction_amount: '',
      deduction_reason: '',
      refund_mode: '',
      refund_reference: '',
    },
  })
  const deduction = Number(useWatch({ control, name: 'deduction_amount' }) || 0) || 0
  const refund = held !== null ? Math.max(0, Math.round((held - deduction) * 100) / 100) : null

  const submit = handleSubmit(async (values) => {
    if (held !== null && deduction > held) {
      setError(
        'deduction_amount',
        { message: `Cannot be more than ${rupees(held)}` },
        { shouldFocus: true }
      )
      return
    }
    try {
      await onSubmit({
        deduction_amount: values.deduction_amount ? Number(values.deduction_amount) : undefined,
        deduction_reason: nullIfEmpty(values.deduction_reason),
        refund_mode: values.refund_mode as DepositSettleInput['refund_mode'],
        refund_reference: nullIfEmpty(values.refund_reference),
      })
    } catch (error) {
      applyApiError(error, setError, [
        'deduction_amount',
        'deduction_reason',
        'refund_mode',
        'refund_reference',
      ])
    }
  })

  return (
    <form id={SETTLE_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='settle-deduction'
          label='Keep (deduction)'
          error={errors.deduction_amount?.message}
          hint='Leave empty to refund everything'
        >
          <Input
            id='settle-deduction'
            inputMode='decimal'
            placeholder='0'
            className='tabular'
            aria-invalid={Boolean(errors.deduction_amount)}
            {...register('deduction_amount')}
          />
        </FormField>
        <FormField
          id='settle-reason'
          label='Why it is kept'
          required={deduction > 0}
          error={errors.deduction_reason?.message}
        >
          <Input
            id='settle-reason'
            placeholder='Broken chair'
            aria-invalid={Boolean(errors.deduction_reason)}
            {...register('deduction_reason')}
          />
        </FormField>
        <FormField id='settle-mode' label='Refund by' required error={errors.refund_mode?.message}>
          <Controller
            control={control}
            name='refund_mode'
            render={({ field }) => (
              <Combobox
                id='settle-mode'
                label='Refund by'
                value={field.value || undefined}
                options={REFUND_OPTIONS}
                placeholder='Choose refund mode'
                invalid={Boolean(errors.refund_mode)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='settle-reference'
          label='Reference'
          error={errors.refund_reference?.message}
          hint='UTR, cheque or receipt number'
        >
          <Input
            id='settle-reference'
            aria-invalid={Boolean(errors.refund_reference)}
            {...register('refund_reference')}
          />
        </FormField>
      </div>
      {refund !== null && (
        <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
          Refund to the family: <span className='tabular font-bold'>{rupees(refund)}</span>
        </p>
      )}
    </form>
  )
}
