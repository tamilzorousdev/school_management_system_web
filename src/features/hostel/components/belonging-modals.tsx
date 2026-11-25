import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import {
  roomsApi,
  type Belonging,
  type BelongingInput,
  type BelongingStatus,
  type BelongingUpdateInput,
} from '../api-rooms'
import { toneOptions } from '../labels'
import { BELONGING_STATUS } from './asset-labels'
import { FormAlert } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'
import { intInRange } from './setup-helpers'

const ADD_FORM_ID = 'hostel-belonging-add-form'
const EDIT_FORM_ID = 'hostel-belonging-edit-form'

const addSchema = z.object({
  item: z.string().trim().min(2, 'At least 2 characters').max(80, 'Up to 80 characters'),
  description: z.string().trim().max(255, 'Up to 255 characters'),
  serial_no: z.string().trim().max(60, 'Up to 60 characters'),
  quantity: z.string().refine((value) => intInRange(value, 1, 100), 'A number, 1 to 100'),
  declared_on: z.string(),
  notes: z.string().trim().max(255, 'Up to 255 characters'),
})
type AddValues = z.infer<typeof addSchema>

export function AddBelongingModal({
  admissionId,
  studentName,
  onClose,
}: {
  admissionId: number
  studentName: string
  onClose: () => void
}) {
  const save = useHostelMutation((input: BelongingInput) =>
    roomsApi.addBelonging(admissionId, input)
  )
  const today = todayIso()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      item: '',
      description: '',
      serial_no: '',
      quantity: '1',
      declared_on: today,
      notes: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    if (values.declared_on && values.declared_on > today) {
      setError('declared_on', { message: 'Cannot be in the future' })
      return
    }
    try {
      const saved = await save.mutateAsync({
        item: values.item,
        description: textOrNull(values.description),
        serial_no: textOrNull(values.serial_no),
        quantity: Number(values.quantity),
        declared_on: values.declared_on || undefined,
        notes: textOrNull(values.notes),
      })
      alerts.success(`${saved.item} recorded`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, [
        'item',
        'description',
        'serial_no',
        'quantity',
        'declared_on',
        'notes',
      ])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Record a belonging'
      description={`A valuable ${studentName} keeps in the hostel: phone, laptop, cycle…`}
      formId={ADD_FORM_ID}
      submitText='Record item'
      loading={save.isPending}
    >
      <form id={ADD_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-[1fr_6rem]'>
          <FormField id='belonging-item' label='Item' required error={errors.item?.message}>
            <Input
              id='belonging-item'
              autoComplete='off'
              maxLength={80}
              placeholder='Laptop'
              aria-invalid={Boolean(errors.item)}
              {...register('item')}
            />
          </FormField>
          <FormField id='belonging-qty' label='Quantity' required error={errors.quantity?.message}>
            <Input
              id='belonging-qty'
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.quantity)}
              {...register('quantity')}
            />
          </FormField>
        </div>
        <FormField
          id='belonging-description'
          label='Description'
          error={errors.description?.message}
        >
          <Input
            id='belonging-description'
            autoComplete='off'
            maxLength={255}
            placeholder='Dell Inspiron, black'
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='belonging-serial' label='Serial number' error={errors.serial_no?.message}>
            <Input
              id='belonging-serial'
              autoComplete='off'
              maxLength={60}
              className='font-mono'
              aria-invalid={Boolean(errors.serial_no)}
              {...register('serial_no')}
            />
          </FormField>
          <FormField id='belonging-date' label='Declared on' error={errors.declared_on?.message}>
            <Controller
              control={control}
              name='declared_on'
              render={({ field }) => (
                <DatePicker
                  id='belonging-date'
                  value={field.value}
                  max={today}
                  invalid={Boolean(errors.declared_on)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='belonging-notes' label='Notes' error={errors.notes?.message} hint='Optional'>
          <Textarea
            id='belonging-notes'
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

const editSchema = z.object({
  status: z.enum(['with_student', 'returned_home', 'lost', 'confiscated']),
  notes: z.string().trim().max(255, 'Up to 255 characters'),
})
type EditValues = z.infer<typeof editSchema>

export function EditBelongingModal({
  belonging,
  onClose,
}: {
  belonging: Belonging
  onClose: () => void
}) {
  const save = useHostelMutation((input: BelongingUpdateInput) =>
    roomsApi.updateBelonging(belonging.id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { status: belonging.status, notes: belonging.notes ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ status: values.status, notes: textOrNull(values.notes) })
      alerts.success(`${belonging.item}: ${BELONGING_STATUS[values.status].label}`)
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['status', 'notes'])
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Update ${belonging.item}`}
      formId={EDIT_FORM_ID}
      submitText='Save changes'
      loading={save.isPending}
      size='sm'
    >
      <form id={EDIT_FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='belonging-status' label='Status' required error={errors.status?.message}>
          <Controller
            control={control}
            name='status'
            render={({ field }) => (
              <Combobox
                id='belonging-status'
                label='Status'
                value={field.value}
                placeholder='Choose status'
                options={toneOptions(BELONGING_STATUS)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange((value ?? belonging.status) as BelongingStatus)}
              />
            )}
          />
        </FormField>
        <FormField id='belonging-edit-notes' label='Notes' error={errors.notes?.message}>
          <Textarea
            id='belonging-edit-notes'
            rows={3}
            maxLength={255}
            placeholder='Taken home on 12 Jul'
            aria-invalid={Boolean(errors.notes)}
            {...register('notes')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
