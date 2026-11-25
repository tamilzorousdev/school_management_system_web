import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation, useHostels } from '../api'
import { studyApi, useStudyHalls, type StudySchedule, type StudyScheduleInput } from '../api-duty'
import { WeekdayPicker } from './duty-weekday-picker'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError } from './leave-helpers'
import { BlockSelect, HostelSelect, StaffPicker } from './pickers'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const FORM_ID = 'study-schedule-form'

const schema = z
  .object({
    hostel_id: z.string().min(1, 'Choose a hostel'),
    block_id: z.string(),
    hall_id: z.string(),
    name: z.string().trim().min(1, 'Enter a name').max(60, 'Keep it to 60 characters'),
    days: z.array(z.number()).min(1, 'Pick at least one day'),
    start_time: z.string().regex(TIME, 'Choose a start time'),
    end_time: z.string().regex(TIME, 'Choose an end time'),
    supervisor_user_id: z.string(),
    active: z.boolean(),
  })
  .refine(
    (values) =>
      !TIME.test(values.start_time) ||
      !TIME.test(values.end_time) ||
      values.end_time > values.start_time,
    { path: ['end_time'], message: 'Must be after the start time' }
  )

type FormValues = z.infer<typeof schema>

const FIELDS = [
  'hostel_id',
  'block_id',
  'hall_id',
  'name',
  'days',
  'start_time',
  'end_time',
  'supervisor_user_id',
  'active',
] as const

export function StudyScheduleModal({
  schedule,
  hostelId,
  hallOn,
  onClose,
}: {
  schedule: StudySchedule | null
  hostelId?: number
  hallOn: boolean
  onClose: () => void
}) {
  const hostels = useHostels()
  const fallback = hostelId ?? (hostels.data?.length === 1 ? hostels.data[0].id : undefined)
  const save = useHostelMutation((input: StudyScheduleInput) => {
    if (!schedule) return studyApi.createSchedule(input)
    const { hostel_id: _hostel, ...patch } = input
    return studyApi.updateSchedule(schedule.id, hallOn ? patch : { ...patch, hall_id: undefined })
  })
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
      hostel_id: schedule ? String(schedule.hostel_id) : fallback ? String(fallback) : '',
      block_id: schedule?.block_id ? String(schedule.block_id) : '',
      hall_id: schedule?.hall_id ? String(schedule.hall_id) : '',
      name: schedule?.name ?? '',
      days: schedule?.days.map(Number) ?? [1, 2, 3, 4, 5],
      start_time: schedule?.start_time.slice(0, 5) ?? '',
      end_time: schedule?.end_time.slice(0, 5) ?? '',
      supervisor_user_id: schedule?.supervisor_user_id ? String(schedule.supervisor_user_id) : '',
      active: schedule?.active ?? true,
    },
  })
  const chosenHostel = useWatch({ control, name: 'hostel_id' })
  const hostelNumber = chosenHostel ? Number(chosenHostel) : undefined
  const halls = useStudyHalls(hostelNumber, hallOn && Boolean(hostelNumber))
  const hallOptions = (halls.data ?? [])
    .filter((hall) => hall.hostel_id === hostelNumber)
    .map((hall) => ({
      value: String(hall.id),
      label: hall.name,
      hint: `${hall.seats_taken}/${hall.seats_active} seats taken${hall.status === 'closed' ? ' · Closed' : ''}`,
    }))

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        hostel_id: Number(values.hostel_id),
        block_id: values.block_id ? Number(values.block_id) : null,
        hall_id: values.hall_id ? Number(values.hall_id) : null,
        name: values.name,
        days: [...values.days].sort((a, b) => a - b),
        start_time: values.start_time,
        end_time: values.end_time,
        supervisor_user_id: values.supervisor_user_id ? Number(values.supervisor_user_id) : null,
        active: values.active,
      })
      alerts.success(schedule ? 'Study schedule updated' : 'Study schedule added', {
        description: saved.name,
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, FIELDS, {
        HOSTEL_NOT_FOUND: 'hostel_id',
        HOSTEL_BLOCK_NOT_FOUND: 'block_id',
        HOSTEL_STUDY_HALL_NOT_FOUND: 'hall_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={schedule ? 'Edit study schedule' : 'Add study schedule'}
      description='Study hours for a whole hostel, one block or the students seated in a study hall.'
      formId={FORM_ID}
      submitText={schedule ? 'Save schedule' : 'Add schedule'}
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='schedule-name'
            label='Name'
            required
            error={errors.name?.message}
            className='sm:col-span-2'
          >
            <Input
              id='schedule-name'
              autoComplete='off'
              maxLength={60}
              placeholder='Evening prep'
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>
          <FormField
            id='schedule-hostel'
            label='Hostel'
            required
            error={errors.hostel_id?.message}
            hint={schedule ? 'The hostel of a schedule cannot be changed' : undefined}
          >
            {schedule ? (
              <Input id='schedule-hostel' value={schedule.hostel_name} disabled readOnly />
            ) : (
              <Controller
                control={control}
                name='hostel_id'
                render={({ field }) => (
                  <HostelSelect
                    id='schedule-hostel'
                    value={field.value || undefined}
                    invalid={Boolean(errors.hostel_id)}
                    onChange={(value) => {
                      field.onChange(value ?? '')
                      setValue('block_id', '')
                      setValue('hall_id', '')
                    }}
                  />
                )}
              />
            )}
          </FormField>
          <FormField
            id='schedule-block'
            label='Block'
            error={errors.block_id?.message}
            hint='Optional. Only residents of this block.'
          >
            <Controller
              control={control}
              name='block_id'
              render={({ field }) => (
                <BlockSelect
                  id='schedule-block'
                  hostelId={hostelNumber}
                  allLabel='Whole hostel'
                  className='sm:w-full'
                  value={field.value || undefined}
                  invalid={Boolean(errors.block_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          {hallOn && (
            <FormField
              id='schedule-hall'
              label='Study hall'
              error={errors.hall_id?.message}
              hint='Optional. Only students with a seat in this hall.'
            >
              <Controller
                control={control}
                name='hall_id'
                render={({ field }) => (
                  <Combobox
                    id='schedule-hall'
                    label='Study hall'
                    value={field.value || undefined}
                    options={hallOptions}
                    allLabel='No study hall'
                    placeholder='No study hall'
                    emptyText={
                      !hostelNumber
                        ? 'Choose a hostel first'
                        : halls.isPending
                          ? 'Loading…'
                          : 'No study halls in this hostel'
                    }
                    invalid={Boolean(errors.hall_id)}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
          )}
          <FormField
            id='schedule-supervisor'
            label='Supervisor'
            error={errors.supervisor_user_id?.message}
            hint='Optional'
          >
            <Controller
              control={control}
              name='supervisor_user_id'
              render={({ field }) => (
                <StaffPicker
                  id='schedule-supervisor'
                  label='Supervisor'
                  value={field.value || undefined}
                  initial={
                    schedule?.supervisor_user_id && schedule.supervisor_name
                      ? {
                          value: String(schedule.supervisor_user_id),
                          label: schedule.supervisor_name,
                        }
                      : null
                  }
                  invalid={Boolean(errors.supervisor_user_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
        </div>

        <FormField id='schedule-days' label='Days' required error={errors.days?.message}>
          <Controller
            control={control}
            name='days'
            render={({ field }) => (
              <WeekdayPicker
                id='schedule-days'
                value={field.value}
                invalid={Boolean(errors.days)}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='schedule-start' label='Starts' required error={errors.start_time?.message}>
            <Controller
              control={control}
              name='start_time'
              render={({ field }) => (
                <TimePicker
                  id='schedule-start'
                  value={field.value}
                  invalid={Boolean(errors.start_time)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
          <FormField id='schedule-end' label='Ends' required error={errors.end_time?.message}>
            <Controller
              control={control}
              name='end_time'
              render={({ field }) => (
                <TimePicker
                  id='schedule-end'
                  value={field.value}
                  invalid={Boolean(errors.end_time)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>

        <Controller
          control={control}
          name='active'
          render={({ field }) => (
            <SwitchField
              id='schedule-active'
              label='Active'
              description='Turned-off schedules do not show on the Today list and cannot be marked.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <InfoNote>
          Students away on an approved leave are suggested as excused on the study sheet.
        </InfoNote>
      </form>
    </AppModal>
  )
}
