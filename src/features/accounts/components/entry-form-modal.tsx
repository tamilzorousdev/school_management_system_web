import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FileField, FormAlert, type AttachedFile } from '@/features/maintenance/components/shared'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import {
  accountsApi,
  useAccountCategories,
  useAccountsMutation,
  type AccountEntry,
  type AccountKind,
  type AccountPaymentMode,
  type EntryInput,
} from '../api'
import { PAYMENT_MODE_OPTIONS } from '../labels'

const FORM_ID = 'account-entry-form'
const MAX = 10_000_000

const schema = z.object({
  category_id: z.string().min(1, 'Choose the category'),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date')
    .refine((value) => value <= today(), 'The date cannot be in the future'),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter the amount, from ₹1 to ₹1,00,00,000')
    .refine((value) => {
      const number = Number(value)
      return Number.isFinite(number) && number >= 1 && number <= MAX
    }, 'Enter the amount, from ₹1 to ₹1,00,00,000'),
  payment_mode: z.string().min(1, 'Choose how it was paid'),
  party: z.string().trim().max(120, 'Must be 120 characters or less'),
  reference: z.string().trim().max(60, 'Reference must be 60 characters or less'),
  note: z.string().trim().max(500, 'Note must be 500 characters or less'),
})

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'category_id',
  'entry_date',
  'amount',
  'payment_mode',
  'party',
  'reference',
  'note',
]

const COPY: Record<
  AccountKind,
  { noun: string; description: string; party: string; partyHint: string; mode: string }
> = {
  expense: {
    noun: 'expense',
    description: 'A school bill or payment: electricity, stationery, repairs, rent and the like.',
    party: 'Paid to',
    partyHint: 'TNEB',
    mode: 'Paid by',
  },
  income: {
    noun: 'income',
    description:
      'Money the school received other than fees: donations, uniform or book sales, hall rent and the like.',
    party: 'Received from',
    partyHint: 'Alumni association',
    mode: 'Received by',
  },
}

interface EntryFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: AccountKind
  entry: AccountEntry | null
  canApprove: boolean
}

export function EntryFormModal({
  open,
  onOpenChange,
  kind,
  entry,
  canApprove,
}: EntryFormModalProps) {
  const copy = COPY[kind]
  const save = useAccountsMutation((input: EntryInput) =>
    entry ? accountsApi.update(entry.id, input) : accountsApi.create(input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? `Edit ${copy.noun} ${entry.entry_no}` : `Add ${copy.noun}`}
      description={
        entry || canApprove
          ? copy.description
          : `${copy.description} It is counted once an approver approves it.`
      }
      formId={FORM_ID}
      submitText={entry ? 'Save changes' : `Add ${copy.noun}`}
      loading={save.isPending || uploading}
      size='lg'
    >
      {open && (
        <EntryForm
          key={entry?.id ?? `new-${kind}`}
          kind={kind}
          entry={entry}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            const saved = await save.mutateAsync(input)
            alerts.success(
              entry
                ? 'Entry updated'
                : saved.status === 'approved'
                  ? `${saved.entry_no} added`
                  : `${saved.entry_no} sent for approval`
            )
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function EntryForm({
  kind,
  entry,
  onUploadingChange,
  onSubmit,
}: {
  kind: AccountKind
  entry: AccountEntry | null
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: EntryInput) => Promise<void>
}) {
  const copy = COPY[kind]
  const categories = useAccountCategories(kind)
  const options = (categories.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
  if (entry && !options.some((option) => option.value === String(entry.category.id)))
    options.unshift({ value: String(entry.category.id), label: entry.category.name })
  const [bill, setBill] = useState<AttachedFile | null>(entry?.file ?? null)
  const [billError, setBillError] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: entry ? String(entry.category.id) : '',
      entry_date: entry?.entry_date ?? today(),
      amount: entry?.amount.toString() ?? '',
      payment_mode: entry?.payment_mode ?? 'cash',
      party: entry?.party ?? '',
      reference: entry?.reference ?? '',
      note: entry?.note ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    const clear = entry ? null : undefined
    const input: EntryInput = {
      category_id: Number(values.category_id),
      entry_date: values.entry_date,
      amount: Number(values.amount),
      payment_mode: values.payment_mode as AccountPaymentMode,
      party: values.party || clear,
      reference: values.reference || clear,
      file_id: bill ? bill.id : clear,
      note: values.note || clear,
    }
    if (!entry) input.kind = kind
    try {
      await onSubmit(input)
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, { file_id: setBillError })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='entry-category' label='Category' required error={errors.category_id?.message}>
        <Controller
          control={control}
          name='category_id'
          render={({ field }) => (
            <Combobox
              id='entry-category'
              label='Category'
              value={field.value || undefined}
              options={options}
              placeholder='Choose a category'
              searchPlaceholder='Search categories'
              emptyText='No categories yet'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.category_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='entry-date' label='Date' required error={errors.entry_date?.message}>
        <Controller
          control={control}
          name='entry_date'
          render={({ field }) => (
            <Input
              id='entry-date'
              type='date'
              max={today()}
              aria-invalid={Boolean(errors.entry_date) || undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
      <FormField id='entry-amount' label='Amount (₹)' required error={errors.amount?.message}>
        <Input
          id='entry-amount'
          type='number'
          inputMode='decimal'
          min={1}
          max={MAX}
          step='0.01'
          placeholder='8450'
          aria-invalid={Boolean(errors.amount) || undefined}
          {...register('amount')}
        />
      </FormField>
      <FormField id='entry-mode' label={copy.mode} required error={errors.payment_mode?.message}>
        <Controller
          control={control}
          name='payment_mode'
          render={({ field }) => (
            <Combobox
              id='entry-mode'
              label={copy.mode}
              value={field.value || undefined}
              options={PAYMENT_MODE_OPTIONS}
              placeholder='Choose how'
              searchPlaceholder='Search payment modes'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.payment_mode)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='entry-party' label={copy.party} error={errors.party?.message}>
        <Input
          id='entry-party'
          maxLength={120}
          placeholder={copy.partyHint}
          aria-invalid={Boolean(errors.party) || undefined}
          {...register('party')}
        />
      </FormField>
      <FormField
        id='entry-reference'
        label='Reference'
        hint='Bill, cheque or UTR number'
        error={errors.reference?.message}
      >
        <Input
          id='entry-reference'
          maxLength={60}
          placeholder={kind === 'expense' ? 'BILL-20931' : 'CHQ 004512'}
          aria-invalid={Boolean(errors.reference) || undefined}
          {...register('reference')}
        />
      </FormField>
      <FileField
        id='entry-bill'
        label={kind === 'expense' ? 'Bill' : 'Receipt or letter'}
        purpose='account_bill'
        file={bill}
        onChange={setBill}
        onUploadingChange={onUploadingChange}
        error={billError}
        onError={setBillError}
        className='sm:col-span-2'
      />
      <FormField
        id='entry-note'
        label='Note'
        error={errors.note?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='entry-note'
          rows={2}
          maxLength={500}
          placeholder={kind === 'expense' ? 'October bill' : 'Annual day sponsorship'}
          aria-invalid={Boolean(errors.note) || undefined}
          {...register('note')}
        />
      </FormField>
    </form>
  )
}
