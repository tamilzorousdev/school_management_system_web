import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { useHostelMutation } from '../api'
import { careApi } from '../api-care'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'
import { MEAL, MEAL_OPTIONS } from './mess-helpers'
import { HostelSelect } from './pickers'

const FORM_ID = 'mess-override-form'

const schema = z.object({
  hostel_id: z.string(),
  menu_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date'),
  meal: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']),
  items: z.string().trim().min(1, 'Enter what is served').max(500, 'Keep it to 500 characters'),
  non_veg_items: z.string().trim().max(300, 'Keep it to 300 characters'),
  note: z.string().trim().max(255, 'Keep it to 255 characters'),
})

type FormValues = z.infer<typeof schema>

export function MessOverrideModal({
  defaultHostelId,
  onClose,
}: {
  defaultHostelId?: number
  onClose: () => void
}) {
  const today = todayIso()
  const create = useHostelMutation(careApi.addOverride)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostel_id: defaultHostelId ? String(defaultHostelId) : '',
      menu_date: today,
      meal: 'lunch',
      items: '',
      non_veg_items: '',
      note: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    if (values.menu_date < today) {
      setError('menu_date', { message: 'Cannot be before today' }, { shouldFocus: true })
      return
    }
    try {
      const saved = await create.mutateAsync({
        hostel_id: values.hostel_id ? Number(values.hostel_id) : undefined,
        menu_date: values.menu_date,
        meal: values.meal,
        items: values.items.trim(),
        non_veg_items: textOrNull(values.non_veg_items),
        note: textOrNull(values.note),
      })
      alerts.success('Menu change saved', {
        description: `${MEAL[saved.meal]} on ${formatDate(saved.menu_date)}`,
      })
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'menu_date', 'meal', 'items', 'non_veg_items', 'note'],
        { HOSTEL_NOT_FOUND: 'hostel_id' }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Special menu for a date'
      description='Replaces the weekly menu for one meal on one date.'
      formId={FORM_ID}
      submitText='Save menu change'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='override-date' label='Date' required error={errors.menu_date?.message}>
            <Controller
              control={control}
              name='menu_date'
              render={({ field }) => (
                <DatePicker
                  id='override-date'
                  value={field.value}
                  min={today}
                  clearable={false}
                  invalid={Boolean(errors.menu_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField
            id='override-hostel'
            label='Hostel'
            error={errors.hostel_id?.message}
            hint='All hostels unless you pick one'
          >
            <Controller
              control={control}
              name='hostel_id'
              render={({ field }) => (
                <HostelSelect
                  id='override-hostel'
                  allLabel='All hostels'
                  className='sm:w-full'
                  value={field.value || undefined}
                  invalid={Boolean(errors.hostel_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
        </div>
        <div className='grid gap-2'>
          <span className='text-xs font-semibold'>Meal</span>
          <Controller
            control={control}
            name='meal'
            render={({ field }) => (
              <SegmentedControl
                label='Meal'
                value={field.value}
                options={MEAL_OPTIONS}
                onChange={field.onChange}
                className='self-start'
              />
            )}
          />
        </div>
        <FormField id='override-items' label='Items' required error={errors.items?.message}>
          <Textarea
            id='override-items'
            maxLength={500}
            placeholder='Veg biryani, raita, payasam'
            aria-invalid={Boolean(errors.items)}
            {...register('items')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='override-nonveg'
            label='Non-veg items'
            error={errors.non_veg_items?.message}
            hint='Optional'
          >
            <Input
              id='override-nonveg'
              maxLength={300}
              autoComplete='off'
              aria-invalid={Boolean(errors.non_veg_items)}
              {...register('non_veg_items')}
            />
          </FormField>
          <FormField id='override-note' label='Note' error={errors.note?.message} hint='Optional'>
            <Input
              id='override-note'
              maxLength={255}
              autoComplete='off'
              placeholder='Independence Day special'
              aria-invalid={Boolean(errors.note)}
              {...register('note')}
            />
          </FormField>
        </div>
        <InfoNote>
          Saving again for the same date and meal replaces the earlier change. Parents see this menu
          in the app.
        </InfoNote>
      </form>
    </AppModal>
  )
}
