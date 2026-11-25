import { Controller, useForm, useWatch, type UseFormSetError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useHostelMutation } from '../api'
import { dutyApi, useDutyShifts, type RosterEntryInput } from '../api-duty'
import { datesBetween, shiftTime, weekdayOf } from './duty-helpers'
import { WeekdayPicker } from './duty-weekday-picker'
import { FormAlert, InfoNote } from './leave-form-parts'
import { textOrNull, todayIso } from './leave-helpers'
import { BlockSelect, HostelSelect, StaffPicker } from './pickers'

const FORM_ID = 'duty-roster-form'
const MAX_ENTRIES = 200

const staffSchema = z.object({ value: z.string(), label: z.string() })

const schema = z
  .object({
    hostel_id: z.string().min(1, 'Choose a hostel'),
    block_id: z.string(),
    mode: z.enum(['single', 'range']),
    date: z.string(),
    from: z.string(),
    to: z.string(),
    days: z.array(z.number()),
    shift_id: z.string().min(1, 'Choose a shift'),
    staff: z.array(staffSchema).min(1, 'Choose at least one staff member'),
    note: z.string().trim().max(255, 'Keep it to 255 characters'),
  })
  .superRefine((values, ctx) => {
    const today = todayIso()
    if (values.mode === 'single') {
      if (!values.date) ctx.addIssue({ code: 'custom', path: ['date'], message: 'Choose a date' })
      else if (values.date < today)
        ctx.addIssue({ code: 'custom', path: ['date'], message: 'Cannot be in the past' })
      return
    }
    if (!values.from) ctx.addIssue({ code: 'custom', path: ['from'], message: 'Choose a date' })
    else if (values.from < today)
      ctx.addIssue({ code: 'custom', path: ['from'], message: 'Cannot be in the past' })
    if (!values.to) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Choose a date' })
    else if (values.from && values.to < values.from)
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Must be on or after the start' })
    if (!values.days.length)
      ctx.addIssue({ code: 'custom', path: ['days'], message: 'Pick at least one weekday' })
    else if (values.from && values.to && values.to >= values.from && !dutyDates(values).length)
      ctx.addIssue({ code: 'custom', path: ['days'], message: 'No dates match these weekdays' })
    if (dutyDates(values).length * values.staff.length > MAX_ENTRIES)
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: `Up to ${MAX_ENTRIES} duties at a time. Pick a shorter range or fewer people.`,
      })
  })

type FormValues = z.infer<typeof schema>
type FieldName = 'hostel_id' | 'block_id' | 'date' | 'from' | 'to' | 'shift_id' | 'staff' | 'note'

function dutyDates(values: Pick<FormValues, 'mode' | 'date' | 'from' | 'to' | 'days'>) {
  if (values.mode === 'single') return values.date ? [values.date] : []
  if (!values.from || !values.to || values.to < values.from) return []
  return datesBetween(values.from, values.to).filter((day) => values.days.includes(weekdayOf(day)))
}

const MODE_OPTIONS: { value: FormValues['mode']; label: string }[] = [
  { value: 'single', label: 'One day' },
  { value: 'range', label: 'Several days' },
]

const CODE_FIELDS: Record<string, FieldName> = {
  HOSTEL_NOT_FOUND: 'hostel_id',
  HOSTEL_BLOCK_NOT_FOUND: 'block_id',
  HOSTEL_SHIFT_NOT_FOUND: 'shift_id',
  HOSTEL_SHIFT_INACTIVE: 'shift_id',
}

function showError(
  error: unknown,
  mode: FormValues['mode'],
  setError: UseFormSetError<FormValues>
) {
  const apiError = toApiError(error)
  const target = CODE_FIELDS[apiError.code]
  if (target) {
    setError(target, { message: apiError.message }, { shouldFocus: true })
    return
  }
  let mapped = false
  apiError.fieldErrors.forEach((fieldError) => {
    const name = fieldError.field.split('.').pop() ?? fieldError.field
    const field: FieldName | undefined =
      name === 'duty_date'
        ? mode === 'single'
          ? 'date'
          : 'from'
        : name === 'user_id' || name === 'entries'
          ? 'staff'
          : (['hostel_id', 'block_id', 'shift_id', 'note'] as FieldName[]).find(
              (item) => item === name
            )
    if (field) {
      setError(field, { message: fieldError.message })
      mapped = true
    }
  })
  if (!mapped) setError('root', { message: apiError.message })
}

export function AddDutiesModal({
  hostelId,
  defaultDate,
  onClose,
}: {
  hostelId?: number
  defaultDate: string
  onClose: () => void
}) {
  const today = todayIso()
  const shifts = useDutyShifts(true)
  const add = useHostelMutation((entries: RosterEntryInput[]) => dutyApi.addRoster(entries))
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
      hostel_id: hostelId ? String(hostelId) : '',
      block_id: '',
      mode: 'single',
      date: defaultDate,
      from: defaultDate,
      to: '',
      days: [1, 2, 3, 4, 5, 6, 0],
      shift_id: '',
      staff: [],
      note: '',
    },
  })
  const [mode, date, from, to, days, staff, chosenHostel] = useWatch({
    control,
    name: ['mode', 'date', 'from', 'to', 'days', 'staff', 'hostel_id'],
  })
  const count = dutyDates({ mode, date, from, to, days }).length * staff.length

  const shiftOptions = (shifts.data ?? []).map((shift) => ({
    value: String(shift.id),
    label: shift.name,
    hint: shiftTime(shift.start_time, shift.end_time),
  }))

  const submit = handleSubmit(async (values) => {
    const entries = dutyDates(values).flatMap((day) =>
      values.staff.map((person) => ({
        hostel_id: Number(values.hostel_id),
        block_id: values.block_id ? Number(values.block_id) : null,
        duty_date: day,
        shift_id: Number(values.shift_id),
        user_id: Number(person.value),
        note: textOrNull(values.note),
      }))
    )
    try {
      const saved = await add.mutateAsync(entries)
      alerts.success(`${saved.length} ${saved.length === 1 ? 'duty' : 'duties'} added`, {
        description: 'Each person gets a duty message.',
      })
      onClose()
    } catch (error) {
      showError(error, values.mode, setError)
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add duties'
      description='Put one or more staff members on a shift for a day or a range of days.'
      formId={FORM_ID}
      submitText={count > 0 ? `Add ${count} ${count === 1 ? 'duty' : 'duties'}` : 'Add duties'}
      loading={add.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='roster-hostel' label='Hostel' required error={errors.hostel_id?.message}>
            <Controller
              control={control}
              name='hostel_id'
              render={({ field }) => (
                <HostelSelect
                  id='roster-hostel'
                  value={field.value || undefined}
                  invalid={Boolean(errors.hostel_id)}
                  onChange={(value) => {
                    field.onChange(value ?? '')
                    setValue('block_id', '')
                  }}
                />
              )}
            />
          </FormField>
          <FormField
            id='roster-block'
            label='Block'
            error={errors.block_id?.message}
            hint='Optional. Leave empty for the whole hostel.'
          >
            <Controller
              control={control}
              name='block_id'
              render={({ field }) => (
                <BlockSelect
                  id='roster-block'
                  hostelId={chosenHostel ? Number(chosenHostel) : undefined}
                  allLabel='Whole hostel'
                  className='sm:w-full'
                  value={field.value || undefined}
                  invalid={Boolean(errors.block_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
        </div>

        <div className='grid gap-2'>
          <span className='text-xs font-semibold'>Days</span>
          <Controller
            control={control}
            name='mode'
            render={({ field }) => (
              <SegmentedControl
                label='Days'
                value={field.value}
                options={MODE_OPTIONS}
                onChange={field.onChange}
                className='self-start'
              />
            )}
          />
        </div>

        {mode === 'single' ? (
          <FormField id='roster-date' label='Date' required error={errors.date?.message}>
            <Controller
              control={control}
              name='date'
              render={({ field }) => (
                <DatePicker
                  id='roster-date'
                  value={field.value}
                  min={today}
                  invalid={Boolean(errors.date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField id='roster-from' label='From' required error={errors.from?.message}>
                <Controller
                  control={control}
                  name='from'
                  render={({ field }) => (
                    <DatePicker
                      id='roster-from'
                      value={field.value}
                      min={today}
                      invalid={Boolean(errors.from)}
                      onChange={(value: string) => field.onChange(value)}
                    />
                  )}
                />
              </FormField>
              <FormField id='roster-to' label='To' required error={errors.to?.message}>
                <Controller
                  control={control}
                  name='to'
                  render={({ field }) => (
                    <DatePicker
                      id='roster-to'
                      value={field.value}
                      min={from || today}
                      invalid={Boolean(errors.to)}
                      onChange={(value: string) => field.onChange(value)}
                    />
                  )}
                />
              </FormField>
            </div>
            <FormField id='roster-days' label='On these weekdays' error={errors.days?.message}>
              <Controller
                control={control}
                name='days'
                render={({ field }) => (
                  <WeekdayPicker
                    id='roster-days'
                    value={field.value}
                    invalid={Boolean(errors.days)}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </>
        )}

        <FormField
          id='roster-shift'
          label='Shift'
          required
          error={errors.shift_id?.message}
          hint={
            shifts.data && shifts.data.length === 0
              ? 'Add a shift in the Shifts tab first'
              : undefined
          }
        >
          <Controller
            control={control}
            name='shift_id'
            render={({ field }) => (
              <Combobox
                id='roster-shift'
                label='Shift'
                value={field.value || undefined}
                placeholder='Choose shift'
                options={shiftOptions}
                emptyText={shifts.isPending ? 'Loading…' : 'No active shifts'}
                invalid={Boolean(errors.shift_id)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>

        <FormField
          id='roster-staff'
          label='Staff'
          required
          error={errors.staff?.message}
          hint='Pick one or more people. Each gets the same shift on every date.'
        >
          <Controller
            control={control}
            name='staff'
            render={({ field }) => (
              <div className='grid gap-2'>
                <StaffPicker
                  id='roster-staff'
                  label='Staff member'
                  placeholder='Add a staff member'
                  invalid={Boolean(errors.staff)}
                  onChange={(value, option) => {
                    if (!value || field.value.some((item) => item.value === value)) return
                    field.onChange([...field.value, { value, label: option?.label ?? value }])
                  }}
                />
                {field.value.length > 0 && (
                  <div className='flex flex-wrap gap-1.5'>
                    {field.value.map((person) => (
                      <Badge key={person.value} tone='info' className='max-w-full gap-1 pr-1'>
                        <span className='truncate'>{person.label}</span>
                        <button
                          type='button'
                          aria-label={`Remove ${person.label}`}
                          onClick={() =>
                            field.onChange(
                              field.value.filter((item) => item.value !== person.value)
                            )
                          }
                          className='grid size-4 place-items-center rounded-full hover:bg-info/20'
                        >
                          <X className='size-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        </FormField>

        <FormField id='roster-note' label='Note' error={errors.note?.message} hint='Optional'>
          <Input
            id='roster-note'
            autoComplete='off'
            maxLength={255}
            placeholder='Cover the main gate till 22:00'
            aria-invalid={Boolean(errors.note)}
            {...register('note')}
          />
        </FormField>

        <InfoNote>
          A person cannot be on the same shift twice on a day. Everyone added gets a duty message in
          the Staff app.
        </InfoNote>
      </form>
    </AppModal>
  )
}
