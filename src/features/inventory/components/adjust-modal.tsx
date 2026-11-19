import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  ADJUSTMENT_REASONS,
  inventoryApi,
  useInventoryMutation,
  useStockItem,
  type StockItemDetail,
} from '../api'
import { ADJUSTMENT_REASON, blankToNull, options, qty } from '../labels'
import { StockItemPicker, StorePicker } from './pickers'
import { mapApiError, optionalMoneyField, quantityField } from './stock-form'
import { FormAlert } from './stock-lines'

const FORM_ID = 'stock-adjust-form'
const REASON_OPTIONS = options(ADJUSTMENT_REASON)

const schema = z.object({
  item_id: z.string().min(1, 'Choose the item'),
  item_label: z.string(),
  store_id: z.string().min(1, 'Choose the store'),
  direction: z.enum(['add', 'remove']),
  quantity: quantityField(),
  reason: z.enum(ADJUSTMENT_REASONS, { message: 'Choose a reason' }),
  note: z.string().trim().max(255, 'Keep it under 255 characters'),
  rate: optionalMoneyField,
})

type FormValues = z.infer<typeof schema>

export function AdjustStockModal({
  open,
  onOpenChange,
  itemId,
  storeId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: number
  storeId?: number
}) {
  const adjust = useInventoryMutation(inventoryApi.adjust)
  const item = useStockItem(open && itemId ? itemId : null)
  const ready = !itemId || !item.isPending
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Adjust stock'
      description='Correct the balance in a store: damaged, expired, a count correction or returned stock.'
      formId={FORM_ID}
      submitText='Save adjustment'
      loading={adjust.isPending}
    >
      {open && ready && (
        <AdjustForm
          item={item.data}
          itemId={itemId}
          storeId={storeId}
          onSubmit={async (values) => {
            const amount = Number(values.quantity)
            const movement = await adjust.mutateAsync({
              item_id: Number(values.item_id),
              store_id: Number(values.store_id),
              quantity: values.direction === 'add' ? amount : -amount,
              reason: values.reason,
              note: blankToNull(values.note),
              rate:
                values.direction === 'add' && values.rate.trim() ? Number(values.rate) : undefined,
            })
            alerts.success('Stock adjusted', {
              description: `${movement.item.name}: balance now ${qty(movement.balance_after, movement.unit)}`,
            })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function AdjustForm({
  item,
  itemId,
  storeId,
  onSubmit,
}: {
  item?: StockItemDetail
  itemId?: number
  storeId?: number
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      item_id: itemId ? String(itemId) : '',
      item_label: item?.name ?? '',
      store_id: storeId ? String(storeId) : '',
      direction: 'remove',
      quantity: '',
      reason: 'damaged',
      note: '',
      rate: '',
    },
  })
  const [direction, label] = useWatch({ control, name: ['direction', 'item_label'] })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, ['item_id', 'store_id', 'quantity', 'reason', 'note', 'rate'])
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='adjust-item' label='Item' required error={errors.item_id?.message}>
          <Controller
            control={control}
            name='item_id'
            render={({ field }) => (
              <StockItemPicker
                id='adjust-item'
                label='Item'
                value={field.value || undefined}
                initial={field.value ? { value: field.value, label } : null}
                invalid={Boolean(errors.item_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='adjust-store' label='Store' required error={errors.store_id?.message}>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='adjust-store'
                label='Store'
                value={field.value || undefined}
                invalid={Boolean(errors.store_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <div className='grid content-start gap-1.5'>
          <span className='text-xs font-semibold'>Change</span>
          <Controller
            control={control}
            name='direction'
            render={({ field }) => (
              <SegmentedControl
                label='Add or remove'
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'remove', label: 'Remove stock' },
                  { value: 'add', label: 'Add stock' },
                ]}
                className='justify-self-start'
              />
            )}
          />
        </div>
        <FormField id='adjust-qty' label='Quantity' required error={errors.quantity?.message}>
          <Input
            id='adjust-qty'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.quantity)}
            {...register('quantity')}
          />
        </FormField>
        <FormField id='adjust-reason' label='Reason' required error={errors.reason?.message}>
          <Controller
            control={control}
            name='reason'
            render={({ field }) => (
              <Combobox
                id='adjust-reason'
                label='Reason'
                value={field.value}
                options={REASON_OPTIONS}
                placeholder='Choose a reason'
                searchPlaceholder='Search reasons'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => value && field.onChange(value)}
              />
            )}
          />
        </FormField>
        {direction === 'add' && (
          <FormField
            id='adjust-rate'
            label='Rate per unit'
            hint='Leave empty to use the average cost'
            error={errors.rate?.message}
          >
            <Input
              id='adjust-rate'
              inputMode='decimal'
              className='tabular'
              aria-invalid={Boolean(errors.rate)}
              {...register('rate')}
            />
          </FormField>
        )}
        <FormField
          id='adjust-note'
          label='Note'
          error={errors.note?.message}
          className='sm:col-span-2'
        >
          <Input id='adjust-note' autoComplete='off' {...register('note')} />
        </FormField>
      </div>
    </form>
  )
}
