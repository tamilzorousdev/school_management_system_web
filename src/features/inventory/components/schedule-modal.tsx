import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { inventoryApi, useInventoryMutation, type Schedule } from '../api'
import { today } from '../labels'
import { AssetPicker, VendorPicker, type PickedAsset } from './pickers'
import { mapApiError, numberOrNull } from './stock-form'
import { FormAlert } from './stock-lines'

const FORM_ID = 'schedule-form'

const schema = z.object({
  asset_id: z.string().min(1, 'Choose the asset'),
  title: z.string().trim().min(3, 'Name the service').max(120, 'Keep it under 120 characters'),
  interval_days: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3650, {
      message: 'Enter 1 to 3650 days',
    }),
  next_due_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the next due date'),
  vendor_id: z.string(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function ScheduleModal({
  open,
  onOpenChange,
  schedule,
  asset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule | null
  asset?: PickedAsset | null
}) {
  const editing = Boolean(schedule)
  const save = useInventoryMutation((values: FormValues) => {
    const input = {
      title: values.title,
      interval_days: Number(values.interval_days),
      next_due_on: values.next_due_on,
      vendor_id: numberOrNull(values.vendor_id),
      is_active: values.is_active,
    }
    return schedule
      ? inventoryApi.updateSchedule(schedule.id, input)
      : inventoryApi.createSchedule({ ...input, asset_id: Number(values.asset_id) })
  })
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit maintenance schedule' : 'Add maintenance schedule'}
      description='A preventive service that repeats every so many days.'
      formId={FORM_ID}
      submitText={editing ? 'Save' : 'Add schedule'}
      loading={save.isPending}
    >
      {open && (
        <ScheduleForm
          schedule={schedule ?? null}
          asset={asset ?? null}
          onSubmit={async (values) => {
            await save.mutateAsync(values)
            alerts.success(editing ? 'Schedule saved' : 'Schedule added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ScheduleForm({
  schedule,
  asset,
  onSubmit,
}: {
  schedule: Schedule | null
  asset: PickedAsset | null
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const fixed = schedule
    ? { tag: schedule.asset_tag, name: schedule.asset.name }
    : asset
      ? { tag: asset.asset_tag, name: asset.name }
      : null
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      asset_id: schedule ? String(schedule.asset.id) : asset ? String(asset.id) : '',
      title: schedule?.title ?? '',
      interval_days: schedule ? String(schedule.interval_days) : '180',
      next_due_on: schedule?.next_due_on ?? '',
      vendor_id: schedule?.vendor ? String(schedule.vendor.id) : '',
      is_active: schedule?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, [
        'asset_id',
        'title',
        'interval_days',
        'next_due_on',
        'vendor_id',
        'is_active',
      ])
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='schedule-asset'
          label='Asset'
          required
          error={errors.asset_id?.message}
          className='sm:col-span-2'
        >
          {fixed ? (
            <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm'>
              <span className='font-mono text-xs'>{fixed.tag}</span> · {fixed.name}
            </p>
          ) : (
            <Controller
              control={control}
              name='asset_id'
              render={({ field }) => (
                <AssetPicker
                  id='schedule-asset'
                  label='Asset'
                  value={field.value || undefined}
                  invalid={Boolean(errors.asset_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          )}
        </FormField>
        <FormField
          id='schedule-title'
          label='Service'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input
            id='schedule-title'
            autoComplete='off'
            placeholder='AC service'
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </FormField>
        <FormField
          id='schedule-interval'
          label='Every (days)'
          required
          error={errors.interval_days?.message}
        >
          <Input
            id='schedule-interval'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.interval_days)}
            {...register('interval_days')}
          />
        </FormField>
        <FormField
          id='schedule-next'
          label='Next due on'
          required
          error={errors.next_due_on?.message}
        >
          <Controller
            control={control}
            name='next_due_on'
            render={({ field }) => (
              <Input
                id='schedule-next'
                type='date'
                name={field.name}
                value={field.value}
                min={schedule ? undefined : today()}
                aria-invalid={Boolean(errors.next_due_on)}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField id='schedule-vendor' label='Vendor' error={errors.vendor_id?.message}>
          <Controller
            control={control}
            name='vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='schedule-vendor'
                label='Vendor'
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <Controller
          control={control}
          name='is_active'
          render={({ field }) => (
            <div className='flex items-center justify-between gap-4 self-end rounded-lg border bg-muted/40 px-3 py-2'>
              <label htmlFor='schedule-active' className='text-sm font-semibold'>
                Active
              </label>
              <Switch id='schedule-active' checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>
    </form>
  )
}
