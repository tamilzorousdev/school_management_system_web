import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { careApi, type LaundryDetail } from '../api-care'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'
import { LaundryItemsEditor } from './laundry-items-editor'
import { HostelSelect } from './pickers'

const FORM_ID = 'laundry-batch-form'

const schema = z
  .object({
    hostel_id: z.string().min(1, 'Choose a hostel'),
    collected_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date'),
    vendor_name: z.string().trim().max(120, 'Keep it to 120 characters'),
    notes: z.string().trim().max(255, 'Keep it to 255 characters'),
    items: z
      .array(
        z.object({
          admission_id: z.string(),
          name: z.string(),
          hint: z.string().optional(),
          items_given: z.number().int().min(1).max(100),
        })
      )
      .min(1, 'Add at least one resident')
      .max(500, 'At most 500 residents in one batch'),
  })
  .superRefine((values, ctx) => {
    if (values.collected_on > todayIso()) {
      ctx.addIssue({ code: 'custom', path: ['collected_on'], message: 'Cannot be in the future' })
    }
  })

type FormValues = z.infer<typeof schema>

export function LaundryBatchModal({
  defaultHostelId,
  onClose,
  onCreated,
}: {
  defaultHostelId?: number
  onClose: () => void
  onCreated: (batch: LaundryDetail) => void
}) {
  const create = useHostelMutation(careApi.createLaundry)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostel_id: defaultHostelId ? String(defaultHostelId) : '',
      collected_on: todayIso(),
      vendor_name: '',
      notes: '',
      items: [],
    },
  })
  const hostelId = useWatch({ control, name: 'hostel_id' })
  const items = useWatch({ control, name: 'items' })

  const submit = handleSubmit(async (values) => {
    try {
      const batch = await create.mutateAsync({
        hostel_id: Number(values.hostel_id),
        collected_on: values.collected_on,
        vendor_name: textOrNull(values.vendor_name),
        notes: textOrNull(values.notes),
        items: values.items.map((row) => ({
          admission_id: Number(row.admission_id),
          items_given: row.items_given,
        })),
      })
      alerts.success('Laundry batch created', {
        description: `${batch.batch_no} · ${batch.items_given} clothes from ${batch.students} residents`,
      })
      onCreated(batch)
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'collected_on', 'vendor_name', 'notes', 'items'],
        {
          HOSTEL_NOT_FOUND: 'hostel_id',
          HOSTEL_NOT_RESIDENT: 'items',
          HOSTEL_LAUNDRY_DUPLICATE: 'items',
        }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='New laundry batch'
      description='Count the clothes each resident hands in.'
      formId={FORM_ID}
      submitText='Create batch'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='laundry-hostel' label='Hostel' required error={errors.hostel_id?.message}>
            <Controller
              control={control}
              name='hostel_id'
              render={({ field }) => (
                <HostelSelect
                  id='laundry-hostel'
                  value={field.value || undefined}
                  invalid={Boolean(errors.hostel_id)}
                  onChange={(value) => {
                    if ((value ?? '') !== field.value) setValue('items', [])
                    field.onChange(value ?? '')
                  }}
                />
              )}
            />
          </FormField>
          <FormField
            id='laundry-collected'
            label='Collected on'
            required
            error={errors.collected_on?.message}
          >
            <Controller
              control={control}
              name='collected_on'
              render={({ field }) => (
                <DatePicker
                  id='laundry-collected'
                  value={field.value}
                  max={todayIso()}
                  clearable={false}
                  invalid={Boolean(errors.collected_on)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField
            id='laundry-vendor'
            label='Laundry'
            error={errors.vendor_name?.message}
            hint='Optional, can be set when sending'
          >
            <Input
              id='laundry-vendor'
              autoComplete='off'
              maxLength={120}
              placeholder='Sri Laundry'
              aria-invalid={Boolean(errors.vendor_name)}
              {...register('vendor_name')}
            />
          </FormField>
          <FormField id='laundry-notes' label='Notes' error={errors.notes?.message} hint='Optional'>
            <Textarea
              id='laundry-notes'
              rows={1}
              maxLength={255}
              aria-invalid={Boolean(errors.notes)}
              {...register('notes')}
            />
          </FormField>
        </div>
        <FormField
          id='laundry-resident'
          label='Clothes handed in'
          required
          error={errors.items?.message ?? errors.items?.root?.message}
        >
          {hostelId ? (
            <Controller
              control={control}
              name='items'
              render={({ field }) => (
                <LaundryItemsEditor
                  id='laundry-resident'
                  hostelId={Number(hostelId)}
                  rows={field.value}
                  invalid={Boolean(errors.items)}
                  onChange={field.onChange}
                />
              )}
            />
          ) : (
            <InfoNote>Choose the hostel first to add its residents.</InfoNote>
          )}
        </FormField>
        {items.length === 0 && hostelId && (
          <p className='text-xs text-muted-foreground'>
            Pick a resident, enter how many clothes they gave, then press Add.
          </p>
        )}
      </form>
    </AppModal>
  )
}
