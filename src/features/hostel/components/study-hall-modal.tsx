import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation, useHostels } from '../api'
import { studyApi, type HallStatus, type StudyHall, type StudyHallInput } from '../api-duty'
import { FormAlert } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { HostelSelect, StaffPicker } from './pickers'

const FORM_ID = 'study-hall-form'

const schema = z.object({
  hostel_id: z.string().min(1, 'Choose a hostel'),
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Keep it to 60 characters'),
  location: z.string().trim().max(120, 'Keep it to 120 characters'),
  capacity: z.string().refine((value) => {
    const number = Number(value)
    return /^\d+$/.test(value.trim()) && number >= 1 && number <= 500
  }, 'A whole number, 1 to 500'),
  supervisor_user_id: z.string(),
  status: z.enum(['open', 'closed']),
  notes: z.string().trim().max(255, 'Keep it to 255 characters'),
})

type FormValues = z.infer<typeof schema>

const STATUS_OPTIONS: { value: HallStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

export function StudyHallModal({
  hall,
  hostelId,
  onClose,
}: {
  hall: StudyHall | null
  hostelId?: number
  onClose: () => void
}) {
  const hostels = useHostels()
  const fallback = hostelId ?? (hostels.data?.length === 1 ? hostels.data[0].id : undefined)
  const save = useHostelMutation((input: StudyHallInput) => {
    if (!hall) return studyApi.createHall(input)
    const { hostel_id: _hostel, ...patch } = input
    return studyApi.updateHall(hall.id, patch)
  })
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostel_id: hall ? String(hall.hostel_id) : fallback ? String(fallback) : '',
      name: hall?.name ?? '',
      location: hall?.location ?? '',
      capacity: String(hall?.capacity ?? 40),
      supervisor_user_id: hall?.supervisor_user_id ? String(hall.supervisor_user_id) : '',
      status: hall?.status ?? 'open',
      notes: hall?.notes ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        hostel_id: Number(values.hostel_id),
        name: values.name,
        location: textOrNull(values.location),
        capacity: Number(values.capacity),
        supervisor_user_id: values.supervisor_user_id ? Number(values.supervisor_user_id) : null,
        status: values.status,
        notes: textOrNull(values.notes),
      })
      alerts.success(hall ? 'Study hall updated' : 'Study hall added', {
        description: `${saved.name} · ${saved.seats_active} seats`,
      })
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'name', 'location', 'capacity', 'supervisor_user_id', 'status', 'notes'],
        {
          HOSTEL_NOT_FOUND: 'hostel_id',
          HOSTEL_STUDY_HALL_NAME_TAKEN: 'name',
          HOSTEL_STUDY_HALL_SEATS_TAKEN: 'capacity',
        }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={hall ? 'Edit study hall' : 'Add study hall'}
      description='Seats S1, S2… are made for the capacity. A lower capacity turns off free seats only.'
      formId={FORM_ID}
      submitText={hall ? 'Save hall' : 'Add hall'}
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='hall-name' label='Name' required error={errors.name?.message}>
            <Input
              id='hall-name'
              autoComplete='off'
              maxLength={60}
              placeholder='Prep Hall 1'
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>
          <FormField
            id='hall-hostel'
            label='Hostel'
            required
            error={errors.hostel_id?.message}
            hint={hall ? 'The hostel of a hall cannot be changed' : undefined}
          >
            {hall ? (
              <Input id='hall-hostel' value={hall.hostel_name} disabled readOnly />
            ) : (
              <Controller
                control={control}
                name='hostel_id'
                render={({ field }) => (
                  <HostelSelect
                    id='hall-hostel'
                    value={field.value || undefined}
                    invalid={Boolean(errors.hostel_id)}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            )}
          </FormField>
          <FormField
            id='hall-capacity'
            label='Seats'
            required
            error={errors.capacity?.message}
            hint={hall ? `${hall.seats_taken} seats are taken now` : '1 to 500'}
          >
            <Input
              id='hall-capacity'
              type='number'
              inputMode='numeric'
              min={1}
              max={500}
              aria-invalid={Boolean(errors.capacity)}
              {...register('capacity')}
            />
          </FormField>
          <FormField
            id='hall-location'
            label='Location'
            error={errors.location?.message}
            hint='Optional'
          >
            <Input
              id='hall-location'
              autoComplete='off'
              maxLength={120}
              placeholder='Ground floor, A Block'
              aria-invalid={Boolean(errors.location)}
              {...register('location')}
            />
          </FormField>
          <FormField
            id='hall-supervisor'
            label='Supervisor'
            error={errors.supervisor_user_id?.message}
            hint='Optional'
          >
            <Controller
              control={control}
              name='supervisor_user_id'
              render={({ field }) => (
                <StaffPicker
                  id='hall-supervisor'
                  label='Supervisor'
                  value={field.value || undefined}
                  initial={
                    hall?.supervisor_user_id && hall.supervisor_name
                      ? { value: String(hall.supervisor_user_id), label: hall.supervisor_name }
                      : null
                  }
                  invalid={Boolean(errors.supervisor_user_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <div className='grid content-start gap-1.5'>
            <span className='text-sm font-medium'>Status</span>
            <Controller
              control={control}
              name='status'
              render={({ field }) => (
                <SegmentedControl
                  label='Hall status'
                  value={field.value}
                  options={STATUS_OPTIONS}
                  onChange={field.onChange}
                  className='self-start'
                />
              )}
            />
            <p className='text-xs text-muted-foreground'>
              No new seats are given in a closed hall.
            </p>
          </div>
        </div>
        <FormField id='hall-notes' label='Notes' error={errors.notes?.message} hint='Optional'>
          <Textarea
            id='hall-notes'
            maxLength={255}
            aria-invalid={Boolean(errors.notes)}
            {...register('notes')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
