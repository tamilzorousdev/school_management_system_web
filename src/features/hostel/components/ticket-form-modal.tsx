import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  useHostelMutation,
  useRooms,
  type MaintenanceCategory,
  type Priority,
  type TicketDetail,
  type TicketInput,
} from '../api'
import { labelOptions, MAINTENANCE_CATEGORY, PRIORITY, toneOptions } from '../labels'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { HostelSelect } from './pickers'

const FORM_ID = 'hostel-ticket-form'

const schema = z.object({
  hostel_id: z.string().min(1, 'Choose a hostel'),
  room_id: z.string(),
  category: z.string().min(1, 'Choose a category'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  title: z.string().trim().min(3, 'Enter a short title').max(120, 'Keep it to 120 characters'),
  description: z.string().trim().max(1000, 'Keep it to 1000 characters'),
  blocks_room: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export interface TicketDefaults {
  hostel_id?: number
  room_id?: number | null
  category?: MaintenanceCategory
  priority?: Priority
  title?: string
  description?: string | null
}

export function TicketFormModal({
  title,
  description,
  submitText,
  defaults,
  lockPlace = false,
  onSubmit,
  onClose,
  onCreated,
}: {
  title: string
  description?: string
  submitText: string
  defaults?: TicketDefaults
  lockPlace?: boolean
  onSubmit: (input: TicketInput) => Promise<TicketDetail>
  onClose: () => void
  onCreated?: (ticket: TicketDetail) => void
}) {
  const save = useHostelMutation(onSubmit)
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
      hostel_id: defaults?.hostel_id ? String(defaults.hostel_id) : '',
      room_id: defaults?.room_id ? String(defaults.room_id) : '',
      category: defaults?.category ?? '',
      priority: defaults?.priority ?? 'normal',
      title: defaults?.title?.slice(0, 120) ?? '',
      description: defaults?.description?.slice(0, 1000) ?? '',
      blocks_room: false,
    },
  })
  const hostelId = Number(useWatch({ control, name: 'hostel_id' })) || undefined
  const roomId = useWatch({ control, name: 'room_id' })
  const rooms = useRooms({ page: 1, limit: 100, hostel_id: hostelId }, Boolean(hostelId))
  const roomOptions = (rooms.data?.items ?? []).map((room) => ({
    value: String(room.id),
    label: room.room_no,
    hint: [room.block_name, room.floor_name].filter(Boolean).join(' · '),
  }))

  const submit = handleSubmit(async (values) => {
    try {
      const ticket = await save.mutateAsync({
        hostel_id: Number(values.hostel_id),
        room_id: values.room_id ? Number(values.room_id) : undefined,
        category: values.category as MaintenanceCategory,
        priority: values.priority,
        title: values.title,
        description: textOrNull(values.description),
        blocks_room: values.room_id ? values.blocks_room : undefined,
      })
      alerts.success('Ticket raised', {
        description:
          values.blocks_room && values.room_id
            ? `${ticket.ticket_no}. The room takes no new students until it is done.`
            : ticket.ticket_no,
      })
      onCreated?.(ticket)
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'room_id', 'category', 'priority', 'title', 'description', 'blocks_room'],
        { HOSTEL_TICKET_EXISTS: 'title' }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      formId={FORM_ID}
      submitText={submitText}
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          {!lockPlace && (
            <>
              <FormField
                id='ticket-hostel'
                label='Hostel'
                required
                error={errors.hostel_id?.message}
              >
                <Controller
                  control={control}
                  name='hostel_id'
                  render={({ field }) => (
                    <HostelSelect
                      id='ticket-hostel'
                      value={field.value || undefined}
                      invalid={Boolean(errors.hostel_id)}
                      onChange={(value) => {
                        field.onChange(value ?? '')
                        setValue('room_id', '')
                      }}
                    />
                  )}
                />
              </FormField>
              <FormField
                id='ticket-room'
                label='Room'
                error={errors.room_id?.message}
                hint='Leave empty for a common area'
              >
                <Controller
                  control={control}
                  name='room_id'
                  render={({ field }) => (
                    <Combobox
                      id='ticket-room'
                      label='Room'
                      value={field.value || undefined}
                      allLabel='No particular room'
                      placeholder='No particular room'
                      searchPlaceholder='Search room number'
                      emptyText={
                        !hostelId
                          ? 'Choose a hostel first'
                          : rooms.isFetching
                            ? 'Loading…'
                            : 'No rooms in this hostel'
                      }
                      options={roomOptions}
                      highlightSelected={false}
                      className='sm:w-full'
                      onChange={(value) => field.onChange(value ?? '')}
                    />
                  )}
                />
              </FormField>
            </>
          )}
          <FormField
            id='ticket-category'
            label='Category'
            required
            error={errors.category?.message}
          >
            <Controller
              control={control}
              name='category'
              render={({ field }) => (
                <Combobox
                  id='ticket-category'
                  label='Category'
                  value={field.value || undefined}
                  placeholder='Choose category'
                  options={labelOptions(MAINTENANCE_CATEGORY)}
                  invalid={Boolean(errors.category)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField
            id='ticket-priority'
            label='Priority'
            required
            error={errors.priority?.message}
          >
            <Controller
              control={control}
              name='priority'
              render={({ field }) => (
                <Combobox
                  id='ticket-priority'
                  label='Priority'
                  value={field.value}
                  placeholder='Choose priority'
                  options={toneOptions(PRIORITY)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange((value ?? 'normal') as Priority)}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='ticket-title' label='Title' required error={errors.title?.message}>
          <Input
            id='ticket-title'
            autoComplete='off'
            maxLength={120}
            placeholder='Replace ceiling fan'
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </FormField>
        <FormField id='ticket-description' label='Details' error={errors.description?.message}>
          <Textarea
            id='ticket-description'
            maxLength={1000}
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </FormField>
        {(lockPlace ? Boolean(defaults?.room_id) : Boolean(roomId)) && (
          <Controller
            control={control}
            name='blocks_room'
            render={({ field }) => (
              <SwitchField
                id='ticket-blocks-room'
                label='Close the room until it is fixed'
                description='The room is set to maintenance: no new students are given a bed there until every blocking ticket is done or cancelled.'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        )}
        {lockPlace && (
          <InfoNote>
            The ticket is raised for the same hostel and room as the complaint. Finishing the ticket
            resolves the complaint.
          </InfoNote>
        )}
      </form>
    </AppModal>
  )
}
