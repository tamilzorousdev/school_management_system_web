import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import {
  roomsApi,
  type LockerBulkInput,
  type LockerBulkResult,
  type LockerDetail,
  type LockerInput,
  type LockerSize,
} from '../api-rooms'
import { labelOptions } from '../labels'
import { LOCKER_SIZE } from './asset-labels'
import { RoomSelect } from './asset-room-select'
import { FormAlert } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { BlockSelect, HostelSelect } from './pickers'
import { intInRange } from './setup-helpers'

const ADD_FORM_ID = 'hostel-locker-add-form'
const BULK_FORM_ID = 'hostel-locker-bulk-form'
const LOCKER_NO = /^[A-Za-z0-9-]{1,20}$/

const place = {
  hostel_id: z.string().min(1, 'Choose a hostel'),
  block_id: z.string(),
  room_id: z.string(),
  size: z.string(),
}

const addSchema = z.object({
  ...place,
  locker_no: z.string().trim().regex(LOCKER_NO, 'Up to 20 letters, digits or dashes'),
  notes: z.string().trim().max(255, 'Up to 255 characters'),
})
type AddValues = z.infer<typeof addSchema>

const bulkSchema = z.object({
  ...place,
  prefix: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{0,10}$/, 'Up to 10 letters, digits or dashes'),
  start_no: z.string().refine((value) => intInRange(value, 0, 99999), 'A number, 0 to 99999'),
  count: z.string().refine((value) => intInRange(value, 1, 200), 'A number, 1 to 200'),
  pad: z.string().refine((value) => !value.trim() || intInRange(value, 0, 6), 'A number, 0 to 6'),
})
type BulkValues = z.infer<typeof bulkSchema>

type PlaceValues = Pick<AddValues, 'hostel_id' | 'block_id' | 'room_id' | 'size'>

export interface LockerDefaults {
  hostelId?: number
  blockId?: number
}

const PLACE_CODES = {
  HOSTEL_NOT_FOUND: 'hostel_id',
  HOSTEL_BLOCK_NOT_FOUND: 'block_id',
  HOSTEL_ROOM_NOT_FOUND: 'room_id',
} as const

const placeBody = (values: PlaceValues) => ({
  hostel_id: Number(values.hostel_id),
  block_id: values.block_id ? Number(values.block_id) : undefined,
  room_id: values.room_id ? Number(values.room_id) : undefined,
  size: (values.size || undefined) as LockerSize | undefined,
})

function PlaceFields<T extends PlaceValues>({
  idPrefix,
  control,
  setValue,
  errors,
  submitted,
}: {
  idPrefix: string
  control: Control<T>
  setValue: UseFormSetValue<T>
  errors: Partial<Record<keyof PlaceValues, string>>
  submitted: boolean
}) {
  const typed = control as unknown as Control<PlaceValues>
  const set = setValue as unknown as UseFormSetValue<PlaceValues>
  const [hostelId, blockId, roomId, size] = useWatch({
    control: typed,
    name: ['hostel_id', 'block_id', 'room_id', 'size'],
  })
  const update = (name: keyof PlaceValues, value: string | undefined) =>
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
            update('room_id', undefined)
          }}
        />
      </FormField>
      <FormField id={`${idPrefix}-block`} label='Block' error={errors.block_id}>
        <BlockSelect
          id={`${idPrefix}-block`}
          hostelId={hostelId ? Number(hostelId) : undefined}
          allLabel='No particular block'
          value={blockId || undefined}
          invalid={Boolean(errors.block_id)}
          className='sm:w-full'
          onChange={(value) => {
            update('block_id', value)
            update('room_id', undefined)
          }}
        />
      </FormField>
      <FormField
        id={`${idPrefix}-room`}
        label='Room'
        error={errors.room_id}
        hint='Leave empty for a common locker room'
      >
        <RoomSelect
          id={`${idPrefix}-room`}
          hostelId={hostelId ? Number(hostelId) : undefined}
          blockId={blockId ? Number(blockId) : undefined}
          allLabel='Not in a room'
          value={roomId || undefined}
          invalid={Boolean(errors.room_id)}
          className='sm:w-full'
          onChange={(value) => update('room_id', value)}
        />
      </FormField>
      <FormField id={`${idPrefix}-size`} label='Size' error={errors.size}>
        <Combobox
          id={`${idPrefix}-size`}
          label='Size'
          value={size || undefined}
          allLabel='Not set'
          placeholder='Not set'
          options={labelOptions(LOCKER_SIZE)}
          highlightSelected={false}
          className='sm:w-full'
          onChange={(value) => update('size', value)}
        />
      </FormField>
    </div>
  )
}

export function AddLockerModal({
  open,
  defaults,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  defaults: LockerDefaults
  onOpenChange: (open: boolean) => void
  onCreated: (locker: LockerDetail) => void
}) {
  const save = useHostelMutation((input: LockerInput) => roomsApi.createLocker(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Add locker'
      description='A locker can stand in a room or in a common locker room.'
      formId={ADD_FORM_ID}
      submitText='Add locker'
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <AddLockerForm
          defaults={defaults}
          onSubmit={async (input) => {
            const locker = await save.mutateAsync(input)
            alerts.success(`Locker ${locker.locker_no} added`)
            onOpenChange(false)
            onCreated(locker)
          }}
        />
      )}
    </AppModal>
  )
}

function AddLockerForm({
  defaults,
  onSubmit,
}: {
  defaults: LockerDefaults
  onSubmit: (input: LockerInput) => Promise<void>
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
      room_id: '',
      size: '',
      locker_no: '',
      notes: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...placeBody(values),
        locker_no: values.locker_no.toUpperCase(),
        notes: textOrNull(values.notes),
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'block_id', 'room_id', 'size', 'locker_no', 'notes'],
        { ...PLACE_CODES, HOSTEL_LOCKER_NO_TAKEN: 'locker_no' }
      )
    }
  })

  return (
    <form id={ADD_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <PlaceFields
        idPrefix='locker-add'
        control={control}
        setValue={setValue}
        submitted={isSubmitted}
        errors={{
          hostel_id: errors.hostel_id?.message,
          block_id: errors.block_id?.message,
          room_id: errors.room_id?.message,
          size: errors.size?.message,
        }}
      />
      <FormField
        id='locker-add-no'
        label='Locker number'
        required
        error={errors.locker_no?.message}
      >
        <Input
          id='locker-add-no'
          autoComplete='off'
          placeholder='L-005'
          maxLength={20}
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.locker_no)}
          {...register('locker_no')}
        />
      </FormField>
      <FormField id='locker-add-notes' label='Notes' error={errors.notes?.message}>
        <Textarea
          id='locker-add-notes'
          rows={2}
          maxLength={255}
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}

const lockerName = (prefix: string, number: number, pad: number) =>
  `${prefix.trim().toUpperCase()}${String(number).padStart(pad, '0')}`

export function BulkLockersModal({
  open,
  defaults,
  onOpenChange,
}: {
  open: boolean
  defaults: LockerDefaults
  onOpenChange: (open: boolean) => void
}) {
  const save = useHostelMutation((input: LockerBulkInput) => roomsApi.bulkLockers(input))
  const [result, setResult] = useState<LockerBulkResult | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setResult(null)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={result ? 'Lockers added' : 'Add lockers in bulk'}
      description={result ? undefined : 'Creates a run of numbered lockers, e.g. L-001 to L-040.'}
      formId={result ? undefined : BULK_FORM_ID}
      submitText='Add lockers'
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
            {result.created} {result.created === 1 ? 'locker' : 'lockers'} created
          </p>
          <ul className='flex max-h-60 flex-wrap gap-1.5 overflow-y-auto'>
            {result.locker_nos.map((lockerNo) => (
              <li
                key={lockerNo}
                className='rounded-md border bg-muted px-2 py-0.5 font-mono text-xs'
              >
                {lockerNo}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        open && (
          <BulkLockersForm
            defaults={defaults}
            onSubmit={async (input) => {
              const created = await save.mutateAsync(input)
              alerts.success(`${created.created} lockers added`)
              setResult(created)
            }}
          />
        )
      )}
    </AppModal>
  )
}

function BulkLockersForm({
  defaults,
  onSubmit,
}: {
  defaults: LockerDefaults
  onSubmit: (input: LockerBulkInput) => Promise<void>
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
      room_id: '',
      size: '',
      prefix: 'L-',
      start_no: '1',
      count: '20',
      pad: '3',
    },
  })
  const [prefix, startNo, count, pad] = useWatch({
    control,
    name: ['prefix', 'start_no', 'count', 'pad'],
  })
  const padding = pad.trim() ? Number(pad) : 0
  const valid =
    /^[A-Za-z0-9-]{0,10}$/.test(prefix.trim()) &&
    intInRange(startNo, 0, 99999) &&
    intInRange(count, 1, 200) &&
    (!pad.trim() || intInRange(pad, 0, 6))
  const first = valid ? lockerName(prefix, Number(startNo), padding) : null
  const last = valid ? lockerName(prefix, Number(startNo) + Number(count) - 1, padding) : null
  const tooLong = Boolean(last && last.length > 20)

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...placeBody(values),
        prefix: values.prefix.trim().toUpperCase() || undefined,
        start_no: Number(values.start_no),
        count: Number(values.count),
        pad: values.pad.trim() ? Number(values.pad) : undefined,
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['hostel_id', 'block_id', 'room_id', 'size', 'prefix', 'start_no', 'count', 'pad'],
        { ...PLACE_CODES, HOSTEL_LOCKER_NO_TAKEN: 'start_no' }
      )
    }
  })

  return (
    <form id={BULK_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <PlaceFields
        idPrefix='locker-bulk'
        control={control}
        setValue={setValue}
        submitted={isSubmitted}
        errors={{
          hostel_id: errors.hostel_id?.message,
          block_id: errors.block_id?.message,
          room_id: errors.room_id?.message,
          size: errors.size?.message,
        }}
      />
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        <FormField
          id='locker-bulk-prefix'
          label='Prefix'
          error={errors.prefix?.message}
          hint='e.g. L-'
        >
          <Input
            id='locker-bulk-prefix'
            autoComplete='off'
            maxLength={10}
            className='font-mono uppercase'
            aria-invalid={Boolean(errors.prefix)}
            {...register('prefix')}
          />
        </FormField>
        <FormField
          id='locker-bulk-start'
          label='First number'
          required
          error={errors.start_no?.message}
        >
          <Input
            id='locker-bulk-start'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.start_no)}
            {...register('start_no')}
          />
        </FormField>
        <FormField id='locker-bulk-count' label='How many' required error={errors.count?.message}>
          <Input
            id='locker-bulk-count'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.count)}
            {...register('count')}
          />
        </FormField>
        <FormField
          id='locker-bulk-pad'
          label='Digits'
          error={errors.pad?.message}
          hint='3 makes 7 into 007'
        >
          <Input
            id='locker-bulk-pad'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.pad)}
            {...register('pad')}
          />
        </FormField>
      </div>
      <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm'>
        {first && last ? (
          tooLong ? (
            <span className='text-destructive'>Locker numbers can be at most 20 characters.</span>
          ) : (
            <>
              Creates{' '}
              <span className='font-mono font-semibold'>
                {first === last ? first : `${first} … ${last}`}
              </span>
              , all available.
            </>
          )
        ) : (
          <span className='text-muted-foreground'>
            Fill in the numbers to see the locker names.
          </span>
        )}
      </p>
    </form>
  )
}
