import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  maintenanceApi,
  useMaintenanceMutation,
  type Vendor,
  type VendorInput,
  type VendorKind,
} from '../api'
import { VENDOR_KIND_OPTIONS } from '../labels'
import { applyFieldErrors } from '../helpers'
import { FormAlert } from './shared'

const FORM_ID = 'vendor-form'
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/

const schema = z.object({
  kind: z.string().min(1, 'Choose the kind'),
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(100, 'Name must be 100 characters or less'),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9+\- ]{6,15}$/.test(value), 'Enter 6 to 15 digits'),
  gst_no: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || GSTIN.test(value.toUpperCase()),
      'Enter a valid 15-character GSTIN'
    ),
  address: z.string().trim().max(200, 'Address must be 200 characters or less'),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = ['kind', 'name', 'phone', 'gst_no', 'address', 'is_active']

interface VendorFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: Vendor | null
}

export function VendorFormModal({ open, onOpenChange, vendor }: VendorFormModalProps) {
  const save = useMaintenanceMutation((input: VendorInput) =>
    vendor ? maintenanceApi.updateVendor(vendor.id, input) : maintenanceApi.createVendor(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={vendor ? 'Edit garage or station' : 'Add garage or fuel station'}
      description='Saved here, they can be picked in services, fuel entries and expenses.'
      formId={FORM_ID}
      submitText={vendor ? 'Save changes' : 'Add'}
      loading={save.isPending}
    >
      {open && (
        <VendorForm
          key={vendor?.id ?? 'new'}
          vendor={vendor}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(vendor ? 'Saved' : 'Added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function VendorForm({
  vendor,
  onSubmit,
}: {
  vendor: Vendor | null
  onSubmit: (input: VendorInput) => Promise<void>
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
      kind: vendor?.kind ?? 'garage',
      name: vendor?.name ?? '',
      phone: vendor?.phone ?? '',
      gst_no: vendor?.gst_no ?? '',
      address: vendor?.address ?? '',
      is_active: vendor?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    const clear = vendor ? null : undefined
    const input: VendorInput = {
      name: values.name,
      phone: values.phone || clear,
      gst_no: values.gst_no.toUpperCase() || clear,
      address: values.address || clear,
      is_active: values.is_active,
    }
    if (!vendor) input.kind = values.kind as VendorKind
    try {
      await onSubmit(input)
    } catch (error) {
      const apiError = toApiError(error)
      if (!applyFieldErrors(apiError, FIELDS, setError))
        setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='vendor-kind' label='Kind' required error={errors.kind?.message}>
        <Controller
          control={control}
          name='kind'
          render={({ field }) =>
            vendor ? (
              <Input
                id='vendor-kind'
                value={VENDOR_KIND_OPTIONS.find((option) => option.value === vendor.kind)?.label}
                disabled
                readOnly
              />
            ) : (
              <Combobox
                id='vendor-kind'
                label='Kind'
                value={field.value || undefined}
                options={VENDOR_KIND_OPTIONS}
                placeholder='Choose the kind'
                searchPlaceholder='Search kinds'
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.kind)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )
          }
        />
      </FormField>
      <FormField id='vendor-name' label='Name' required error={errors.name?.message}>
        <Input
          id='vendor-name'
          autoFocus
          maxLength={100}
          placeholder='Sri Murugan Motors'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField id='vendor-phone' label='Phone' error={errors.phone?.message}>
        <Input
          id='vendor-phone'
          inputMode='tel'
          maxLength={15}
          placeholder='9876500011'
          aria-invalid={Boolean(errors.phone) || undefined}
          {...register('phone')}
        />
      </FormField>
      <FormField id='vendor-gst' label='GSTIN' error={errors.gst_no?.message}>
        <Input
          id='vendor-gst'
          maxLength={15}
          placeholder='33ABCDE1234F1Z5'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.gst_no) || undefined}
          {...register('gst_no')}
        />
      </FormField>
      <FormField
        id='vendor-address'
        label='Address'
        error={errors.address?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='vendor-address'
          rows={2}
          maxLength={200}
          placeholder='Anna Nagar, Chennai'
          aria-invalid={Boolean(errors.address) || undefined}
          {...register('address')}
        />
      </FormField>
      <FormField id='vendor-active' label='Active' className='sm:col-span-2'>
        <Controller
          control={control}
          name='is_active'
          render={({ field }) => (
            <div className='flex min-h-9 items-center gap-2'>
              <Switch id='vendor-active' checked={field.value} onCheckedChange={field.onChange} />
              <span className='text-sm text-muted-foreground'>
                {field.value ? 'Shows in the pickers' : 'Hidden from the pickers'}
              </span>
            </div>
          )}
        />
      </FormField>
    </form>
  )
}
