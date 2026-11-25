import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { TimePicker } from '@/components/common/time-picker'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  type CaseInput,
  type DisciplineCase,
  type DisciplineCategory,
} from '../api'
import { DISCIPLINE_CATEGORY, labelOptions, SEVERITY, toneOptions } from '../labels'
import { FormAlert, SwitchField } from './leave-form-parts'
import { applyApiError, nowTime, textOrNull, todayIso, zonedIso } from './leave-helpers'
import { ResidentPicker } from './pickers'

const FORM_ID = 'hostel-case-form'

const schema = z.object({
  admission_id: z.string().min(1, 'Choose a resident'),
  category: z.string().min(1, 'Choose a category'),
  severity: z.enum(['minor', 'major', 'critical']),
  incident_date: z.string().min(1, 'Choose the date'),
  incident_time: z.string().min(1, 'Enter the time'),
  location: z.string().trim().max(120, 'Keep it to 120 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Describe what happened (5 characters or more)')
    .max(1000, 'Keep it to 1000 characters'),
  witnesses: z.string().trim().max(255, 'Keep it to 255 characters'),
  visible_to_parent: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function CaseFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (item: DisciplineCase) => void
}) {
  const create = useHostelMutation((input: CaseInput) => hostelApi.createCase(input))
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
      category: '',
      severity: 'minor',
      incident_date: todayIso(),
      incident_time: nowTime(),
      location: '',
      description: '',
      witnesses: '',
      visible_to_parent: true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const item = await create.mutateAsync({
        admission_id: Number(values.admission_id),
        category: values.category as DisciplineCategory,
        severity: values.severity,
        incident_at: zonedIso(values.incident_date, values.incident_time),
        location: textOrNull(values.location),
        description: values.description,
        witnesses: textOrNull(values.witnesses),
        visible_to_parent: values.visible_to_parent,
      })
      alerts.success('Case recorded', {
        description: `${item.case_no}${item.strikes >= 3 ? ` · ${item.strikes} cases this year` : ''}`,
      })
      onCreated(item)
      onClose()
    } catch (error) {
      const apiError = applyApiError(
        error,
        setError,
        ['admission_id', 'category', 'severity', 'location', 'description', 'witnesses'],
        {
          HOSTEL_ADMISSION_CLOSED: 'admission_id',
          HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
        }
      )
      if (apiError.fieldErrors.some((item) => item.field === 'incident_at')) {
        setError('incident_date', { message: 'Enter a valid date and time' })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Record a case'
      description='Late returns, misconduct, damage and other discipline matters.'
      formId={FORM_ID}
      submitText='Record case'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='case-resident'
            label='Resident'
            required
            error={errors.admission_id?.message}
          >
            <Controller
              control={control}
              name='admission_id'
              render={({ field }) => (
                <ResidentPicker
                  id='case-resident'
                  label='Resident'
                  value={field.value || undefined}
                  invalid={Boolean(errors.admission_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField id='case-category' label='Category' required error={errors.category?.message}>
            <Controller
              control={control}
              name='category'
              render={({ field }) => (
                <Combobox
                  id='case-category'
                  label='Category'
                  value={field.value || undefined}
                  placeholder='Choose category'
                  options={labelOptions(DISCIPLINE_CATEGORY)}
                  invalid={Boolean(errors.category)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField id='case-severity' label='Severity' required error={errors.severity?.message}>
            <Controller
              control={control}
              name='severity'
              render={({ field }) => (
                <SegmentedControl
                  label='Severity'
                  value={field.value}
                  options={toneOptions(SEVERITY)}
                  onChange={field.onChange}
                  className='self-start'
                />
              )}
            />
          </FormField>
          <FormField id='case-location' label='Where' error={errors.location?.message}>
            <Input
              id='case-location'
              autoComplete='off'
              placeholder='A Block, 1st floor corridor'
              aria-invalid={Boolean(errors.location)}
              {...register('location')}
            />
          </FormField>
          <FormField id='case-date' label='Date' required error={errors.incident_date?.message}>
            <Controller
              control={control}
              name='incident_date'
              render={({ field }) => (
                <DatePicker
                  id='case-date'
                  value={field.value}
                  max={todayIso()}
                  clearable={false}
                  invalid={Boolean(errors.incident_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          <FormField id='case-time' label='Time' required error={errors.incident_time?.message}>
            <Controller
              control={control}
              name='incident_time'
              render={({ field }) => (
                <TimePicker
                  id='case-time'
                  value={field.value}
                  clearable={false}
                  invalid={Boolean(errors.incident_time)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>
        <FormField
          id='case-description'
          label='What happened'
          required
          error={errors.description?.message}
        >
          <Textarea
            id='case-description'
            maxLength={1000}
            placeholder='Came back 45 minutes after the in-time without telling the warden'
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </FormField>
        <FormField id='case-witnesses' label='Witnesses' error={errors.witnesses?.message}>
          <Input
            id='case-witnesses'
            autoComplete='off'
            placeholder='Names of staff or students who saw it'
            aria-invalid={Boolean(errors.witnesses)}
            {...register('witnesses')}
          />
        </FormField>
        <Controller
          control={control}
          name='visible_to_parent'
          render={({ field }) => (
            <SwitchField
              id='case-visible'
              label='Share with parents'
              description='Parents see the case in the Parent app and get a message.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </form>
    </AppModal>
  )
}
