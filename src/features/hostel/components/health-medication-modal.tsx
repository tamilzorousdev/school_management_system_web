import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { careApi } from '../api-care'
import { TIME_PATTERN } from './health-helpers'
import { FormAlert } from './leave-form-parts'
import { applyApiError, textOrNull, timeLabel, todayIso } from './leave-helpers'
import { ResidentPicker } from './pickers'

const FORM_ID = 'health-medication-form'
const DATE = /^\d{4}-\d{2}-\d{2}$/

const schema = z
  .object({
    admission_id: z.string().min(1, 'Choose a resident'),
    medicine: z
      .string()
      .trim()
      .min(2, 'Enter the medicine (2 characters or more)')
      .max(120, 'Keep it to 120 characters'),
    dose: z.string().trim().min(1, 'Enter the dose').max(60, 'Keep it to 60 characters'),
    times: z
      .array(z.string().regex(TIME_PATTERN))
      .min(1, 'Add at least one time')
      .max(8, 'At most 8 times a day'),
    from_date: z.string().regex(DATE, 'Choose the start date'),
    to_date: z.string(),
    instructions: z.string().trim().max(255, 'Keep it to 255 characters'),
    prescribed_by: z.string().trim().max(120, 'Keep it to 120 characters'),
  })
  .superRefine((values, ctx) => {
    if (values.to_date && values.to_date < values.from_date) {
      ctx.addIssue({ code: 'custom', path: ['to_date'], message: 'Must be on or after the start' })
    }
  })

type FormValues = z.infer<typeof schema>

export function MedicationModal({
  defaultHostelId,
  onClose,
}: {
  defaultHostelId?: number
  onClose: () => void
}) {
  const create = useHostelMutation(careApi.addMedication)
  const [nextTime, setNextTime] = useState('08:00')
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      admission_id: '',
      medicine: '',
      dose: '',
      times: [],
      from_date: todayIso(),
      to_date: '',
      instructions: '',
      prescribed_by: '',
    },
  })
  const times = useWatch({ control, name: 'times' })
  const fromDate = useWatch({ control, name: 'from_date' })

  const addTime = () => {
    if (!TIME_PATTERN.test(nextTime)) {
      setError('times', { message: 'Pick a time first' })
      return
    }
    if (times.includes(nextTime)) {
      setError('times', { message: `${timeLabel(nextTime)} is already added` })
      return
    }
    if (times.length >= 8) {
      setError('times', { message: 'At most 8 times a day' })
      return
    }
    setValue('times', [...times, nextTime].sort(), { shouldDirty: true })
    clearErrors('times')
  }

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await create.mutateAsync({
        admission_id: Number(values.admission_id),
        medicine: values.medicine.trim(),
        dose: values.dose.trim(),
        times: values.times,
        from_date: values.from_date,
        to_date: values.to_date || null,
        instructions: textOrNull(values.instructions),
        prescribed_by: textOrNull(values.prescribed_by),
      })
      alerts.success('Medication added', {
        description: `${saved.student.name} · ${saved.medicine}`,
      })
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        [
          'admission_id',
          'medicine',
          'dose',
          'times',
          'from_date',
          'to_date',
          'instructions',
          'prescribed_by',
        ],
        { HOSTEL_ADMISSION_NOT_FOUND: 'admission_id', HOSTEL_ADMISSION_CLOSED: 'admission_id' }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add medication'
      description='A course the hostel gives a resident at set times each day.'
      formId={FORM_ID}
      submitText='Add medication'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='med-resident' label='Resident' required error={errors.admission_id?.message}>
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                id='med-resident'
                label='Resident'
                hostelId={defaultHostelId}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='med-medicine' label='Medicine' required error={errors.medicine?.message}>
            <Input
              id='med-medicine'
              autoComplete='off'
              maxLength={120}
              placeholder='Amoxicillin 250 mg'
              aria-invalid={Boolean(errors.medicine)}
              {...register('medicine')}
            />
          </FormField>
          <FormField id='med-dose' label='Dose' required error={errors.dose?.message}>
            <Input
              id='med-dose'
              autoComplete='off'
              maxLength={60}
              placeholder='1 tablet'
              aria-invalid={Boolean(errors.dose)}
              {...register('dose')}
            />
          </FormField>
        </div>
        <FormField
          id='med-time'
          label='Times each day'
          required
          error={errors.times?.message}
          hint='Add every time the dose is given'
        >
          <div className='grid gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <TimePicker
                id='med-time'
                value={nextTime}
                clearable={false}
                className='w-40'
                invalid={Boolean(errors.times)}
                onChange={setNextTime}
              />
              <Button type='button' variant='outline' size='sm' onClick={addTime}>
                <Plus />
                Add time
              </Button>
            </div>
            {times.length > 0 && (
              <div className='flex flex-wrap gap-1.5'>
                {times.map((time) => (
                  <span
                    key={time}
                    className='inline-flex h-7 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 pr-1 pl-3 text-xs font-semibold text-primary'
                  >
                    {timeLabel(time)}
                    <button
                      type='button'
                      aria-label={`Remove ${timeLabel(time)}`}
                      className='grid size-5 place-items-center rounded-full hover:bg-primary/20'
                      onClick={() =>
                        setValue(
                          'times',
                          times.filter((item) => item !== time),
                          { shouldDirty: true }
                        )
                      }
                    >
                      <X className='size-3' />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='med-from' label='From' required error={errors.from_date?.message}>
            <Controller
              control={control}
              name='from_date'
              render={({ field }) => (
                <DatePicker
                  id='med-from'
                  value={field.value}
                  clearable={false}
                  invalid={Boolean(errors.from_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField
            id='med-to'
            label='Until'
            error={errors.to_date?.message}
            hint='Leave empty for an ongoing course'
          >
            <Controller
              control={control}
              name='to_date'
              render={({ field }) => (
                <DatePicker
                  id='med-to'
                  value={field.value}
                  min={fromDate || undefined}
                  invalid={Boolean(errors.to_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='med-instructions'
            label='Instructions'
            error={errors.instructions?.message}
            hint='Optional'
          >
            <Textarea
              id='med-instructions'
              maxLength={255}
              placeholder='After food'
              aria-invalid={Boolean(errors.instructions)}
              {...register('instructions')}
            />
          </FormField>
          <FormField
            id='med-prescribed'
            label='Prescribed by'
            error={errors.prescribed_by?.message}
            hint='Optional'
          >
            <Input
              id='med-prescribed'
              autoComplete='off'
              maxLength={120}
              placeholder='Dr. Priya'
              aria-invalid={Boolean(errors.prescribed_by)}
              {...register('prescribed_by')}
            />
          </FormField>
        </div>
      </form>
    </AppModal>
  )
}
