import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import {
  careApi,
  type LaundryDetail,
  type LaundryReturnInput,
  type LaundrySentInput,
} from '../api-care'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'

const DATE = /^\d{4}-\d{2}-\d{2}$/

const sentSchema = z.object({
  sent_on: z.string().regex(DATE, 'Choose the date'),
  vendor_name: z.string().trim().max(120, 'Keep it to 120 characters'),
})

type SentValues = z.infer<typeof sentSchema>

export function LaundrySentModal({
  batch,
  onClose,
}: {
  batch: LaundryDetail
  onClose: () => void
}) {
  const formId = 'laundry-sent-form'
  const today = todayIso()
  const sent = useHostelMutation((input: LaundrySentInput) => careApi.laundrySent(batch.id, input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SentValues>({
    resolver: zodResolver(sentSchema),
    defaultValues: { sent_on: today, vendor_name: batch.vendor_name ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    if (values.sent_on < batch.collected_on || values.sent_on > today) {
      setError('sent_on', { message: 'Must be between the collection date and today' })
      return
    }
    try {
      await sent.mutateAsync({
        sent_on: values.sent_on,
        vendor_name: textOrNull(values.vendor_name),
      })
      alerts.success('Laundry sent', { description: batch.batch_no })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['sent_on', 'vendor_name'])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Send to the laundry'
      description={`${batch.batch_no} · ${batch.items_given} clothes from ${batch.students} residents`}
      formId={formId}
      submitText='Mark sent'
      loading={sent.isPending}
      size='sm'
    >
      <form id={formId} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='laundry-sent-on' label='Sent on' required error={errors.sent_on?.message}>
          <Controller
            control={control}
            name='sent_on'
            render={({ field }) => (
              <DatePicker
                id='laundry-sent-on'
                value={field.value}
                min={batch.collected_on}
                max={today}
                clearable={false}
                invalid={Boolean(errors.sent_on)}
                onChange={(value: string) => field.onChange(value)}
              />
            )}
          />
        </FormField>
        <FormField
          id='laundry-sent-vendor'
          label='Laundry'
          error={errors.vendor_name?.message}
          hint='Optional'
        >
          <Input
            id='laundry-sent-vendor'
            autoComplete='off'
            maxLength={120}
            placeholder='Sri Laundry'
            aria-invalid={Boolean(errors.vendor_name)}
            {...register('vendor_name')}
          />
        </FormField>
        <InfoNote>The residents and counts cannot change after the batch is sent.</InfoNote>
      </form>
    </AppModal>
  )
}

const returnSchema = z
  .object({
    returned_on: z.string().regex(DATE, 'Choose the date'),
    items: z.array(
      z.object({
        admission_id: z.number(),
        name: z.string(),
        items_given: z.number(),
        items_returned: z.number({ message: 'Enter a number' }).int('Whole numbers only').min(0),
        missing_note: z.string().trim().max(255, 'Keep it to 255 characters'),
      })
    ),
  })
  .superRefine((values, ctx) => {
    values.items.forEach((item, index) => {
      if (item.items_returned > item.items_given) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'items_returned'],
          message: `At most ${item.items_given}`,
        })
      }
    })
  })

type ReturnValues = z.infer<typeof returnSchema>

export function LaundryReturnModal({
  batch,
  onClose,
}: {
  batch: LaundryDetail
  onClose: () => void
}) {
  const formId = 'laundry-return-form'
  const today = todayIso()
  const earliest = batch.sent_on ?? batch.collected_on
  const returned = useHostelMutation((input: LaundryReturnInput) =>
    careApi.laundryReturned(batch.id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      returned_on: today,
      items: batch.items.map((item) => ({
        admission_id: item.admission_id,
        name: item.student.name,
        items_given: item.items_given,
        items_returned: item.items_given,
        missing_note: '',
      })),
    },
  })
  const rows = useWatch({ control, name: 'items' })
  const missing = rows.reduce(
    (sum, row) =>
      sum +
      (Number.isFinite(row.items_returned) ? Math.max(0, row.items_given - row.items_returned) : 0),
    0
  )

  const submit = handleSubmit(async (values) => {
    if (values.returned_on < earliest || values.returned_on > today) {
      setError('returned_on', { message: 'Must be between the send date and today' })
      return
    }
    const short = values.items.filter((item) => item.items_returned !== item.items_given)
    try {
      const saved = await returned.mutateAsync({
        returned_on: values.returned_on,
        items: short.map((item) => ({
          admission_id: item.admission_id,
          items_returned: item.items_returned,
          missing_note: textOrNull(item.missing_note),
        })),
      })
      alerts.success('Laundry returned', {
        description: saved.items_missing
          ? `${saved.batch_no} · ${saved.items_missing} clothes missing`
          : `${saved.batch_no} · everything came back`,
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['returned_on', 'items'])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Clothes returned'
      description={`${batch.batch_no}. Everyone starts with all clothes back; lower a count if something is missing.`}
      formId={formId}
      submitText='Mark returned'
      loading={returned.isPending}
      size='lg'
    >
      <form id={formId} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message ?? errors.items?.message} />
        <FormField
          id='laundry-returned-on'
          label='Returned on'
          required
          error={errors.returned_on?.message}
          className='sm:max-w-56'
        >
          <Controller
            control={control}
            name='returned_on'
            render={({ field }) => (
              <DatePicker
                id='laundry-returned-on'
                value={field.value}
                min={earliest}
                max={today}
                clearable={false}
                invalid={Boolean(errors.returned_on)}
                onChange={(value: string) => field.onChange(value)}
              />
            )}
          />
        </FormField>
        <div className='overflow-hidden rounded-lg border'>
          <ul className='divide-y'>
            {rows.map((row, index) => {
              const rowError = errors.items?.[index]
              const short =
                Number.isFinite(row.items_returned) && row.items_returned < row.items_given
              return (
                <li key={row.admission_id} className='grid gap-2 px-3 py-2.5'>
                  <div className='flex items-center gap-3'>
                    <div className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='truncate text-sm font-semibold'>{row.name}</span>
                      <span className='text-xs text-muted-foreground'>Gave {row.items_given}</span>
                    </div>
                    <label htmlFor={`return-${index}`} className='sr-only'>
                      Clothes returned to {row.name}
                    </label>
                    <Input
                      id={`return-${index}`}
                      type='number'
                      inputMode='numeric'
                      min={0}
                      max={row.items_given}
                      className={cn('w-20', short && 'border-warning')}
                      aria-invalid={Boolean(rowError?.items_returned)}
                      {...register(`items.${index}.items_returned`, { valueAsNumber: true })}
                    />
                  </div>
                  {rowError?.items_returned && (
                    <p role='alert' className='text-xs font-medium text-destructive'>
                      {rowError.items_returned.message}
                    </p>
                  )}
                  {short && (
                    <Input
                      aria-label={`What is missing for ${row.name}`}
                      maxLength={255}
                      autoComplete='off'
                      placeholder='What is missing, e.g. blue towel'
                      aria-invalid={Boolean(rowError?.missing_note)}
                      {...register(`items.${index}.missing_note`)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        <InfoNote tone={missing ? 'warning' : 'success'}>
          {missing
            ? `${missing} ${missing === 1 ? 'piece is' : 'pieces are'} marked missing. Parents see this in the app.`
            : 'Every resident got all their clothes back.'}
        </InfoNote>
      </form>
    </AppModal>
  )
}
