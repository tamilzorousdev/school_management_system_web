import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  hostelApi,
  useHostelMutation,
  type Application,
  type ApplicationAction,
  type ApplicationInput,
} from '../api'
import { HostelSelect, RoomTypeSelect, StudentPicker } from './pickers'
import { applyApiError, nullIfEmpty, optionalText, undefinedIfEmpty } from './resident-form'
import { FormError } from './resident-form-parts'

const FORM_ID = 'hostel-application-form'
const DECISION_FORM_ID = 'hostel-application-decision'

const schema = z.object({
  student_id: z.string().min(1, 'Choose a student'),
  hostel_id: z.string(),
  room_type_id: z.string(),
  priority: z
    .string()
    .trim()
    .refine(
      (value) => !value || (/^\d+$/.test(value) && Number(value) <= 100),
      'Enter a number from 0 to 100'
    ),
  wanted_from: z.string(),
  reason: optionalText(500, 'Reason'),
})

type FormValues = z.infer<typeof schema>

export function ApplicationFormModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useHostelMutation((input: ApplicationInput) => hostelApi.createApplication(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Record a hostel application'
      description='Applications wait in the list until you approve, waitlist or reject them.'
      formId={FORM_ID}
      submitText='Record application'
      loading={create.isPending}
      size='lg'
    >
      {open && (
        <ApplicationForm
          onSubmit={async (input) => {
            const application = await create.mutateAsync(input)
            alerts.success('Application recorded', {
              description: `${application.application_no} · ${application.student.name}`,
            })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ApplicationForm({ onSubmit }: { onSubmit: (input: ApplicationInput) => Promise<void> }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: '',
      hostel_id: '',
      room_type_id: '',
      priority: '0',
      wanted_from: '',
      reason: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        student_id: Number(values.student_id),
        hostel_id: values.hostel_id ? Number(values.hostel_id) : null,
        room_type_id: values.room_type_id ? Number(values.room_type_id) : null,
        priority: values.priority ? Number(values.priority) : 0,
        wanted_from: undefinedIfEmpty(values.wanted_from),
        reason: nullIfEmpty(values.reason),
      })
    } catch (error) {
      applyApiError(error, setError, Object.keys(schema.shape) as (keyof FormValues)[], {
        HOSTEL_APPLICATION_EXISTS: 'student_id',
        HOSTEL_ALREADY_ADMITTED: 'student_id',
        HOSTEL_STUDENT_NOT_ACTIVE: 'student_id',
        HOSTEL_GENDER_MISMATCH: 'hostel_id',
        HOSTEL_INACTIVE: 'hostel_id',
      })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <FormError message={errors.root?.message} />
      </div>
      <FormField
        id='application-student'
        label='Student'
        required
        error={errors.student_id?.message}
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='student_id'
          render={({ field }) => (
            <StudentPicker
              id='application-student'
              label='Student'
              value={field.value || undefined}
              invalid={Boolean(errors.student_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='application-hostel' label='Preferred hostel' error={errors.hostel_id?.message}>
        <Controller
          control={control}
          name='hostel_id'
          render={({ field }) => (
            <HostelSelect
              id='application-hostel'
              label='Preferred hostel'
              value={field.value || undefined}
              invalid={Boolean(errors.hostel_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='application-room-type' label='Room type' error={errors.room_type_id?.message}>
        <Controller
          control={control}
          name='room_type_id'
          render={({ field }) => (
            <RoomTypeSelect
              id='application-room-type'
              value={field.value || undefined}
              invalid={Boolean(errors.room_type_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField
        id='application-priority'
        label='Priority'
        error={errors.priority?.message}
        hint='0 to 100. Higher comes first on the waitlist.'
      >
        <Input
          id='application-priority'
          type='number'
          inputMode='numeric'
          min={0}
          max={100}
          className='tabular'
          aria-invalid={Boolean(errors.priority)}
          {...register('priority')}
        />
      </FormField>
      <FormField id='application-from' label='Wanted from' error={errors.wanted_from?.message}>
        <Controller
          control={control}
          name='wanted_from'
          render={({ field }) => (
            <DatePicker
              id='application-from'
              value={field.value}
              invalid={Boolean(errors.wanted_from)}
              onChange={(value: string) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField
        id='application-reason'
        label='Reason'
        error={errors.reason?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='application-reason'
          rows={3}
          placeholder='Distance from home, parents working abroad…'
          aria-invalid={Boolean(errors.reason)}
          {...register('reason')}
        />
      </FormField>
    </form>
  )
}

const DECISION_TEXT: Record<
  ApplicationAction,
  { title: string; submit: string; done: string; description: string }
> = {
  approve: {
    title: 'Approve application',
    submit: 'Approve',
    done: 'Application approved',
    description: 'The student can then be admitted from the applications list.',
  },
  waitlist: {
    title: 'Move to the waitlist',
    submit: 'Waitlist',
    done: 'Moved to the waitlist',
    description: 'Waitlisted applications are ordered by priority.',
  },
  reject: {
    title: 'Reject application',
    submit: 'Reject',
    done: 'Application rejected',
    description: 'The parent sees the note in the app, if you add one.',
  },
  cancel: {
    title: 'Cancel application',
    submit: 'Cancel application',
    done: 'Application cancelled',
    description: 'Use this when the family no longer needs a hostel place.',
  },
}

export interface DecisionTarget {
  application: Application
  action: ApplicationAction
}

export function ApplicationDecisionModal({
  target,
  onClose,
}: {
  target: DecisionTarget | null
  onClose: () => void
}) {
  const decide = useHostelMutation((input: DecisionTarget & { note: string | null }) =>
    hostelApi.decideApplication(input.application.id, input.action, input.note)
  )
  const text = target ? DECISION_TEXT[target.action] : null
  return (
    <AppModal
      open={Boolean(target)}
      onOpenChange={(next) => !next && onClose()}
      title={text?.title ?? ''}
      description={
        target && text
          ? `${target.application.application_no} · ${target.application.student.name}. ${text.description}`
          : undefined
      }
      formId={DECISION_FORM_ID}
      submitText={text?.submit}
      loading={decide.isPending}
      size='sm'
    >
      {target && text && (
        <DecisionForm
          key={`${target.application.id}-${target.action}`}
          onSubmit={async (note) => {
            await decide.mutateAsync({ ...target, note })
            alerts.success(text.done)
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function DecisionForm({ onSubmit }: { onSubmit: (note: string | null) => Promise<void> }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      id={DECISION_FORM_ID}
      noValidate
      className='grid gap-3'
      onSubmit={async (event) => {
        event.preventDefault()
        if (note.trim().length > 255) {
          setError('Keep the note under 255 characters')
          return
        }
        setError(null)
        try {
          await onSubmit(nullIfEmpty(note))
        } catch (caught) {
          setError(toApiError(caught).message)
        }
      }}
    >
      <FormError message={error ?? undefined} />
      <FormField id='decision-note' label='Note' hint='Optional'>
        <Textarea
          id='decision-note'
          rows={3}
          value={note}
          maxLength={255}
          onChange={(event) => setNote(event.target.value)}
        />
      </FormField>
    </form>
  )
}
