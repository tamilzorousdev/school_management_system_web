import type { ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { TimePicker } from '@/components/common/time-picker'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { fromLocalInput, toLocalInput } from '@/features/announcements/labels'
import { today } from '@/features/attendance/labels'
import { ClassPicker } from '@/features/setup/components/class-picker'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { eventsApi, useEventAction, type EventInput, type SchoolEvent } from '../api'

const FORM_ID = 'event-form'

const schema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').max(150, 'Keep the title under 150 letters'),
    description: z.string().trim().max(4000, 'Keep it under 4000 letters'),
    event_date: z.string().min(1, 'Choose the date'),
    all_day: z.boolean(),
    start_time: z.string(),
    end_time: z.string(),
    venue: z.string().trim().max(150, 'Keep the venue under 150 letters'),
    audience: z.enum(['school', 'classes']),
    class_ids: z.array(z.number()),
    rsvp_required: z.boolean(),
    rsvp_deadline: z.string(),
    publish: z.boolean(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message })
    if (values.event_date && values.event_date < today())
      issue('event_date', 'The event date has already passed')
    if (!values.all_day) {
      if (!values.start_time) issue('start_time', 'Choose the start time, or make it all day')
      if (values.start_time && values.end_time && values.end_time <= values.start_time)
        issue('end_time', 'The end time must be after the start time')
    }
    if (values.audience === 'classes' && !values.class_ids.length)
      issue('class_ids', 'Choose at least one class')
    if (values.rsvp_required && values.rsvp_deadline && values.event_date) {
      const start = new Date(
        `${values.event_date}T${values.all_day ? '08:00' : values.start_time || '08:00'}`
      )
      if (new Date(values.rsvp_deadline) > start)
        issue('rsvp_deadline', 'The reply deadline must be before the event starts')
    }
  })

type FormValues = z.infer<typeof schema>

const FIELD_MAP: Record<string, keyof FormValues> = { section_ids: 'class_ids' }

export function EventFormModal({
  event,
  defaultDate,
  onOpenChange,
}: {
  event: SchoolEvent | null
  defaultDate?: string
  onOpenChange: (open: boolean) => void
}) {
  const published = event?.status === 'published'
  const save = useEventAction((input: EventInput) =>
    event ? eventsApi.update(event.id, input) : eventsApi.create(input)
  )
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      event_date: event?.event_date ?? defaultDate ?? '',
      all_day: event ? !event.start_time : false,
      start_time: event?.start_time ?? '',
      end_time: event?.end_time ?? '',
      venue: event?.venue ?? '',
      audience: event?.audience ?? 'school',
      class_ids: event?.classes.map((item) => item.id) ?? [],
      rsvp_required: event?.rsvp_required ?? true,
      rsvp_deadline: toLocalInput(event?.rsvp_deadline ?? null),
      publish: false,
    },
  })
  const allDay = useWatch({ control, name: 'all_day' })
  const audience = useWatch({ control, name: 'audience' })
  const rsvpRequired = useWatch({ control, name: 'rsvp_required' })
  const publish = useWatch({ control, name: 'publish' })

  const onSubmit = handleSubmit(async (values) => {
    const input: EventInput = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      event_date: values.event_date,
      start_time: values.all_day ? null : values.start_time || null,
      end_time: values.all_day ? null : values.end_time || null,
      venue: values.venue.trim() || null,
      audience: values.audience,
      class_ids: values.audience === 'classes' ? values.class_ids : [],
      section_ids: [],
      rsvp_required: values.rsvp_required,
      rsvp_deadline: values.rsvp_required ? fromLocalInput(values.rsvp_deadline) : null,
      ...(published ? {} : { publish: values.publish }),
    }
    try {
      const saved = await save.mutateAsync(input)
      alerts.success(
        published
          ? 'Event updated'
          : saved.status === 'published'
            ? `Published to ${saved.counts.invited} students' parents`
            : 'Draft saved'
      )
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      if (!apiError.fieldErrors.length) {
        setError('root', { message: apiError.message })
        return
      }
      for (const item of apiError.fieldErrors) {
        const field = FIELD_MAP[item.field] ?? item.field
        if (field in values) setError(field as keyof FormValues, { message: item.message })
        else setError('root', { message: item.message })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={event ? 'Edit event' : 'New event'}
      description={
        published
          ? 'Parents are told again if the date, time or venue changes.'
          : 'Parents see it in the app calendar and can reply for each child.'
      }
      formId={FORM_ID}
      submitText={published ? 'Save changes' : publish ? 'Publish' : 'Save draft'}
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate className='grid gap-3 sm:grid-cols-2' onSubmit={onSubmit}>
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root.message}
          </p>
        )}
        <FormField
          id='e-title'
          label='Title'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input id='e-title' maxLength={150} {...register('title')} />
        </FormField>
        <FormField
          id='e-description'
          label='Description'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea id='e-description' rows={3} maxLength={4000} {...register('description')} />
        </FormField>
        <Controller
          control={control}
          name='event_date'
          render={({ field }) => (
            <FormField id='e-date' label='Date' required error={errors.event_date?.message}>
              <DatePicker
                id='e-date'
                value={field.value}
                min={today()}
                onChange={(value: string) => field.onChange(value)}
                invalid={Boolean(errors.event_date)}
              />
            </FormField>
          )}
        />
        <FormField id='e-venue' label='Venue' error={errors.venue?.message}>
          <Input id='e-venue' maxLength={150} placeholder='School ground' {...register('venue')} />
        </FormField>
        <Controller
          control={control}
          name='all_day'
          render={({ field }) => (
            <SwitchRow title='All day' hint='No start or end time' className='sm:col-span-2'>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label='All day' />
            </SwitchRow>
          )}
        />
        {!allDay && (
          <>
            <Controller
              control={control}
              name='start_time'
              render={({ field }) => (
                <FormField id='e-start' label='Starts' required error={errors.start_time?.message}>
                  <TimePicker
                    id='e-start'
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.start_time)}
                  />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name='end_time'
              render={({ field }) => (
                <FormField id='e-end' label='Ends' hint='Optional' error={errors.end_time?.message}>
                  <TimePicker
                    id='e-end'
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.end_time)}
                    clearable
                  />
                </FormField>
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name='audience'
          render={({ field }) => (
            <FormField id='e-audience' label='Who is invited' className='sm:col-span-2'>
              <SegmentedControl
                label='Who is invited'
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'school', label: 'Whole school' },
                  { value: 'classes', label: 'Chosen classes' },
                ]}
              />
            </FormField>
          )}
        />
        {audience === 'classes' && (
          <Controller
            control={control}
            name='class_ids'
            render={({ field }) => (
              <FormField
                id='e-classes'
                label='Classes'
                required
                error={errors.class_ids?.message}
                className='sm:col-span-2'
              >
                <ClassPicker id='e-classes' value={field.value} onChange={field.onChange} />
              </FormField>
            )}
          />
        )}
        <Controller
          control={control}
          name='rsvp_required'
          render={({ field }) => (
            <SwitchRow
              title='Ask parents to reply'
              hint='Attending, Not attending or Maybe for each child'
              className='sm:col-span-2'
            >
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label='Ask parents to reply'
              />
            </SwitchRow>
          )}
        />
        {rsvpRequired && (
          <FormField
            id='e-deadline'
            label='Reply by'
            hint='Empty = until the event starts'
            error={errors.rsvp_deadline?.message}
            className='sm:col-span-2'
          >
            <Input id='e-deadline' type='datetime-local' {...register('rsvp_deadline')} />
          </FormField>
        )}
        {!published && (
          <Controller
            control={control}
            name='publish'
            render={({ field }) => (
              <SwitchRow
                title='Publish now'
                hint='Parents get a notification. Leave off to keep a draft.'
                className='sm:col-span-2'
              >
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label='Publish now'
                />
              </SwitchRow>
            )}
          />
        )}
      </form>
    </AppModal>
  )
}

function SwitchRow({
  title,
  hint,
  className,
  children,
}: {
  title: string
  hint: string
  className?: string
  children: ReactNode
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${className ?? ''}`}
    >
      <span className='grid'>
        <span className='font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
      {children}
    </label>
  )
}
