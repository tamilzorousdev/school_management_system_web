import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { inventoryApi, useInventoryMutation, useStockItem, type StockItemDetail } from '../api'
import { blankToNull, blankToUndefined, money, today } from '../labels'
import { StorePicker, VendorPicker } from './pickers'
import {
  emptyLine,
  lineMessages,
  listMessage,
  mapApiError,
  optionalDateField,
  rateLinesField,
} from './stock-form'
import { FormAlert, StockLinesEditor } from './stock-lines'

const FORM_ID = 'stock-receive-form'

const schema = z.object({
  store_id: z.string().min(1, 'Choose the store'),
  vendor_id: z.string(),
  invoice_no: z.string().trim().max(40, 'Keep it under 40 characters'),
  invoice_date: optionalDateField,
  received_on: optionalDateField,
  notes: z.string().trim().max(255, 'Keep it under 255 characters'),
  lines: rateLinesField,
})

type FormValues = z.infer<typeof schema>

export function ReceiveStockModal({
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
  const receive = useInventoryMutation(inventoryApi.receive)
  const item = useStockItem(open && itemId ? itemId : null)
  const ready = !itemId || !item.isPending
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Receive stock'
      description='Goods received into a store. The average cost of each item is updated.'
      formId={FORM_ID}
      submitText='Receive stock'
      loading={receive.isPending}
      size='lg'
    >
      {open && ready && (
        <ReceiveForm
          item={item.data}
          itemId={itemId}
          storeId={storeId}
          onSubmit={async (values) => {
            const receipt = await receive.mutateAsync({
              store_id: Number(values.store_id),
              vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
              invoice_no: blankToNull(values.invoice_no),
              invoice_date: blankToUndefined(values.invoice_date),
              received_on: blankToUndefined(values.received_on),
              notes: blankToNull(values.notes),
              lines: values.lines.map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity),
                rate: Number(line.rate),
              })),
            })
            alerts.success('Stock received', {
              description: `${receipt.receipt_no} · ${money(receipt.total)}`,
            })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ReceiveForm({
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
      store_id: storeId ? String(storeId) : '',
      vendor_id: '',
      invoice_no: '',
      invoice_date: '',
      received_on: today(),
      notes: '',
      lines: [
        {
          ...emptyLine(itemId ? { id: itemId, name: item?.name ?? '' } : undefined),
          rate: item?.average_rate ? String(item.average_rate) : '',
        },
      ],
    },
  })
  const store = useWatch({ control, name: 'store_id' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(error, setError, [
        'store_id',
        'vendor_id',
        'invoice_no',
        'invoice_date',
        'received_on',
        'notes',
        'lines',
      ])
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='receive-store' label='Store' required error={errors.store_id?.message}>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='receive-store'
                label='Store'
                value={field.value || undefined}
                invalid={Boolean(errors.store_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='receive-vendor' label='Vendor' error={errors.vendor_id?.message}>
          <Controller
            control={control}
            name='vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='receive-vendor'
                label='Vendor'
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='receive-invoice' label='Invoice number' error={errors.invoice_no?.message}>
          <Input id='receive-invoice' autoComplete='off' {...register('invoice_no')} />
        </FormField>
        <FormField
          id='receive-invoice-date'
          label='Invoice date'
          error={errors.invoice_date?.message}
        >
          <Controller
            control={control}
            name='invoice_date'
            render={({ field }) => (
              <Input
                id='receive-invoice-date'
                type='date'
                name={field.name}
                value={field.value}
                max={today()}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField id='receive-on' label='Received on' error={errors.received_on?.message}>
          <Controller
            control={control}
            name='received_on'
            render={({ field }) => (
              <Input
                id='receive-on'
                type='date'
                name={field.name}
                value={field.value}
                max={today()}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField id='receive-notes' label='Notes' error={errors.notes?.message}>
          <Input id='receive-notes' autoComplete='off' {...register('notes')} />
        </FormField>
      </div>
      <Controller
        control={control}
        name='lines'
        render={({ field }) => (
          <StockLinesEditor
            idPrefix='receive'
            value={field.value}
            onChange={field.onChange}
            storeId={store ? Number(store) : undefined}
            withRate
            errors={lineMessages(errors.lines)}
            listError={listMessage(errors.lines)}
          />
        )}
      />
    </form>
  )
}
