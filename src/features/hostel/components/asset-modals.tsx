import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
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
  type AssetApplyInput,
  type AssetApplyResult,
  type AssetCondition,
  type RoomAsset,
  type RoomAssetInput,
  type RoomAssetUpdateInput,
} from '../api-rooms'
import { toneOptions } from '../labels'
import { ASSET_CONDITION } from './asset-labels'
import { RoomSelect } from './asset-room-select'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { HostelSelect, RoomTypeSelect } from './pickers'
import { intInRange } from './setup-helpers'

const ADD_FORM_ID = 'hostel-asset-add-form'
const EDIT_FORM_ID = 'hostel-asset-edit-form'
const APPLY_FORM_ID = 'hostel-asset-apply-form'

const itemName = z.string().trim().min(2, 'At least 2 characters').max(80, 'Up to 80 characters')
const quantity = z.string().refine((value) => intInRange(value, 1, 500), 'A number, 1 to 500')
const condition = z.enum(['good', 'fair', 'damaged', 'missing'])
const notes = z.string().trim().max(255, 'Up to 255 characters')

const addSchema = z.object({
  hostel_id: z.string().min(1, 'Choose a hostel'),
  room_id: z.string().min(1, 'Choose a room'),
  item_name: itemName,
  quantity,
  condition,
  notes,
})
type AddValues = z.infer<typeof addSchema>

export interface AssetRoom {
  id: number
  hostel_id: number
  room_no: string
}

function ConditionField({
  id,
  value,
  onChange,
}: {
  id: string
  value: AssetCondition
  onChange: (value: AssetCondition) => void
}) {
  return (
    <Combobox
      id={id}
      label='Condition'
      value={value}
      placeholder='Choose condition'
      options={toneOptions(ASSET_CONDITION)}
      highlightSelected={false}
      className='sm:w-full'
      onChange={(next) => onChange((next ?? 'good') as AssetCondition)}
    />
  )
}

export function AddAssetModal({
  room,
  hostelId,
  onClose,
}: {
  room?: AssetRoom
  hostelId?: number
  onClose: () => void
}) {
  const save = useHostelMutation((input: { roomId: number; body: RoomAssetInput }) =>
    roomsApi.addRoomAsset(input.roomId, input.body)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      hostel_id: room ? String(room.hostel_id) : hostelId ? String(hostelId) : '',
      room_id: room ? String(room.id) : '',
      item_name: '',
      quantity: '1',
      condition: 'good',
      notes: '',
    },
  })
  const hostelValue = useWatch({ control, name: 'hostel_id' })

  const submit = handleSubmit(async (values) => {
    try {
      const asset = await save.mutateAsync({
        roomId: Number(values.room_id),
        body: {
          item_name: values.item_name,
          quantity: Number(values.quantity),
          condition: values.condition,
          notes: textOrNull(values.notes),
        },
      })
      alerts.success(`${asset.item_name} added to room ${asset.room_no}`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['room_id', 'item_name', 'quantity', 'condition', 'notes'], {
        HOSTEL_ROOM_NOT_FOUND: 'room_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={room ? `Add an item to room ${room.room_no}` : 'Add an item to a room'}
      description='Beds, cupboards, fans and other fittings kept in the room.'
      formId={ADD_FORM_ID}
      submitText='Add item'
      loading={save.isPending}
    >
      <form id={ADD_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        {!room && (
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              id='asset-add-hostel'
              label='Hostel'
              required
              error={errors.hostel_id?.message}
            >
              <Controller
                control={control}
                name='hostel_id'
                render={({ field }) => (
                  <HostelSelect
                    id='asset-add-hostel'
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
            <FormField id='asset-add-room' label='Room' required error={errors.room_id?.message}>
              <Controller
                control={control}
                name='room_id'
                render={({ field }) => (
                  <RoomSelect
                    id='asset-add-room'
                    hostelId={Number(hostelValue) || undefined}
                    value={field.value || undefined}
                    invalid={Boolean(errors.room_id)}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
          </div>
        )}
        <FormField id='asset-add-item' label='Item' required error={errors.item_name?.message}>
          <Input
            id='asset-add-item'
            autoComplete='off'
            maxLength={80}
            placeholder='Ceiling fan'
            aria-invalid={Boolean(errors.item_name)}
            {...register('item_name')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='asset-add-qty' label='Quantity' required error={errors.quantity?.message}>
            <Input
              id='asset-add-qty'
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.quantity)}
              {...register('quantity')}
            />
          </FormField>
          <FormField id='asset-add-condition' label='Condition' required>
            <Controller
              control={control}
              name='condition'
              render={({ field }) => (
                <ConditionField
                  id='asset-add-condition'
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='asset-add-notes' label='Notes' error={errors.notes?.message} hint='Optional'>
          <Textarea
            id='asset-add-notes'
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

const editSchema = z.object({ item_name: itemName, quantity, condition, notes })
type EditValues = z.infer<typeof editSchema>

export function EditAssetModal({ asset, onClose }: { asset: RoomAsset; onClose: () => void }) {
  const save = useHostelMutation((input: RoomAssetUpdateInput) =>
    roomsApi.updateAsset(asset.id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      item_name: asset.item_name,
      quantity: String(asset.quantity),
      condition: asset.condition,
      notes: asset.notes ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        item_name: values.item_name,
        quantity: Number(values.quantity),
        condition: values.condition,
        notes: textOrNull(values.notes),
      })
      alerts.success(`${values.item_name} updated`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['item_name', 'quantity', 'condition', 'notes'])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${asset.item_name}`}
      description={`Room ${asset.room_no} · ${asset.hostel_name}`}
      formId={EDIT_FORM_ID}
      submitText='Save changes'
      loading={save.isPending}
    >
      <form id={EDIT_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='asset-edit-item' label='Item' required error={errors.item_name?.message}>
          <Input
            id='asset-edit-item'
            autoComplete='off'
            maxLength={80}
            aria-invalid={Boolean(errors.item_name)}
            {...register('item_name')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='asset-edit-qty' label='Quantity' required error={errors.quantity?.message}>
            <Input
              id='asset-edit-qty'
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.quantity)}
              {...register('quantity')}
            />
          </FormField>
          <FormField id='asset-edit-condition' label='Condition' required>
            <Controller
              control={control}
              name='condition'
              render={({ field }) => (
                <ConditionField
                  id='asset-edit-condition'
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='asset-edit-notes' label='Notes' error={errors.notes?.message}>
          <Textarea
            id='asset-edit-notes'
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

const applySchema = z
  .object({
    hostel_id: z.string(),
    room_type_id: z.string(),
    items: z
      .array(z.object({ item_name: itemName, quantity }))
      .min(1, 'Add at least one item')
      .max(30, 'Up to 30 items'),
  })
  .refine((values) => values.hostel_id || values.room_type_id, {
    path: ['hostel_id'],
    message: 'Choose a hostel, a room type or both',
  })
type ApplyValues = z.infer<typeof applySchema>

const STANDARD_SET = [
  { item_name: 'Cot', quantity: '1' },
  { item_name: 'Mattress', quantity: '1' },
  { item_name: 'Cupboard', quantity: '1' },
  { item_name: 'Study table', quantity: '1' },
  { item_name: 'Chair', quantity: '1' },
]

export function ApplyAssetsModal({
  hostelId,
  onClose,
}: {
  hostelId?: number
  onClose: () => void
}) {
  const save = useHostelMutation((input: AssetApplyInput) => roomsApi.applyAssets(input))
  const [result, setResult] = useState<AssetApplyResult | null>(null)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={result ? 'Items added' : 'Apply a set to many rooms'}
      description={
        result
          ? undefined
          : 'Adds the same items to every matching room. Rooms that already have an item keep it.'
      }
      formId={result ? undefined : APPLY_FORM_ID}
      submitText='Add to rooms'
      loading={save.isPending}
      size='lg'
      footer={
        result ? (
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        ) : undefined
      }
    >
      {result ? (
        <p className='flex items-center gap-2 text-sm font-semibold'>
          <CheckCircle2 className='size-4 text-success' />
          {result.added} {result.added === 1 ? 'item' : 'items'} added across {result.rooms}{' '}
          {result.rooms === 1 ? 'room' : 'rooms'}
        </p>
      ) : (
        <ApplyAssetsForm
          hostelId={hostelId}
          onSubmit={async (input) => {
            const applied = await save.mutateAsync(input)
            alerts.success('Items added to rooms', {
              description: `${applied.added} added across ${applied.rooms} rooms`,
            })
            setResult(applied)
          }}
        />
      )}
    </AppModal>
  )
}

function ApplyAssetsForm({
  hostelId,
  onSubmit,
}: {
  hostelId?: number
  onSubmit: (input: AssetApplyInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      hostel_id: hostelId ? String(hostelId) : '',
      room_type_id: '',
      items: STANDARD_SET,
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        hostel_id: values.hostel_id ? Number(values.hostel_id) : undefined,
        room_type_id: values.room_type_id ? Number(values.room_type_id) : undefined,
        items: values.items.map((item) => ({
          item_name: item.item_name,
          quantity: Number(item.quantity),
        })),
      })
    } catch (error) {
      applyApiError(error, setError, ['hostel_id', 'room_type_id', 'items'], {
        HOSTEL_ROOM_NOT_FOUND: 'hostel_id',
      })
    }
  })

  return (
    <form id={APPLY_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
      <FormAlert message={errors.root?.message ?? errors.items?.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='asset-apply-hostel' label='Hostel' error={errors.hostel_id?.message}>
          <Controller
            control={control}
            name='hostel_id'
            render={({ field }) => (
              <HostelSelect
                id='asset-apply-hostel'
                allLabel='All hostels'
                value={field.value || undefined}
                invalid={Boolean(errors.hostel_id)}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='asset-apply-type' label='Room type' error={errors.room_type_id?.message}>
          <Controller
            control={control}
            name='room_type_id'
            render={({ field }) => (
              <RoomTypeSelect
                id='asset-apply-type'
                allLabel='Every room type'
                value={field.value || undefined}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      </div>

      <div className='grid gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-sm font-bold'>Items for each room</h3>
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={fields.length >= 30}
            onClick={() => append({ item_name: '', quantity: '1' })}
          >
            <Plus />
            Add item
          </Button>
        </div>
        <ul className='grid gap-2'>
          {fields.map((field, index) => (
            <li key={field.id} className='grid grid-cols-[1fr_5rem_auto] items-start gap-2'>
              <div className='grid gap-1'>
                <Input
                  aria-label={`Item ${index + 1}`}
                  autoComplete='off'
                  maxLength={80}
                  placeholder='Study table'
                  aria-invalid={Boolean(errors.items?.[index]?.item_name)}
                  {...register(`items.${index}.item_name`)}
                />
                {errors.items?.[index]?.item_name && (
                  <p role='alert' className='text-xs font-medium text-destructive'>
                    {errors.items[index]?.item_name?.message}
                  </p>
                )}
              </div>
              <div className='grid gap-1'>
                <Input
                  aria-label={`Quantity of item ${index + 1}`}
                  inputMode='numeric'
                  className='tabular'
                  aria-invalid={Boolean(errors.items?.[index]?.quantity)}
                  {...register(`items.${index}.quantity`)}
                />
                {errors.items?.[index]?.quantity && (
                  <p role='alert' className='text-xs font-medium text-destructive'>
                    {errors.items[index]?.quantity?.message}
                  </p>
                )}
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Remove item ${index + 1}`}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <InfoNote>New items are recorded in good condition. Matching is by item name.</InfoNote>
    </form>
  )
}
