import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Printer } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  inventoryApi,
  inventoryFiles,
  useInventoryMutation,
  type Asset,
  type AssetCondition,
  type AssetCreateInput,
  type AssetInput,
  type FundingSource,
} from '../api'
import {
  ASSET_CONDITION_OPTIONS,
  blankToNull,
  blankToUndefined,
  FUNDING_OPTIONS,
  idOrNull,
  openInventoryFile,
  stringId,
  toNumber,
} from '../labels'
import { FileSlot, type FileSlotValue } from './asset-file-slot'
import { FormError, SwitchRow } from './asset-shared'
import { CategoryPicker, LocationPicker, StorePicker, VendorPicker } from './pickers'

const FORM_ID = 'asset-form'
const DATE = /^\d{4}-\d{2}-\d{2}$/

const money = (label: string, max = 100000000) =>
  z
    .string()
    .trim()
    .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), `Enter the ${label} in rupees`)
    .refine((value) => !value || Number(value) <= max, `Enter up to ${max.toLocaleString('en-IN')}`)

const optionalText = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`)

const optionalDate = z.string().refine((value) => !value || DATE.test(value), 'Choose a date')

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter the asset name').max(120, 'Keep it under 120 characters'),
    category_id: z.string().min(1, 'Choose a category'),
    make: optionalText(60),
    model: optionalText(60),
    serial_no: optionalText(80),
    serial_nos: z.string(),
    description: optionalText(500),
    vendor_id: z.string().optional(),
    invoice_no: optionalText(40),
    purchase_date: optionalDate,
    cost: money('cost'),
    residual_value: money('residual value'),
    warranty_until: optionalDate,
    amc_until: optionalDate,
    amc_vendor_id: z.string().optional(),
    funding_source: z.enum(['school', 'government', 'donation', 'pta', 'other']),
    condition: z.enum(['new', 'good', 'fair', 'poor', 'damaged']),
    location_id: z.string().optional(),
    store_id: z.string().optional(),
    notes: optionalText(500),
    quantity: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 200, {
        message: 'Enter a number from 1 to 200',
      }),
    schedule_maintenance: z.boolean(),
  })
  .superRefine((values, context) => {
    const lines = serialLines(values.serial_nos)
    const quantity = Number(values.quantity)
    if (quantity > 1 && lines.length > quantity) {
      context.addIssue({
        code: 'custom',
        path: ['serial_nos'],
        message: `Enter at most ${quantity} serial numbers`,
      })
    }
    if (new Set(lines).size !== lines.length) {
      context.addIssue({ code: 'custom', path: ['serial_nos'], message: 'Serial numbers repeat' })
    }
    if (lines.some((line) => line.length > 80)) {
      context.addIssue({
        code: 'custom',
        path: ['serial_nos'],
        message: 'Each serial number must be 80 characters or less',
      })
    }
    const cost = toNumber(values.cost)
    const residual = toNumber(values.residual_value)
    if (cost !== null && residual !== null && residual > cost) {
      context.addIssue({
        code: 'custom',
        path: ['residual_value'],
        message: 'Residual value cannot be more than the cost',
      })
    }
  })

type FormValues = z.infer<typeof schema>

function serialLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function AssetFormModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset | null
}) {
  const { open, onOpenChange, asset } = props
  const editing = Boolean(asset)
  const [created, setCreated] = useState<Asset[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const save = useInventoryMutation(({ id, input }: { id?: number; input: AssetCreateInput }) =>
    id
      ? inventoryApi.updateAsset(id, input).then((item) => [item])
      : inventoryApi.createAssets(input).then((result) => result.assets)
  )

  const change = (next: boolean) => {
    if (!next) setCreated(null)
    onOpenChange(next)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={change}
      title={created ? 'Assets registered' : editing ? 'Edit asset' : 'Register assets'}
      description={
        created
          ? 'Each asset has its own tag. Print the labels and stick them on.'
          : editing
            ? 'Status changes through allocate, maintenance, lost and dispose.'
            : 'One asset, or many identical ones at once. Each gets its own tag.'
      }
      formId={created ? undefined : FORM_ID}
      submitText={editing ? 'Save changes' : 'Register'}
      loading={save.isPending || uploading}
      size='xl'
      footer={
        created ? (
          <DialogFooter>
            <Button variant='outline' onClick={() => change(false)}>
              Done
            </Button>
            <Button
              onClick={() =>
                openInventoryFile(
                  inventoryFiles.labels,
                  inventoryFiles.labelsParams({ asset_ids: created.map((item) => item.id) })
                )
              }
            >
              <Printer />
              Print {created.length === 1 ? 'label' : `${created.length} labels`}
            </Button>
          </DialogFooter>
        ) : undefined
      }
    >
      {created ? (
        <CreatedList assets={created} />
      ) : (
        open && (
          <AssetForm
            key={asset?.id ?? 'new'}
            asset={asset ?? null}
            onUploadingChange={setUploading}
            onSubmit={async (input) => {
              const result = await save.mutateAsync({ id: asset?.id, input })
              if (asset) {
                alerts.success('Asset saved')
                change(false)
              } else {
                alerts.success(
                  `${result.length} ${result.length === 1 ? 'asset' : 'assets'} registered`
                )
                setCreated(result)
              }
            }}
          />
        )
      )}
    </AppModal>
  )
}

function CreatedList({ assets }: { assets: Asset[] }) {
  return (
    <div className='grid gap-3'>
      <p className='flex items-center gap-2 text-sm font-semibold text-success'>
        <CheckCircle2 className='size-4' />
        {assets.length} {assets.length === 1 ? 'asset' : 'assets'} added to the register
      </p>
      <ul className='grid max-h-72 gap-1 overflow-y-auto rounded-lg border p-2'>
        {assets.map((item) => (
          <li key={item.id} className='flex min-w-0 items-center justify-between gap-2 text-sm'>
            <span className='truncate font-mono text-xs'>{item.asset_tag}</span>
            <span className='truncate text-muted-foreground'>{item.serial_no ?? item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const FIELD_NAMES: (keyof FormValues)[] = [
  'name',
  'category_id',
  'make',
  'model',
  'serial_no',
  'serial_nos',
  'description',
  'vendor_id',
  'invoice_no',
  'purchase_date',
  'cost',
  'residual_value',
  'warranty_until',
  'amc_until',
  'amc_vendor_id',
  'funding_source',
  'condition',
  'location_id',
  'store_id',
  'notes',
  'quantity',
]

function AssetForm({
  asset,
  onSubmit,
  onUploadingChange,
}: {
  asset: Asset | null
  onSubmit: (input: AssetCreateInput) => Promise<void>
  onUploadingChange: (busy: boolean) => void
}) {
  const editing = Boolean(asset)
  const [invoice, setInvoice] = useState<FileSlotValue | null>(
    asset?.invoice_file_id ? { id: asset.invoice_file_id, name: 'Current invoice' } : null
  )
  const [photo, setPhoto] = useState<FileSlotValue | null>(
    asset?.photo_file_id ? { id: asset.photo_file_id, name: 'Current photo' } : null
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: asset?.name ?? '',
      category_id: stringId(asset?.category.id) ?? '',
      make: asset?.make ?? '',
      model: asset?.model ?? '',
      serial_no: asset?.serial_no ?? '',
      serial_nos: '',
      description: asset?.description ?? '',
      vendor_id: stringId(asset?.vendor?.id),
      invoice_no: asset?.invoice_no ?? '',
      purchase_date: asset?.purchase_date ?? '',
      cost: asset?.cost === null || asset?.cost === undefined ? '' : String(asset.cost),
      residual_value:
        asset?.residual_value === null || asset?.residual_value === undefined
          ? ''
          : String(asset.residual_value),
      warranty_until: asset?.warranty_until ?? '',
      amc_until: asset?.amc_until ?? '',
      amc_vendor_id: stringId(asset?.amc_vendor?.id),
      funding_source: asset?.funding_source ?? 'school',
      condition: asset?.condition ?? 'new',
      location_id: stringId(asset?.location?.id),
      store_id: stringId(asset?.store?.id),
      notes: asset?.notes ?? '',
      quantity: '1',
      schedule_maintenance: false,
    },
  })
  const quantity = Number(useWatch({ control, name: 'quantity' })) || 1
  const bulk = !editing && quantity > 1

  const submit = handleSubmit(async (values) => {
    const date = (value: string | undefined) =>
      editing ? blankToNull(value) : blankToUndefined(value)
    const base: AssetInput = {
      name: values.name.trim(),
      category_id: Number(values.category_id),
      make: blankToNull(values.make),
      model: blankToNull(values.model),
      description: blankToNull(values.description),
      vendor_id: idOrNull(values.vendor_id),
      invoice_no: blankToNull(values.invoice_no),
      invoice_file_id: invoice?.id ?? null,
      purchase_date: date(values.purchase_date),
      cost: toNumber(values.cost),
      residual_value: toNumber(values.residual_value),
      warranty_until: date(values.warranty_until),
      amc_until: date(values.amc_until),
      amc_vendor_id: idOrNull(values.amc_vendor_id),
      funding_source: values.funding_source,
      condition: values.condition,
      location_id: idOrNull(values.location_id),
      store_id: idOrNull(values.store_id),
      photo_file_id: photo?.id ?? null,
      notes: blankToNull(values.notes),
    }
    const input: AssetCreateInput = editing
      ? { ...base, serial_no: blankToNull(values.serial_no) }
      : bulk
        ? {
            ...base,
            quantity,
            serial_nos: serialLines(values.serial_nos).length
              ? serialLines(values.serial_nos)
              : undefined,
            schedule_maintenance: values.schedule_maintenance || undefined,
          }
        : {
            ...base,
            serial_no: blankToNull(values.serial_no),
            quantity: 1,
            schedule_maintenance: values.schedule_maintenance || undefined,
          }
    try {
      await onSubmit(input)
    } catch (caught) {
      const apiError = toApiError(caught)
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const field = FIELD_NAMES.find((name) => fieldError.field.startsWith(name))
        if (field) {
          setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-5'>
      <FormError message={errors.root?.message} />
      <Section title='What it is'>
        <FormField id='asset-name' label='Name' required error={errors.name?.message}>
          <Input
            id='asset-name'
            autoFocus
            placeholder='Dell Latitude 3440'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField
          id='asset-category'
          label='Category'
          required
          error={errors.category_id?.message}
        >
          <Controller
            control={control}
            name='category_id'
            render={({ field }) => (
              <CategoryPicker
                id='asset-category'
                label='Category'
                kind='asset'
                value={field.value || undefined}
                invalid={Boolean(errors.category_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='asset-make' label='Make' error={errors.make?.message}>
          <Input id='asset-make' placeholder='Dell' {...register('make')} />
        </FormField>
        <FormField id='asset-model' label='Model' error={errors.model?.message}>
          <Input id='asset-model' placeholder='Latitude 3440' {...register('model')} />
        </FormField>
        {!editing && (
          <FormField
            id='asset-quantity'
            label='How many'
            hint='Identical assets, each with its own tag'
            error={errors.quantity?.message}
          >
            <Input
              id='asset-quantity'
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.quantity)}
              {...register('quantity')}
            />
          </FormField>
        )}
        {bulk ? (
          <FormField
            id='asset-serials'
            label='Serial numbers'
            hint={`Optional, one per line, up to ${quantity}`}
            error={errors.serial_nos?.message}
            className='sm:col-span-2'
          >
            <Textarea
              id='asset-serials'
              className='font-mono'
              placeholder={'5CD1234ABC\n5CD1234ABD'}
              aria-invalid={Boolean(errors.serial_nos)}
              {...register('serial_nos')}
            />
          </FormField>
        ) : (
          <FormField id='asset-serial' label='Serial number' error={errors.serial_no?.message}>
            <Input id='asset-serial' className='font-mono' {...register('serial_no')} />
          </FormField>
        )}
        <FormField
          id='asset-description'
          label='Description'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea
            id='asset-description'
            placeholder='i5, 16 GB RAM, 512 GB SSD'
            {...register('description')}
          />
        </FormField>
      </Section>

      <Section title='Purchase'>
        <FormField id='asset-vendor' label='Vendor'>
          <Controller
            control={control}
            name='vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='asset-vendor'
                label='Vendor'
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField id='asset-invoice-no' label='Invoice number' error={errors.invoice_no?.message}>
          <Input id='asset-invoice-no' {...register('invoice_no')} />
        </FormField>
        <FormField
          id='asset-purchase-date'
          label='Purchase date'
          error={errors.purchase_date?.message}
        >
          <Input id='asset-purchase-date' type='date' {...register('purchase_date')} />
        </FormField>
        <FormField
          id='asset-cost'
          label={bulk ? 'Cost of each (₹)' : 'Cost (₹)'}
          error={errors.cost?.message}
        >
          <Input
            id='asset-cost'
            inputMode='decimal'
            className='tabular'
            placeholder='52000'
            aria-invalid={Boolean(errors.cost)}
            {...register('cost')}
          />
        </FormField>
        <FormField
          id='asset-residual'
          label='Residual value (₹)'
          hint='Value at the end of its life'
          error={errors.residual_value?.message}
        >
          <Input
            id='asset-residual'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.residual_value)}
            {...register('residual_value')}
          />
        </FormField>
        <FormField id='asset-funding' label='Funded by'>
          <Controller
            control={control}
            name='funding_source'
            render={({ field }) => (
              <Combobox
                id='asset-funding'
                label='Funded by'
                value={field.value}
                options={FUNDING_OPTIONS}
                placeholder='Choose'
                searchPlaceholder='Search'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange((value as FundingSource) ?? 'school')}
              />
            )}
          />
        </FormField>
        <FormField id='asset-invoice-file' label='Invoice copy' className='sm:col-span-2'>
          <FileSlot
            id='asset-invoice-file'
            purpose='asset_invoice'
            accept='application/pdf,image/jpeg,image/png,image/webp'
            kind='document'
            value={invoice}
            onChange={setInvoice}
            onBusyChange={onUploadingChange}
          />
        </FormField>
      </Section>

      <Section title='Warranty and AMC'>
        <FormField
          id='asset-warranty'
          label='Warranty until'
          error={errors.warranty_until?.message}
        >
          <Input id='asset-warranty' type='date' {...register('warranty_until')} />
        </FormField>
        <FormField id='asset-amc' label='AMC until' error={errors.amc_until?.message}>
          <Input id='asset-amc' type='date' {...register('amc_until')} />
        </FormField>
        <FormField id='asset-amc-vendor' label='AMC vendor'>
          <Controller
            control={control}
            name='amc_vendor_id'
            render={({ field }) => (
              <VendorPicker
                id='asset-amc-vendor'
                label='AMC vendor'
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
      </Section>

      <Section title='Where it is kept'>
        <FormField id='asset-condition' label='Condition'>
          <Controller
            control={control}
            name='condition'
            render={({ field }) => (
              <Combobox
                id='asset-condition'
                label='Condition'
                value={field.value}
                options={ASSET_CONDITION_OPTIONS}
                placeholder='Choose'
                searchPlaceholder='Search'
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange((value as AssetCondition) ?? 'new')}
              />
            )}
          />
        </FormField>
        <FormField id='asset-store' label='Store'>
          <Controller
            control={control}
            name='store_id'
            render={({ field }) => (
              <StorePicker
                id='asset-store'
                label='Store'
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField id='asset-location' label='Location' hint='Where it is kept while in store'>
          <Controller
            control={control}
            name='location_id'
            render={({ field }) => (
              <LocationPicker
                id='asset-location'
                label='Location'
                value={field.value}
                initial={
                  asset?.location
                    ? { value: String(asset.location.id), label: asset.location.name }
                    : null
                }
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
        <FormField id='asset-photo' label='Photo'>
          <FileSlot
            id='asset-photo'
            purpose='asset_photo'
            accept='image/jpeg,image/png,image/webp'
            kind='image'
            value={photo}
            onChange={setPhoto}
            onBusyChange={onUploadingChange}
          />
        </FormField>
        <FormField
          id='asset-notes'
          label='Notes'
          error={errors.notes?.message}
          className='sm:col-span-2'
        >
          <Textarea id='asset-notes' {...register('notes')} />
        </FormField>
      </Section>

      {!editing && (
        <Controller
          control={control}
          name='schedule_maintenance'
          render={({ field }) => (
            <SwitchRow
              id='asset-schedule'
              label='Schedule preventive maintenance'
              description='Uses the maintenance interval of the category.'
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className='grid gap-3'>
      <legend className='mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {title}
      </legend>
      <div className='grid gap-4 sm:grid-cols-2'>{children}</div>
    </fieldset>
  )
}
