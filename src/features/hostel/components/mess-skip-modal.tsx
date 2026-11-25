import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { useHostelMutation } from '../api'
import { careApi, type Meal } from '../api-care'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, shiftDate, textOrNull, todayIso } from './leave-helpers'
import { MEAL_OPTIONS, mealList, SKIP_MAX_DAYS } from './mess-helpers'
import { CheckChips } from './mess-parts'
import { ResidentPicker } from './pickers'

const FORM_ID = 'mess-skip-form'
const DATE = /^\d{4}-\d{2}-\d{2}$/

const schema = z
  .object({
    admission_id: z.string().min(1, 'Choose a resident'),
    from_date: z.string().regex(DATE, 'Choose the first day'),
    to_date: z.string().regex(DATE, 'Choose the last day'),
    meals: z
      .array(z.enum(['breakfast', 'lunch', 'snacks', 'dinner']))
      .min(1, 'Pick at least one meal'),
    reason: z.string().trim().max(255, 'Keep it to 255 characters'),
  })
  .superRefine((values, ctx) => {
    if (values.from_date < todayIso()) {
      ctx.addIssue({ code: 'custom', path: ['from_date'], message: 'Cannot be before today' })
    }
    if (values.to_date < values.from_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['to_date'],
        message: 'Must be on or after the first day',
      })
    } else if (values.to_date > shiftDate(values.from_date, SKIP_MAX_DAYS)) {
      ctx.addIssue({
        code: 'custom',
        path: ['to_date'],
        message: `A skip can cover at most ${SKIP_MAX_DAYS} days after the first day`,
      })
    }
  })

type FormValues = z.infer<typeof schema>

export function MessSkipModal({ hostelId, onClose }: { hostelId?: number; onClose: () => void }) {
  const today = todayIso()
  const create = useHostelMutation(careApi.addSkip)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      admission_id: '',
      from_date: today,
      to_date: today,
      meals: [],
      reason: '',
    },
  })
  const fromDate = useWatch({ control, name: 'from_date' })

  const submit = handleSubmit(async (values) => {
    try {
      const skip = await create.mutateAsync({
        admission_id: Number(values.admission_id),
        from_date: values.from_date,
        to_date: values.to_date,
        meals: values.meals as Meal[],
        reason: textOrNull(values.reason),
      })
      alerts.success('Meal skip saved', {
        description: `${skip.student.name} · ${mealList(skip.meals)} · ${formatDate(skip.from_date)} to ${formatDate(skip.to_date)}`,
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['admission_id', 'from_date', 'to_date', 'meals', 'reason'], {
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
        HOSTEL_MEAL_SKIP_OVERLAP: 'meals',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add a meal skip'
      description='The mess cooks fewer meals for the days and meals picked.'
      formId={FORM_ID}
      submitText='Save skip'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='skip-resident'
          label='Resident'
          required
          error={errors.admission_id?.message}
        >
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                id='skip-resident'
                label='Resident'
                hostelId={hostelId}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='skip-from' label='From' required error={errors.from_date?.message}>
            <Controller
              control={control}
              name='from_date'
              render={({ field }) => (
                <DatePicker
                  id='skip-from'
                  value={field.value}
                  min={today}
                  clearable={false}
                  invalid={Boolean(errors.from_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField
            id='skip-to'
            label='To'
            required
            error={errors.to_date?.message}
            hint={`Up to ${SKIP_MAX_DAYS} days after the first day`}
          >
            <Controller
              control={control}
              name='to_date'
              render={({ field }) => (
                <DatePicker
                  id='skip-to'
                  value={field.value}
                  min={fromDate || today}
                  max={fromDate ? shiftDate(fromDate, SKIP_MAX_DAYS) : undefined}
                  clearable={false}
                  invalid={Boolean(errors.to_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='skip-meals' label='Meals' required error={errors.meals?.message}>
          <Controller
            control={control}
            name='meals'
            render={({ field }) => (
              <CheckChips
                label='Meals to skip'
                options={MEAL_OPTIONS}
                value={field.value}
                invalid={Boolean(errors.meals)}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField id='skip-reason' label='Reason' error={errors.reason?.message} hint='Optional'>
          <Textarea
            id='skip-reason'
            maxLength={255}
            placeholder='Fasting for a festival'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
        <InfoNote>
          Residents away on approved home leave are already left out of the headcount; no skip is
          needed for them.
        </InfoNote>
      </form>
    </AppModal>
  )
}
