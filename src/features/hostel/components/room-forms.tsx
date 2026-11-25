import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Controller, useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  type RoomBulkInput,
  type RoomBulkResult,
  type RoomDetail,
  type RoomInput,
  type RoomUpdateInput,
} from '../api'
import { BlockSelect, HostelSelect, RoomTypeSelect } from './pickers'
import { FloorSelect } from './room-parts'
import { FormAlert } from './setup-form-parts'
import { applyApiError, intInRange, optionalText } from './setup-helpers'

const ADD_FORM_ID = 'hostel-room-add-form'
const BULK_FORM_ID = 'hostel-room-bulk-form'
const EDIT_FORM_ID = 'hostel-room-edit-form'

const location = {
  hostel_id: z.string().min(1, 'Choose a hostel'),
  block_id: z.string().min(1, 'Choose a block'),
  floor_id: z.string().min(1, 'Choose a floor'),
  room_type_id: z.string().min(1, 'Choose a room type'),
}

const addSchema = z.object({
  ...location,
  room_no: z.string().trim().min(1, 'Enter the room number').max(20, 'Up to 20 characters'),
  capacity: z
    .string()
    .refine((value) => !value.trim() || intInRange(value, 1, 50), 'A whole number, 1 to 50'),
})
type AddValues = z.infer<typeof addSchema>

const bulkSchema = z.object({
  ...location,
  prefix: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{0,10}$/, 'Up to 10 letters, digits or dashes'),
  start_no: z.string().refine((value) => intInRange(value, 0, 99999), 'A number, 0 to 99999'),
  count: z.string().refine((value) => intInRange(value, 1, 100), 'A number, 1 to 100'),
  pad: z.string().refine((value) => !value.trim() || intInRange(value, 0, 6), 'A number, 0 to 6'),
})
type BulkValues = z.infer<typeof bulkSchema>

const editSchema = z.object({
  room_type_id: z.string().min(1, 'Choose a room type'),
  room_no: z.string().trim().min(1, 'Enter the room number').max(20, 'Up to 20 characters'),
  capacity: z.string().refine((value) => intInRange(value, 1, 50), 'A whole number, 1 to 50'),
  notes: z.string().max(255, 'Up to 255 characters'),
})
type EditValues = z.infer<typeof editSchema>

type LocationValues = Pick<AddValues, 'hostel_id' | 'block_id' | 'floor_id' | 'room_type_id'>

export interface RoomDefaults {
  hostelId?: number
  blockId?: number
}

function LocationFields<T extends LocationValues>({
  idPrefix,
  control,
  setValue,
  errors,
  submitted,
}: {
  idPrefix: string
  control: Control<T>
  setValue: UseFormSetValue<T>
  errors: Partial<Record<keyof LocationValues, string>>
  submitted: boolean
}) {
  const typed = control as unknown as Control<LocationValues>
  const set = setValue as unknown as UseFormSetValue<LocationValues>
  const [hostelId, blockId, floorId, roomTypeId] = useWatch({
    control: typed,
    name: ['hostel_id', 'block_id', 'floor_id', 'room_type_id'],
  })
  const update = (name: keyof LocationValues, value: string | undefined) =>
    set(name, value ?? '', { shouldDirty: true, shouldValidate: submitted })

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <FormField id={`${idPrefix}-hostel`} label='Hostel' required error={errors.hostel_id}>
        <HostelSelect
          id={`${idPrefix}-hostel`}
          value={hostelId || undefined}
          invalid={Boolean(errors.hostel_id)}
          onChange={(value) => {
            update('hostel_id', value)
            update('block_id', undefined)
            update('floor_id', undefined)
          }}
        />
      </FormField>
      <FormField id={`${idPrefix}-block`} label='Block' required error={errors.block_id}>
        <BlockSelect
          id={`${idPrefix}-block`}
          hostelId={hostelId ? Number(hostelId) : undefined}
          value={blockId || undefined}
          invalid={Boolean(errors.block_id)}
          onChange={(value) => {
            update('block_id', value)
            update('floor_id', undefined)
          }}
        />
      </FormField>
      <FormField id={`${idPrefix}-floor`} label='Floor' required error={errors.floor_id}>
        <FloorSelect
          id={`${idPrefix}-floor`}
          blockId={blockId ? Number(blockId) : undefined}
          value={floorId || undefined}
          invalid={Boolean(errors.floor_id)}
          onChange={(value) => update('floor_id', value)}
        />
      </FormField>
      <FormField id={`${idPrefix}-type`} label='Room type' required error={errors.room_type_id}>
        <RoomTypeSelect
          id={`${idPrefix}-type`}
          value={roomTypeId || undefined}
          invalid={Boolean(errors.room_type_id)}
          onChange={(value) => update('room_type_id', value)}
        />
      </FormField>
    </div>
  )
}

export function AddRoomModal({
  open,
  defaults,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  defaults: RoomDefaults
  onOpenChange: (open: boolean) => void
  onCreated: (room: RoomDetail) => void
}) {
  const save = useHostelMutation((input: RoomInput) => hostelApi.createRoom(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Add room'
      description='Beds A, B, C… are created for the room.'
      formId={ADD_FORM_ID}
      submitText='Add room'
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <AddRoomForm
          defaults={defaults}
          onSubmit={async (input) => {
            const room = await save.mutateAsync(input)
            alerts.success(`Room ${room.room_no} added`, {
              description: `${room.capacity} beds ready to allocate.`,
            })
            onOpenChange(false)
            onCreated(room)
          }}
        />
      )}
    </AppModal>
  )
}

function AddRoomForm({
  defaults,
  onSubmit,
}: {
  defaults: RoomDefaults
  onSubmit: (input: RoomInput) => Promise<void>
}) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      hostel_id: defaults.hostelId ? String(defaults.hostelId) : '',
      block_id: defaults.blockId ? String(defaults.blockId) : '',
      floor_id: '',
      room_type_id: '',
      room_no: '',
      capacity: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        floor_id: Number(values.floor_id),
        room_type_id: Number(values.room_type_id),
        room_no: values.room_no.toUpperCase(),
        capacity: values.capacity.trim() ? Number(values.capacity) : undefined,
      })
    } catch (error) {
      applyApiError(error, setError, ['floor_id', 'room_type_id', 'room_no', 'capacity'], {
        HOSTEL_ROOM_NO_TAKEN: 'room_no',
        HOSTEL_FLOOR_NOT_FOUND: 'floor_id',
        HOSTEL_ROOM_TYPE_NOT_FOUND: 'room_type_id',
      })
    }
  })

  return (
    <form id={ADD_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <LocationFields
        idPrefix='room-add'
        control={control}
        setValue={setValue}
        submitted={isSubmitted}
        errors={{
          hostel_id: errors.hostel_id?.message,
          block_id: errors.block_id?.message,
          floor_id: errors.floor_id?.message,
          room_type_id: errors.room_type_id?.message,
        }}
      />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='room-add-no' label='Room number' required error={errors.room_no?.message}>
          <Input
            id='room-add-no'
            autoComplete='off'
            placeholder='A-101'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.room_no)}
            {...register('room_no')}
          />
        </FormField>
        <FormField
          id='room-add-capacity'
          label='Beds'
          error={errors.capacity?.message}
          hint="Leave empty to use the room type's bed count"
        >
          <Input
            id='room-add-capacity'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.capacity)}
            {...register('capacity')}
          />
        </FormField>
      </div>
    </form>
  )
}

const roomName = (prefix: string, number: number, pad: number) =>
  `${prefix.trim().toUpperCase()}${String(number).padStart(pad, '0')}`

export function BulkRoomsModal({
  open,
  defaults,
  onOpenChange,
}: {
  open: boolean
  defaults: RoomDefaults
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: RoomBulkInput) => hostelApi.bulkRooms(input))
  const [result, setResult] = useState<RoomBulkResult | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setResult(null)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={result ? 'Rooms added' : 'Add rooms in bulk'}
      description={
        result ? undefined : 'Creates a run of numbered rooms on one floor, all of one room type.'
      }
      formId={result ? undefined : BULK_FORM_ID}
      submitText='Add rooms'
      loading={save.isPending}
      size='lg'
      footer={
        result ? (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        ) : undefined
      }
    >
      {result ? (
        <div className='grid gap-3'>
          <p className='flex items-center gap-2 text-sm font-semibold'>
            <CheckCircle2 className='size-4 text-success' />
            {result.created} {result.created === 1 ? 'room' : 'rooms'} created
          </p>
          <ul className='flex max-h-60 flex-wrap gap-1.5 overflow-y-auto'>
            {result.room_nos.map((roomNo) => (
              <li key={roomNo} className='rounded-md border bg-muted px-2 py-0.5 font-mono text-xs'>
                {roomNo}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        open && (
          <BulkRoomsForm
            defaults={defaults}
            onSubmit={async (input) => {
              const created = await save.mutateAsync(input)
              alerts.success(`${created.created} rooms added`)
              setResult(created)
            }}
          />
        )
      )}
    </AppModal>
  )
}

function BulkRoomsForm({
  defaults,
  onSubmit,
}: {
  defaults: RoomDefaults
  onSubmit: (input: RoomBulkInput) => Promise<void>
}) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<BulkValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      hostel_id: defaults.hostelId ? String(defaults.hostelId) : '',
      block_id: defaults.blockId ? String(defaults.blockId) : '',
      floor_id: '',
      room_type_id: '',
      prefix: '',
      start_no: '101',
      count: '10',
      pad: '',
    },
  })
  const [prefix, startNo, count, pad] = useWatch({
    control,
    name: ['prefix', 'start_no', 'count', 'pad'],
  })
  const valid =
    /^[A-Za-z0-9-]{0,10}$/.test(prefix.trim()) &&
    intInRange(startNo, 0, 99999) &&
    intInRange(count, 1, 100) &&
    (!pad.trim() || intInRange(pad, 0, 6))
  const padding = pad.trim() ? Number(pad) : 0
  const first = valid ? roomName(prefix, Number(startNo), padding) : null
  const last = valid ? roomName(prefix, Number(startNo) + Number(count) - 1, padding) : null

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        floor_id: Number(values.floor_id),
        room_type_id: Number(values.room_type_id),
        prefix: values.prefix.trim().toUpperCase() || undefined,
        start_no: Number(values.start_no),
        count: Number(values.count),
        pad: values.pad.trim() ? Number(values.pad) : undefined,
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['floor_id', 'room_type_id', 'prefix', 'start_no', 'count', 'pad'],
        {
          HOSTEL_ROOM_NO_TAKEN: 'start_no',
          HOSTEL_FLOOR_NOT_FOUND: 'floor_id',
          HOSTEL_ROOM_TYPE_NOT_FOUND: 'room_type_id',
        }
      )
    }
  })

  return (
    <form id={BULK_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <LocationFields
        idPrefix='room-bulk'
        control={control}
        setValue={setValue}
        submitted={isSubmitted}
        errors={{
          hostel_id: errors.hostel_id?.message,
          block_id: errors.block_id?.message,
          floor_id: errors.floor_id?.message,
          room_type_id: errors.room_type_id?.message,
        }}
      />
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        <FormField
          id='room-bulk-prefix'
          label='Prefix'
          error={errors.prefix?.message}
          hint='e.g. A-'
        >
          <Input
            id='room-bulk-prefix'
            autoComplete='off'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.prefix)}
            {...register('prefix')}
          />
        </FormField>
        <FormField
          id='room-bulk-start'
          label='First number'
          required
          error={errors.start_no?.message}
        >
          <Input
            id='room-bulk-start'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.start_no)}
            {...register('start_no')}
          />
        </FormField>
        <FormField id='room-bulk-count' label='How many' required error={errors.count?.message}>
          <Input
            id='room-bulk-count'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.count)}
            {...register('count')}
          />
        </FormField>
        <FormField
          id='room-bulk-pad'
          label='Digits'
          error={errors.pad?.message}
          hint='3 makes 7 into 007'
        >
          <Input
            id='room-bulk-pad'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.pad)}
            {...register('pad')}
          />
        </FormField>
      </div>
      <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm'>
        {first && last ? (
          <>
            Creates{' '}
            <span className='font-mono font-semibold'>
              {first === last ? first : `${first} … ${last}`}
            </span>{' '}
            with the room type&apos;s bed count.
          </>
        ) : (
          <span className='text-muted-foreground'>Fill in the numbers to see the room names.</span>
        )}
      </p>
    </form>
  )
}

export function EditRoomModal({
  room,
  onOpenChange,
}: {
  room: RoomDetail | null
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: { id: number; body: RoomUpdateInput }) =>
    hostelApi.updateRoom(input.id, input.body)
  )
  return (
    <AppModal
      open={Boolean(room)}
      onOpenChange={onOpenChange}
      title={room ? `Edit room ${room.room_no}` : 'Edit room'}
      formId={EDIT_FORM_ID}
      submitText='Save changes'
      loading={save.isPending}
    >
      {room && (
        <EditRoomForm
          key={room.id}
          room={room}
          onSubmit={async (body) => {
            await save.mutateAsync({ id: room.id, body })
            alerts.success('Room updated')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function EditRoomForm({
  room,
  onSubmit,
}: {
  room: RoomDetail
  onSubmit: (input: RoomUpdateInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      room_type_id: String(room.room_type_id),
      room_no: room.room_no,
      capacity: String(room.capacity),
      notes: room.notes ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        room_type_id: Number(values.room_type_id),
        room_no: values.room_no.toUpperCase(),
        capacity: Number(values.capacity),
        notes: optionalText(values.notes),
      })
    } catch (error) {
      applyApiError(error, setError, ['room_type_id', 'room_no', 'capacity', 'notes'], {
        HOSTEL_ROOM_NO_TAKEN: 'room_no',
        HOSTEL_ROOM_CAPACITY_BELOW_OCCUPIED: 'capacity',
        HOSTEL_ROOM_TYPE_NOT_FOUND: 'room_type_id',
      })
    }
  })

  return (
    <form id={EDIT_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <FormField
        id='room-edit-type'
        label='Room type'
        required
        error={errors.room_type_id?.message}
      >
        <Controller
          control={control}
          name='room_type_id'
          render={({ field }) => (
            <RoomTypeSelect
              id='room-edit-type'
              value={field.value || undefined}
              invalid={Boolean(errors.room_type_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='room-edit-no' label='Room number' required error={errors.room_no?.message}>
          <Input
            id='room-edit-no'
            autoComplete='off'
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.room_no)}
            {...register('room_no')}
          />
        </FormField>
        <FormField id='room-edit-capacity' label='Beds' required error={errors.capacity?.message}>
          <Input
            id='room-edit-capacity'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.capacity)}
            {...register('capacity')}
          />
        </FormField>
      </div>
      <p className='rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
        Raising the bed count adds new beds. Lowering it removes vacant beds only, so it cannot go
        below the {room.occupied_beds} {room.occupied_beds === 1 ? 'bed' : 'beds'} in use.
      </p>
      <FormField id='room-edit-notes' label='Notes' error={errors.notes?.message}>
        <Textarea
          id='room-edit-notes'
          rows={3}
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
