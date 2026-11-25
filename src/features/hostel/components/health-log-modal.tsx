import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import {
  careApi,
  type HealthKind,
  type HealthLog,
  type HealthLogInput,
  type HealthLogPatchInput,
} from '../api-care'
import { labelOptions } from '../labels'
import { HEALTH_KIND, numberOrNull } from './health-helpers'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError, nowTime, textOrNull, todayIso, zonedIso } from './leave-helpers'
import { ResidentPicker } from './pickers'

const FORM_ID = 'health-log-form'
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = z
  .object({
    editing: z.boolean(),
    admission_id: z.string(),
    kind: z.string().min(1, 'Choose what happened'),
    logged_date: z.string(),
    logged_time: z.string(),
    symptoms: z
      .string()
      .trim()
      .min(2, 'Describe the symptoms (2 characters or more)')
      .max(500, 'Keep it to 500 characters'),
    temperature: z.string().trim(),
    action_taken: z.string().trim().max(500, 'Keep it to 500 characters'),
    doctor_name: z.string().trim().max(120, 'Keep it to 120 characters'),
    hospital_visit: z.boolean(),
    sick_bay: z.boolean(),
    notify_parent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.editing && !values.admission_id) {
      ctx.addIssue({ code: 'custom', path: ['admission_id'], message: 'Choose a resident' })
    }
    if (!values.editing) {
      if (!DATE.test(values.logged_date)) {
        ctx.addIssue({ code: 'custom', path: ['logged_date'], message: 'Choose the date' })
      } else if (!TIME.test(values.logged_time)) {
        ctx.addIssue({ code: 'custom', path: ['logged_time'], message: 'Choose the time' })
      } else if (
        values.logged_date > todayIso() ||
        (values.logged_date === todayIso() && values.logged_time > nowTime())
      ) {
        ctx.addIssue({ code: 'custom', path: ['logged_time'], message: 'Cannot be in the future' })
      }
    }
    if (values.temperature) {
      const value = Number(values.temperature)
      if (!Number.isFinite(value) || value < 30 || value > 110) {
        ctx.addIssue({
          code: 'custom',
          path: ['temperature'],
          message: 'Enter a temperature between 30 and 110',
        })
      } else if (!/^\d+(\.\d)?$/.test(values.temperature)) {
        ctx.addIssue({ code: 'custom', path: ['temperature'], message: 'Use one decimal at most' })
      }
    }
  })

type FormValues = z.infer<typeof schema>

const FIELDS = [
  'admission_id',
  'kind',
  'logged_date',
  'logged_time',
  'symptoms',
  'temperature',
  'action_taken',
  'doctor_name',
  'hospital_visit',
  'sick_bay',
  'notify_parent',
] as const

export function HealthLogModal({
  log,
  defaultHostelId,
  onClose,
  onSaved,
}: {
  log?: HealthLog
  defaultHostelId?: number
  onClose: () => void
  onSaved?: (log: HealthLog) => void
}) {
  const editing = Boolean(log)
  const create = useHostelMutation((input: HealthLogInput) => careApi.createHealthLog(input))
  const patch = useHostelMutation((input: HealthLogPatchInput) =>
    careApi.patchHealthLog(log?.id ?? 0, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      editing,
      admission_id: '',
      kind: log?.kind ?? 'illness',
      logged_date: todayIso(),
      logged_time: nowTime(),
      symptoms: log?.symptoms ?? '',
      temperature:
        log?.temperature !== null && log?.temperature !== undefined ? String(log.temperature) : '',
      action_taken: log?.action_taken ?? '',
      doctor_name: log?.doctor_name ?? '',
      hospital_visit: log?.hospital_visit ?? false,
      sick_bay: false,
      notify_parent: !editing,
    },
  })

  const submit = handleSubmit(async (values) => {
    const common = {
      kind: values.kind as HealthKind,
      symptoms: values.symptoms.trim(),
      temperature: numberOrNull(values.temperature),
      action_taken: textOrNull(values.action_taken),
      doctor_name: textOrNull(values.doctor_name),
      hospital_visit: values.hospital_visit,
      notify_parent: values.notify_parent,
    }
    try {
      const saved = log
        ? await patch.mutateAsync(common)
        : await create.mutateAsync({
            ...common,
            admission_id: Number(values.admission_id),
            logged_at: zonedIso(values.logged_date, values.logged_time),
            sick_bay: values.sick_bay,
          })
      alerts.success(log ? 'Health record updated' : 'Health record saved', {
        description: values.notify_parent
          ? 'The parents are being told.'
          : `${saved.student.name} · ${HEALTH_KIND[saved.kind]}`,
      })
      onSaved?.(saved)
      onClose()
    } catch (error) {
      applyApiError(error, setError, FIELDS, {
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={log ? 'Edit health record' : 'Record health event'}
      description={
        log
          ? `${log.student.name} · ${log.hostel_name}`
          : 'An illness, an injury or a check-up of a resident.'
      }
      formId={FORM_ID}
      submitText={log ? 'Save changes' : 'Save record'}
      loading={create.isPending || patch.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          {!log && (
            <FormField
              id='health-resident'
              label='Resident'
              required
              error={errors.admission_id?.message}
            >
              <Controller
                control={control}
                name='admission_id'
                render={({ field }) => (
                  <ResidentPicker
                    id='health-resident'
                    label='Resident'
                    hostelId={defaultHostelId}
                    value={field.value || undefined}
                    invalid={Boolean(errors.admission_id)}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
          )}
          <FormField id='health-kind' label='What happened' required error={errors.kind?.message}>
            <Controller
              control={control}
              name='kind'
              render={({ field }) => (
                <Combobox
                  id='health-kind'
                  label='What happened'
                  value={field.value || undefined}
                  placeholder='Choose'
                  options={labelOptions(HEALTH_KIND)}
                  invalid={Boolean(errors.kind)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          {!log && (
            <>
              <FormField id='health-date' label='Date' required error={errors.logged_date?.message}>
                <Controller
                  control={control}
                  name='logged_date'
                  render={({ field }) => (
                    <DatePicker
                      id='health-date'
                      value={field.value}
                      max={todayIso()}
                      clearable={false}
                      invalid={Boolean(errors.logged_date)}
                      onChange={(value: string) => field.onChange(value)}
                    />
                  )}
                />
              </FormField>
              <FormField id='health-time' label='Time' required error={errors.logged_time?.message}>
                <Controller
                  control={control}
                  name='logged_time'
                  render={({ field }) => (
                    <TimePicker
                      id='health-time'
                      value={field.value}
                      clearable={false}
                      invalid={Boolean(errors.logged_time)}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormField>
            </>
          )}
        </div>
        <FormField id='health-symptoms' label='Symptoms' required error={errors.symptoms?.message}>
          <Textarea
            id='health-symptoms'
            maxLength={500}
            placeholder='Fever and headache since morning'
            aria-invalid={Boolean(errors.symptoms)}
            {...register('symptoms')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='health-temperature'
            label='Temperature'
            error={errors.temperature?.message}
            hint='Optional, as measured (for example 100.4)'
          >
            <Input
              id='health-temperature'
              inputMode='decimal'
              autoComplete='off'
              maxLength={5}
              aria-invalid={Boolean(errors.temperature)}
              {...register('temperature')}
            />
          </FormField>
          <FormField
            id='health-doctor'
            label='Doctor'
            error={errors.doctor_name?.message}
            hint='Optional'
          >
            <Input
              id='health-doctor'
              autoComplete='off'
              maxLength={120}
              placeholder='Dr. Priya'
              aria-invalid={Boolean(errors.doctor_name)}
              {...register('doctor_name')}
            />
          </FormField>
        </div>
        <FormField
          id='health-action'
          label='Action taken'
          error={errors.action_taken?.message}
          hint='Optional'
        >
          <Textarea
            id='health-action'
            maxLength={500}
            placeholder='Paracetamol 500 mg given'
            aria-invalid={Boolean(errors.action_taken)}
            {...register('action_taken')}
          />
        </FormField>
        <div className='grid gap-3'>
          <Controller
            control={control}
            name='hospital_visit'
            render={({ field }) => (
              <SwitchField
                id='health-hospital'
                label='Taken to a doctor or hospital'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          {!log && (
            <Controller
              control={control}
              name='sick_bay'
              render={({ field }) => (
                <SwitchField
                  id='health-sick-bay'
                  label='Put in the sick bay now'
                  description='The resident shows in the sick bay list until discharged.'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          )}
          <Controller
            control={control}
            name='notify_parent'
            render={({ field }) => (
              <SwitchField
                id='health-notify'
                label='Tell the parents'
                description={
                  log
                    ? 'Send the parents this update.'
                    : 'On by default for every new health record.'
                }
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <InfoNote>
          Parents get a push notification with what happened and the action taken, then an SMS if
          the push does not reach their phone.
        </InfoNote>
      </form>
    </AppModal>
  )
}
