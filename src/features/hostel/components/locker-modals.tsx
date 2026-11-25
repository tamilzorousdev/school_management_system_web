import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import {
  roomsApi,
  type LockerAllocateInput,
  type LockerDetail,
  type LockerHolder,
  type LockerReturnInput,
  type LockerSettableStatus,
  type LockerSize,
  type LockerUpdateInput,
  type LockType,
} from '../api-rooms'
import { labelOptions } from '../labels'
import { LOCK_TYPE, LOCKER_SETTABLE, LOCKER_SIZE, LOCKER_STATUS } from './asset-labels'
import { RoomSelect } from './asset-room-select'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { BlockSelect, ResidentPicker } from './pickers'
import { intInRange, MONEY_PATTERN } from './setup-helpers'

const ALLOCATE_FORM_ID = 'hostel-locker-allocate-form'
const RETURN_FORM_ID = 'hostel-locker-return-form'
const EDIT_FORM_ID = 'hostel-locker-edit-form'

const allocateSchema = z.object({
  admission_id: z.string().min(1, 'Choose a resident'),
  keys_given: z.string().refine((value) => intInRange(value, 0, 5), 'A number, 0 to 5'),
  lock_type: z.enum(['school', 'own']),
  deposit: z
    .string()
    .trim()
    .refine(
      (value) => !value || (MONEY_PATTERN.test(value) && Number(value) <= 100000),
      'An amount up to 100000'
    ),
})
type AllocateValues = z.infer<typeof allocateSchema>

export function AllocateLockerModal({
  locker,
  onClose,
}: {
  locker: LockerDetail
  onClose: () => void
}) {
  const save = useHostelMutation((input: LockerAllocateInput) =>
    roomsApi.allocateLocker(locker.id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AllocateValues>({
    resolver: zodResolver(allocateSchema),
    defaultValues: { admission_id: '', keys_given: '1', lock_type: 'school', deposit: '' },
  })
  const lockType = useWatch({ control, name: 'lock_type' })

  const submit = handleSubmit(async (values) => {
    try {
      const updated = await save.mutateAsync({
        admission_id: Number(values.admission_id),
        keys_given: Number(values.keys_given),
        lock_type: values.lock_type,
        deposit: values.deposit ? Number(values.deposit) : null,
      })
      alerts.success(`Locker ${updated.locker_no} allotted`, {
        description: updated.holder?.student.name,
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['admission_id', 'keys_given', 'lock_type', 'deposit'], {
        HOSTEL_LOCKER_HELD: 'admission_id',
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Allot locker ${locker.locker_no}`}
      description={`Give it to a resident of ${locker.hostel_name}. A student can hold one locker.`}
      formId={ALLOCATE_FORM_ID}
      submitText='Allot locker'
      loading={save.isPending}
    >
      <form id={ALLOCATE_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='locker-allocate-resident'
          label='Resident'
          required
          error={errors.admission_id?.message}
        >
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                id='locker-allocate-resident'
                label='Resident'
                hostelId={locker.hostel_id}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='locker-allocate-lock'
            label='Lock'
            required
            error={errors.lock_type?.message}
          >
            <Controller
              control={control}
              name='lock_type'
              render={({ field }) => (
                <Combobox
                  id='locker-allocate-lock'
                  label='Lock'
                  value={field.value}
                  placeholder='Choose lock'
                  options={labelOptions(LOCK_TYPE)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange((value ?? 'school') as LockType)}
                />
              )}
            />
          </FormField>
          <FormField
            id='locker-allocate-keys'
            label='Keys given'
            required
            error={errors.keys_given?.message}
            hint={lockType === 'own' ? 'Usually 0 with their own padlock' : undefined}
          >
            <Input
              id='locker-allocate-keys'
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.keys_given)}
              {...register('keys_given')}
            />
          </FormField>
        </div>
        <FormField
          id='locker-allocate-deposit'
          label='Key deposit (₹)'
          error={errors.deposit?.message}
          hint='Leave empty when no deposit is collected'
        >
          <Input
            id='locker-allocate-deposit'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.deposit)}
            {...register('deposit')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

const returnSchema = z.object({
  keys_returned: z.string().refine((value) => intInRange(value, 0, 5), 'A number, 0 to 5'),
  damaged: z.boolean(),
  note: z.string().trim().max(200, 'Up to 200 characters'),
})
type ReturnValues = z.infer<typeof returnSchema>

export function ReturnLockerModal({
  locker,
  holder,
  onClose,
}: {
  locker: LockerDetail
  holder: LockerHolder
  onClose: () => void
}) {
  const save = useHostelMutation((input: LockerReturnInput) =>
    roomsApi.returnLocker(holder.allocation_id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { keys_returned: String(holder.keys_given), damaged: false, note: '' },
  })
  const keysReturned = useWatch({ control, name: 'keys_returned' })
  const missing = intInRange(keysReturned, 0, 5)
    ? Math.max(0, holder.keys_given - Number(keysReturned))
    : 0

  const submit = handleSubmit(async (values) => {
    if (Number(values.keys_returned) > holder.keys_given) {
      setError('keys_returned', {
        message: `Only ${holder.keys_given} ${holder.keys_given === 1 ? 'key was' : 'keys were'} given`,
      })
      return
    }
    try {
      const updated = await save.mutateAsync({
        keys_returned: Number(values.keys_returned),
        damaged: values.damaged,
        note: textOrNull(values.note),
      })
      alerts.success(`Locker ${updated.locker_no} returned`, {
        description: values.damaged ? 'Marked damaged.' : 'It is available again.',
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['keys_returned', 'damaged', 'note'])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Take back locker ${locker.locker_no}`}
      description={`From ${holder.student.name}. ${holder.keys_given} ${holder.keys_given === 1 ? 'key was' : 'keys were'} given.`}
      formId={RETURN_FORM_ID}
      submitText='Take back'
      loading={save.isPending}
    >
      <form id={RETURN_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='locker-return-keys'
          label='Keys returned'
          required
          error={errors.keys_returned?.message}
        >
          <Input
            id='locker-return-keys'
            inputMode='numeric'
            className='tabular'
            aria-invalid={Boolean(errors.keys_returned)}
            {...register('keys_returned')}
          />
        </FormField>
        {missing > 0 && (
          <InfoNote tone='warning'>
            {missing} {missing === 1 ? 'key is' : 'keys are'} not returned. This is noted on the
            allocation.
          </InfoNote>
        )}
        <Controller
          control={control}
          name='damaged'
          render={({ field }) => (
            <SwitchField
              id='locker-return-damaged'
              label='The locker is damaged'
              description='It is marked damaged and not given out again until repaired.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <FormField
          id='locker-return-note'
          label='Note'
          error={errors.note?.message}
          hint='Optional'
        >
          <Textarea
            id='locker-return-note'
            rows={2}
            maxLength={200}
            placeholder='Hinge loose'
            aria-invalid={Boolean(errors.note)}
            {...register('note')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

const editSchema = z.object({
  status: z.string(),
  size: z.string(),
  block_id: z.string(),
  room_id: z.string(),
  notes: z.string().trim().max(255, 'Up to 255 characters'),
})
type EditValues = z.infer<typeof editSchema>

export function EditLockerModal({
  locker,
  onClose,
}: {
  locker: LockerDetail
  onClose: () => void
}) {
  const save = useHostelMutation((input: LockerUpdateInput) =>
    roomsApi.updateLocker(locker.id, input)
  )
  const allotted = locker.status === 'allotted'
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: allotted ? '' : locker.status,
      size: locker.size ?? '',
      block_id: locker.block_id ? String(locker.block_id) : '',
      room_id: locker.room_id ? String(locker.room_id) : '',
      notes: locker.notes ?? '',
    },
  })
  const blockId = useWatch({ control, name: 'block_id' })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        status:
          allotted || !values.status || values.status === locker.status
            ? undefined
            : (values.status as LockerSettableStatus),
        size: (values.size || null) as LockerSize | null,
        block_id: values.block_id ? Number(values.block_id) : null,
        room_id: values.room_id ? Number(values.room_id) : null,
        notes: textOrNull(values.notes),
      })
      alerts.success(`Locker ${locker.locker_no} updated`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['status', 'size', 'block_id', 'room_id', 'notes'], {
        HOSTEL_LOCKER_ALLOTTED: 'status',
        HOSTEL_BLOCK_NOT_FOUND: 'block_id',
        HOSTEL_ROOM_NOT_FOUND: 'room_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit locker ${locker.locker_no}`}
      formId={EDIT_FORM_ID}
      submitText='Save changes'
      loading={save.isPending}
      size='lg'
    >
      <form id={EDIT_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='locker-edit-status'
            label='Status'
            error={errors.status?.message}
            hint={allotted ? 'Take the locker back first to change its status' : undefined}
          >
            {allotted ? (
              <Input
                id='locker-edit-status'
                value={LOCKER_STATUS.allotted.label}
                disabled
                readOnly
              />
            ) : (
              <Controller
                control={control}
                name='status'
                render={({ field }) => (
                  <Combobox
                    id='locker-edit-status'
                    label='Status'
                    value={field.value || undefined}
                    placeholder='Choose status'
                    options={LOCKER_SETTABLE.map((value) => ({
                      value,
                      label: LOCKER_STATUS[value].label,
                    }))}
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? locker.status)}
                  />
                )}
              />
            )}
          </FormField>
          <FormField id='locker-edit-size' label='Size' error={errors.size?.message}>
            <Controller
              control={control}
              name='size'
              render={({ field }) => (
                <Combobox
                  id='locker-edit-size'
                  label='Size'
                  value={field.value || undefined}
                  allLabel='Not set'
                  placeholder='Not set'
                  options={labelOptions(LOCKER_SIZE)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField id='locker-edit-block' label='Block' error={errors.block_id?.message}>
            <Controller
              control={control}
              name='block_id'
              render={({ field }) => (
                <BlockSelect
                  id='locker-edit-block'
                  hostelId={locker.hostel_id}
                  allLabel='No particular block'
                  value={field.value || undefined}
                  invalid={Boolean(errors.block_id)}
                  className='sm:w-full'
                  onChange={(value) => {
                    field.onChange(value ?? '')
                    setValue('room_id', '')
                  }}
                />
              )}
            />
          </FormField>
          <FormField id='locker-edit-room' label='Room' error={errors.room_id?.message}>
            <Controller
              control={control}
              name='room_id'
              render={({ field }) => (
                <RoomSelect
                  id='locker-edit-room'
                  hostelId={locker.hostel_id}
                  blockId={blockId ? Number(blockId) : undefined}
                  allLabel='Not in a room'
                  value={field.value || undefined}
                  invalid={Boolean(errors.room_id)}
                  className='sm:w-full'
                  initial={
                    locker.room_id && locker.room_no
                      ? { value: String(locker.room_id), label: locker.room_no }
                      : null
                  }
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='locker-edit-notes' label='Notes' error={errors.notes?.message}>
          <Textarea
            id='locker-edit-notes'
            rows={2}
            maxLength={255}
            aria-invalid={Boolean(errors.notes)}
            {...register('notes')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
