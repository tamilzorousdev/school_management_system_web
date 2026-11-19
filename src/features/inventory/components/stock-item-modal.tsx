import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { inventoryApi, STOCK_UNITS, useInventoryMutation, type StockItem } from '../api'
import { blankToNull, blankToUndefined, STOCK_UNIT_OPTIONS } from '../labels'
import { CategoryPicker } from './pickers'
import { mapApiError, zeroOrMoreField } from './stock-form'
import { FormAlert } from './stock-lines'

const FORM_ID = 'stock-item-form'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the item name').max(120, 'Keep it under 120 characters'),
  code: z.string().trim().max(30, 'Keep it under 30 characters'),
  category_id: z.string().min(1, 'Choose a stock category'),
  unit: z.enum(STOCK_UNITS),
  reorder_level: zeroOrMoreField('Enter 0 or more'),
  description: z.string().trim().max(255, 'Keep it under 255 characters'),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function StockItemModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: StockItem | null
}) {
  const editing = Boolean(item)
  const save = useInventoryMutation((values: FormValues) => {
    const input = {
      name: values.name,
      code: blankToUndefined(values.code)?.toUpperCase(),
      category_id: Number(values.category_id),
      unit: values.unit,
      reorder_level: Number(values.reorder_level),
      description: blankToNull(values.description),
      is_active: values.is_active,
    }
    return item ? inventoryApi.updateStockItem(item.id, input) : inventoryApi.createStockItem(input)
  })
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit stock item' : 'Add stock item'}
      description='Consumables kept in the stores: paper, chalk, lab chemicals, cleaning supplies.'
      formId={FORM_ID}
      submitText={editing ? 'Save' : 'Add item'}
      loading={save.isPending}
    >
      {open && (
        <StockItemForm
          item={item ?? null}
          onSubmit={async (values) => {
            const saved = await save.mutateAsync(values)
            alerts.success(editing ? 'Item saved' : 'Item added', { description: saved.name })
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function StockItemForm({
  item,
  onSubmit,
}: {
  item: StockItem | null
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
      name: item?.name ?? '',
      code: item?.code ?? '',
      category_id: item ? String(item.category.id) : '',
      unit: item?.unit ?? 'pcs',
      reorder_level: item ? String(item.reorder_level) : '0',
      description: item?.description ?? '',
      is_active: item?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      mapApiError(
        error,
        setError,
        ['name', 'code', 'category_id', 'unit', 'reorder_level', 'description', 'is_active'],
        { ITEM_EXISTS: 'code' }
      )
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='item-name' label='Name' required error={errors.name?.message}>
          <Input
            id='item-name'
            autoFocus
            autoComplete='off'
            placeholder='A4 paper (75 gsm)'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField
          id='item-code'
          label='Code'
          hint='Made from the name when left empty'
          error={errors.code?.message}
        >
          <Input
            id='item-code'
            autoComplete='off'
            placeholder='PAP-A4'
            className='uppercase'
            aria-invalid={Boolean(errors.code)}
            {...register('code')}
          />
        </FormField>
        <FormField id='item-category' label='Category' required error={errors.category_id?.message}>
          <Controller
            control={control}
            name='category_id'
            render={({ field }) => (
              <CategoryPicker
                id='item-category'
                label='Category'
                kind='stock'
                value={field.value || undefined}
                invalid={Boolean(errors.category_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='item-unit' label='Unit' required error={errors.unit?.message}>
          <Controller
            control={control}
            name='unit'
            render={({ field }) => (
              <Combobox
                id='item-unit'
                label='Unit'
                value={field.value}
                options={STOCK_UNIT_OPTIONS}
                placeholder='Choose a unit'
                searchPlaceholder='Search units'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => value && field.onChange(value)}
              />
            )}
          />
        </FormField>
        <FormField
          id='item-reorder'
          label='Reorder level'
          hint='Shown as low stock at or below this'
          error={errors.reorder_level?.message}
        >
          <Input
            id='item-reorder'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.reorder_level)}
            {...register('reorder_level')}
          />
        </FormField>
        <Controller
          control={control}
          name='is_active'
          render={({ field }) => (
            <div className='flex items-center justify-between gap-4 self-end rounded-lg border bg-muted/40 px-3 py-2'>
              <label htmlFor='item-active' className='text-sm font-semibold'>
                In use
              </label>
              <Switch id='item-active' checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        <FormField
          id='item-description'
          label='Description'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea id='item-description' {...register('description')} />
        </FormField>
      </div>
    </form>
  )
}
