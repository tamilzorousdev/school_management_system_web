import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useVendorOptions,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
  type PaymentMode,
} from '../api'
import {
  DOCUMENT_CATEGORIES,
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_MODE_OPTIONS,
} from '../labels'
import { applyFieldErrors } from '../helpers'
import { FileField, FormAlert, MAINTENANCE_INPUT_CLASS, type AttachedFile } from './shared'

const FORM_ID = 'expense-form'

const schema = z.object({
  vehicle_id: z.string().min(1, 'Choose the bus'),
  spent_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date')
    .refine((value) => value <= today(), 'The date cannot be in the future'),
  category: z.string().min(1, 'Choose what it was for'),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter the amount, from ₹1 to ₹10,00,000')
    .refine((value) => {
      const number = Number(value)
      return Number.isFinite(number) && number >= 1 && number <= 1_000_000
    }, 'Enter the amount, from ₹1 to ₹10,00,000'),
  vendor_id: z.string(),
  paid_to: z.string().trim().max(100, 'Paid to must be 100 characters or less'),
  payment_mode: z.string().min(1, 'Choose how it was paid'),
  renewed_until: z.string(),
  note: z.string().trim().max(500, 'Note must be 500 characters or less'),
  reason: z.string().trim().max(300, 'Reason must be 300 characters or less'),
})

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'vehicle_id',
  'spent_on',
  'category',
  'amount',
  'vendor_id',
  'paid_to',
  'payment_mode',
  'renewed_until',
  'note',
  'reason',
]

interface ExpenseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  defaultVehicleId?: number
}

export function ExpenseFormModal({
  open,
  onOpenChange,
  expense,
  defaultVehicleId,
}: ExpenseFormModalProps) {
  const save = useMaintenanceMutation((input: ExpenseInput) =>
    expense ? maintenanceApi.updateExpense(expense.id, input) : maintenanceApi.createExpense(input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? 'Edit expense' : 'Add expense'}
      description='Tyres, insurance and other renewals, fines, tolls and anything else spent on a bus.'
      formId={FORM_ID}
      submitText={expense ? 'Save changes' : 'Add expense'}
      loading={save.isPending || uploading}
      size='lg'
    >
      {open && (
        <ExpenseForm
          key={expense?.id ?? 'new'}
          expense={expense}
          defaultVehicleId={defaultVehicleId}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(expense ? 'Expense updated' : 'Expense added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ExpenseForm({
  expense,
  defaultVehicleId,
  onUploadingChange,
  onSubmit,
}: {
  expense: Expense | null
  defaultVehicleId?: number
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: ExpenseInput) => Promise<void>
}) {
  const busOptions = useBusOptions()
  const vendorOptions = useVendorOptions()
  const saved = expense?.vendor
  if (saved && !vendorOptions.some((option) => option.value === String(saved.id)))
    vendorOptions.unshift({ value: String(saved.id), label: saved.name, hint: undefined })
  const [bill, setBill] = useState<AttachedFile | null>(expense?.bill_file ?? null)
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
      vehicle_id: String(expense?.vehicle.id ?? defaultVehicleId ?? ''),
      spent_on: expense?.spent_on ?? today(),
      category: expense?.category ?? '',
      amount: expense?.amount.toString() ?? '',
      vendor_id: saved ? String(saved.id) : '',
      paid_to: expense?.paid_to ?? '',
      payment_mode: expense?.payment_mode ?? 'cash',
      renewed_until: expense?.renewed_until ?? '',
      note: expense?.note ?? '',
      reason: '',
    },
  })

  const category = useWatch({ control, name: 'category' }) as ExpenseCategory | ''
  const vendorId = useWatch({ control, name: 'vendor_id' })
  const isDocument = Boolean(category) && DOCUMENT_CATEGORIES.includes(category as ExpenseCategory)

  const submit = handleSubmit(async (values) => {
    const clear = expense ? null : undefined
    const input: ExpenseInput = {
      spent_on: values.spent_on,
      category: values.category as ExpenseCategory,
      amount: Number(values.amount),
      vendor_id: values.vendor_id ? Number(values.vendor_id) : clear,
      paid_to: values.vendor_id ? clear : values.paid_to || clear,
      payment_mode: values.payment_mode as PaymentMode,
      bill_file_id: bill ? bill.id : clear,
      note: values.note || clear,
    }
    if (!expense) {
      input.vehicle_id = Number(values.vehicle_id)
      if (isDocument && values.renewed_until) input.renewed_until = values.renewed_until
    } else if (values.reason) input.reason = values.reason
    try {
      await onSubmit(input)
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        bill_file_id: setBillError,
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='expense-bus' label='Bus' required error={errors.vehicle_id?.message}>
        <Controller
          control={control}
          name='vehicle_id'
          render={({ field }) =>
            expense ? (
              <Input
                id='expense-bus'
                value={`${expense.vehicle.registration_no} · ${expense.vehicle.name}`}
                disabled
                readOnly
              />
            ) : (
              <Combobox
                id='expense-bus'
                label='Bus'
                value={field.value || undefined}
                options={busOptions}
                placeholder='Choose a bus'
                searchPlaceholder='Search buses'
                emptyText='No buses yet'
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.vehicle_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )
          }
        />
      </FormField>
      <FormField id='expense-date' label='Date' required error={errors.spent_on?.message}>
        <Controller
          control={control}
          name='spent_on'
          render={({ field }) => (
            <DatePicker
              id='expense-date'
              max={today()}
              className={MAINTENANCE_INPUT_CLASS}
              invalid={Boolean(errors.spent_on)}
              required
              value={field.value}
              onChange={(value: string) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField id='expense-category' label='For' required error={errors.category?.message}>
        <Controller
          control={control}
          name='category'
          render={({ field }) => (
            <Combobox
              id='expense-category'
              label='For'
              value={field.value || undefined}
              options={EXPENSE_CATEGORY_OPTIONS}
              placeholder='Choose what it was for'
              searchPlaceholder='Search categories'
              highlightSelected={false}
              className={MAINTENANCE_INPUT_CLASS}
              invalid={Boolean(errors.category)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='expense-amount' label='Amount (₹)' required error={errors.amount?.message}>
        <Input
          id='expense-amount'
          type='number'
          inputMode='decimal'
          min={1}
          max={1_000_000}
          step='0.01'
          placeholder='38500'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.amount) || undefined}
          {...register('amount')}
        />
      </FormField>
      {isDocument && !expense && (
        <FormField
          id='expense-renewed'
          label={`New ${EXPENSE_CATEGORY[category as ExpenseCategory].toLowerCase()} expiry`}
          error={errors.renewed_until?.message}
          hint='Also updates this expiry date in Vehicle Master'
          className='sm:col-span-2'
        >
          <Controller
            control={control}
            name='renewed_until'
            render={({ field }) => (
              <DatePicker
                id='expense-renewed'
                min={today()}
                invalid={Boolean(errors.renewed_until)}
                value={field.value}
                onChange={(value: string) => field.onChange(value)}
              />
            )}
          />
        </FormField>
      )}
      {expense?.renewed_until && (
        <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm sm:col-span-2'>
          This renewal set the expiry in Vehicle Master. Change the date there if it is wrong.
        </p>
      )}
      <FormField id='expense-vendor' label='Vendor' error={errors.vendor_id?.message}>
        <Controller
          control={control}
          name='vendor_id'
          render={({ field }) => (
            <Combobox
              id='expense-vendor'
              label='Vendor'
              value={field.value || undefined}
              options={vendorOptions}
              allLabel='Not a saved vendor'
              placeholder='Not a saved vendor'
              searchPlaceholder='Search vendors'
              emptyText='No saved vendors yet'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      {!vendorId && (
        <FormField id='expense-paid-to' label='Paid to' error={errors.paid_to?.message}>
          <Input
            id='expense-paid-to'
            maxLength={100}
            placeholder='New India Assurance'
            className={MAINTENANCE_INPUT_CLASS}
            aria-invalid={Boolean(errors.paid_to) || undefined}
            {...register('paid_to')}
          />
        </FormField>
      )}
      <FormField id='expense-payment' label='Paid by' required error={errors.payment_mode?.message}>
        <Controller
          control={control}
          name='payment_mode'
          render={({ field }) => (
            <Combobox
              id='expense-payment'
              label='Paid by'
              value={field.value || undefined}
              options={PAYMENT_MODE_OPTIONS}
              placeholder='Choose how it was paid'
              searchPlaceholder='Search payment modes'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.payment_mode)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FileField
        id='expense-bill'
        label='Bill'
        purpose='expense_bill'
        file={bill}
        onChange={setBill}
        onUploadingChange={onUploadingChange}
        error={billError}
        onError={setBillError}
      />
      <FormField
        id='expense-note'
        label='Note'
        error={errors.note?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='expense-note'
          rows={2}
          maxLength={500}
          placeholder='Yearly policy'
          aria-invalid={Boolean(errors.note) || undefined}
          {...register('note')}
        />
      </FormField>
      {expense && (
        <FormField
          id='expense-reason'
          label='Reason for the change'
          error={errors.reason?.message}
          hint='Kept in the change history'
          className='sm:col-span-2'
        >
          <Input
            id='expense-reason'
            maxLength={300}
            placeholder='Bill amount corrected'
            aria-invalid={Boolean(errors.reason) || undefined}
            {...register('reason')}
          />
        </FormField>
      )}
    </form>
  )
}
