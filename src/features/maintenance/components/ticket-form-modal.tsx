import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useVendorOptions,
  type ServiceCategory,
  type Ticket,
  type TicketInput,
  type TicketKind,
  type TicketSeverity,
  type TicketStatus,
} from '../api'
import {
  SERVICE_CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  TICKET_KIND_OPTIONS,
  TICKET_STATUS_OPTIONS,
  numberText,
  optionalNumber,
  rupees,
  warrantyText,
  wholeText,
} from '../labels'
import { applyFieldErrors } from '../helpers'
import { FileField, FormAlert, type AttachedFile } from './shared'

const FORM_ID = 'ticket-form'
const FAULT_CODE = /^[PCBU][0-9A-F]{4}$/

const schema = z.object({
  vehicle_id: z.string().min(1, 'Choose the bus'),
  title: z
    .string()
    .trim()
    .min(3, 'Enter at least 3 characters')
    .max(150, 'Title must be 150 characters or less'),
  description: z.string().trim().max(1000, 'Description must be 1000 characters or less'),
  fault_code: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || FAULT_CODE.test(value.toUpperCase()),
      'Enter a fault code like P0301'
    ),
  severity: z.string(),
  status: z.enum(['open', 'in_progress', 'done']),
  kind: z.enum(['repair', 'service']),
  category: z.string(),
  odometer_km: numberText(0, 2_000_000, 'Enter the odometer, from 0 to 20,00,000 km'),
  vendor_id: z.string(),
  vendor: z.string().trim().max(100, 'Vendor must be 100 characters or less'),
  parts_cost: numberText(0, 1_000_000, 'Enter the parts cost, from ₹0 to ₹10,00,000'),
  labour_cost: numberText(0, 1_000_000, 'Enter the labour cost, from ₹0 to ₹10,00,000'),
  cost: numberText(0, 1_000_000, 'Enter the cost, from ₹0 to ₹10,00,000'),
  off_road: z.boolean(),
  warranty_months: wholeText(1, 120, 'Enter 1 to 120 months'),
  warranty_km: wholeText(100, 500_000, 'Enter 100 to 5,00,000 km'),
  notes: z.string().trim().max(1000, 'Notes must be 1000 characters or less'),
})

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'vehicle_id',
  'title',
  'description',
  'fault_code',
  'severity',
  'status',
  'kind',
  'category',
  'odometer_km',
  'vendor_id',
  'vendor',
  'parts_cost',
  'labour_cost',
  'cost',
  'off_road',
  'warranty_months',
  'warranty_km',
  'notes',
]

interface TicketFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
  defaultVehicleId?: number
}

export function TicketFormModal({
  open,
  onOpenChange,
  ticket,
  defaultVehicleId,
}: TicketFormModalProps) {
  const save = useMaintenanceMutation((input: TicketInput) =>
    ticket ? maintenanceApi.updateTicket(ticket.id, input) : maintenanceApi.createTicket(input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={ticket ? 'Edit service or repair' : 'Add ticket'}
      description={
        ticket
          ? `${ticket.vehicle.registration_no} · ${ticket.vehicle.name}`
          : 'Log a planned service or a repair job for a bus.'
      }
      formId={FORM_ID}
      submitText={ticket ? 'Save changes' : 'Add ticket'}
      loading={save.isPending || uploading}
      size='lg'
    >
      {open && (
        <TicketForm
          key={ticket?.id ?? 'new'}
          ticket={ticket}
          defaultVehicleId={defaultVehicleId}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(ticket ? 'Ticket updated' : 'Ticket added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function WarrantyNotice({ ticket }: { ticket: Ticket }) {
  const text = warrantyText(ticket)
  if (!text) return null
  return (
    <p className='flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success sm:col-span-2'>
      <ShieldCheck className='mt-0.5 size-4 shrink-0' />
      <span>Claim warranty: {text}</span>
    </p>
  )
}

function TicketForm({
  ticket,
  defaultVehicleId,
  onUploadingChange,
  onSubmit,
}: {
  ticket: Ticket | null
  defaultVehicleId?: number
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: TicketInput) => Promise<void>
}) {
  const busOptions = useBusOptions()
  const garageOptions = useVendorOptions('garage')
  const garage = ticket?.garage
  if (garage && !garageOptions.some((option) => option.value === String(garage.id)))
    garageOptions.unshift({ value: String(garage.id), label: garage.name, hint: undefined })
  const [bill, setBill] = useState<AttachedFile | null>(ticket?.bill_file ?? null)
  const [photo, setPhoto] = useState<AttachedFile | null>(ticket?.photo_file ?? null)
  const [billError, setBillError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_id: String(ticket?.vehicle.id ?? defaultVehicleId ?? ''),
      title: ticket?.title ?? '',
      description: ticket?.description ?? '',
      fault_code: ticket?.fault_code ?? '',
      severity: ticket?.severity ?? '',
      status: ticket?.status ?? 'open',
      kind: ticket?.kind ?? 'repair',
      category: ticket?.category ?? '',
      odometer_km: ticket?.odometer_km?.toString() ?? '',
      vendor_id: garage ? String(garage.id) : '',
      vendor: garage ? '' : (ticket?.vendor ?? ''),
      parts_cost: ticket?.parts_cost?.toString() ?? '',
      labour_cost: ticket?.labour_cost?.toString() ?? '',
      cost: ticket?.cost?.toString() ?? '',
      off_road: ticket?.off_road ?? false,
      warranty_months: ticket?.warranty_months?.toString() ?? '',
      warranty_km: ticket?.warranty_km?.toString() ?? '',
      notes: ticket?.notes ?? '',
    },
  })

  const vendorId = useWatch({ control, name: 'vendor_id' })
  const parts = useWatch({ control, name: 'parts_cost' })
  const labour = useWatch({ control, name: 'labour_cost' })
  const split = parts.trim() !== '' || labour.trim() !== ''
  const splitTotal = (Number(parts) || 0) + (Number(labour) || 0)

  const submit = handleSubmit(async (values) => {
    const clear = ticket ? null : undefined
    const input: TicketInput = {
      title: values.title,
      description: values.description || clear,
      fault_code: values.fault_code.toUpperCase() || clear,
      severity: (values.severity || clear) as TicketSeverity | null | undefined,
      kind: values.kind as TicketKind,
      category: (values.category || clear) as ServiceCategory | null | undefined,
      odometer_km: optionalNumber(values.odometer_km) ?? clear,
      vendor_id: values.vendor_id ? Number(values.vendor_id) : clear,
      vendor: values.vendor_id ? clear : values.vendor || clear,
      parts_cost: optionalNumber(values.parts_cost) ?? clear,
      labour_cost: optionalNumber(values.labour_cost) ?? clear,
      cost: split ? undefined : (optionalNumber(values.cost) ?? clear),
      off_road: values.off_road,
      warranty_months: optionalNumber(values.warranty_months) ?? clear,
      warranty_km: optionalNumber(values.warranty_km) ?? clear,
      bill_file_id: bill ? bill.id : clear,
      photo_file_id: photo ? photo.id : clear,
      notes: values.notes || clear,
    }
    if (ticket) input.status = values.status
    else input.vehicle_id = Number(values.vehicle_id)
    try {
      await onSubmit(input)
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        bill_file_id: setBillError,
        photo_file_id: setPhotoError,
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      {ticket && <WarrantyNotice ticket={ticket} />}
      {ticket?.reported_by && (
        <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm sm:col-span-2'>
          Reported from the driver app by <strong>{ticket.reported_by.name}</strong> on{' '}
          {formatDate(ticket.opened_at)}.
        </p>
      )}
      {ticket ? (
        <FormField id='ticket-status' label='Status' error={errors.status?.message}>
          <Controller
            control={control}
            name='status'
            render={({ field }) => (
              <Combobox
                id='ticket-status'
                label='Status'
                value={field.value}
                options={TICKET_STATUS_OPTIONS}
                placeholder='Choose status'
                searchPlaceholder='Search status'
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.status)}
                onChange={(value) => field.onChange((value ?? 'open') as TicketStatus)}
              />
            )}
          />
        </FormField>
      ) : (
        <FormField id='ticket-bus' label='Bus' required error={errors.vehicle_id?.message}>
          <Controller
            control={control}
            name='vehicle_id'
            render={({ field }) => (
              <Combobox
                id='ticket-bus'
                label='Bus'
                value={field.value || undefined}
                options={busOptions}
                placeholder='Choose a bus'
                searchPlaceholder='Search buses'
                emptyText='No buses yet'
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.vehicle_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      )}
      <FormField id='ticket-kind' label='Type' error={errors.kind?.message}>
        <Controller
          control={control}
          name='kind'
          render={({ field }) => (
            <Combobox
              id='ticket-kind'
              label='Type'
              value={field.value}
              options={TICKET_KIND_OPTIONS}
              placeholder='Choose type'
              searchPlaceholder='Search type'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? 'repair')}
            />
          )}
        />
      </FormField>
      <FormField id='ticket-category' label='Category' error={errors.category?.message}>
        <Controller
          control={control}
          name='category'
          render={({ field }) => (
            <Combobox
              id='ticket-category'
              label='Category'
              value={field.value || undefined}
              options={SERVICE_CATEGORY_OPTIONS}
              allLabel='Not set'
              placeholder='Not set'
              searchPlaceholder='Search category'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.category)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='ticket-severity' label='Severity' error={errors.severity?.message}>
        <Controller
          control={control}
          name='severity'
          render={({ field }) => (
            <Combobox
              id='ticket-severity'
              label='Severity'
              value={field.value || undefined}
              options={SEVERITY_OPTIONS}
              allLabel='Not set'
              placeholder='Not set'
              searchPlaceholder='Search severity'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField
        id='ticket-title'
        label='Title'
        required
        error={errors.title?.message}
        className='sm:col-span-2'
      >
        <Input
          id='ticket-title'
          autoFocus
          maxLength={150}
          placeholder='Replace front brake pads'
          aria-invalid={Boolean(errors.title) || undefined}
          {...register('title')}
        />
      </FormField>
      <FormField
        id='ticket-description'
        label='Description'
        error={errors.description?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='ticket-description'
          rows={2}
          maxLength={1000}
          placeholder='What is wrong and what needs doing'
          aria-invalid={Boolean(errors.description) || undefined}
          {...register('description')}
        />
      </FormField>
      <FormField
        id='ticket-fault'
        label='Fault code'
        error={errors.fault_code?.message}
        hint='OBD code, like P0301'
      >
        <Input
          id='ticket-fault'
          maxLength={5}
          placeholder='P0301'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.fault_code) || undefined}
          {...register('fault_code')}
        />
      </FormField>
      <FormField id='ticket-odometer' label='Odometer (km)' error={errors.odometer_km?.message}>
        <Input
          id='ticket-odometer'
          type='number'
          inputMode='decimal'
          min={0}
          max={2_000_000}
          step='0.1'
          placeholder='48213'
          aria-invalid={Boolean(errors.odometer_km) || undefined}
          {...register('odometer_km')}
        />
      </FormField>
      <FormField
        id='ticket-garage'
        label='Garage'
        error={errors.vendor_id?.message}
        hint='Saved garages are added in Settings'
      >
        <Controller
          control={control}
          name='vendor_id'
          render={({ field }) => (
            <Combobox
              id='ticket-garage'
              label='Garage'
              value={field.value || undefined}
              options={garageOptions}
              allLabel='Not a saved garage'
              placeholder='Not a saved garage'
              searchPlaceholder='Search garages'
              emptyText='No saved garages yet'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      {!vendorId && (
        <FormField id='ticket-vendor' label='Vendor name' error={errors.vendor?.message}>
          <Input
            id='ticket-vendor'
            maxLength={100}
            placeholder='Sri Murugan Motors'
            aria-invalid={Boolean(errors.vendor) || undefined}
            {...register('vendor')}
          />
        </FormField>
      )}
      <FormField id='ticket-parts' label='Parts (₹)' error={errors.parts_cost?.message}>
        <Input
          id='ticket-parts'
          type='number'
          inputMode='decimal'
          min={0}
          max={1_000_000}
          step='0.01'
          placeholder='3000'
          aria-invalid={Boolean(errors.parts_cost) || undefined}
          {...register('parts_cost')}
        />
      </FormField>
      <FormField
        id='ticket-labour'
        label='Labour (₹)'
        error={errors.labour_cost?.message}
        hint={split ? `Total cost ${rupees(splitTotal)}` : undefined}
      >
        <Input
          id='ticket-labour'
          type='number'
          inputMode='decimal'
          min={0}
          max={1_000_000}
          step='0.01'
          placeholder='1500'
          aria-invalid={Boolean(errors.labour_cost) || undefined}
          {...register('labour_cost')}
        />
      </FormField>
      {!split && (
        <FormField
          id='ticket-cost'
          label='Total cost (₹)'
          error={errors.cost?.message}
          hint='Or enter parts and labour'
        >
          <Input
            id='ticket-cost'
            type='number'
            inputMode='decimal'
            min={0}
            max={1_000_000}
            step='0.01'
            placeholder='4500'
            aria-invalid={Boolean(errors.cost) || undefined}
            {...register('cost')}
          />
        </FormField>
      )}
      <FormField
        id='ticket-warranty-months'
        label='Warranty (months)'
        error={errors.warranty_months?.message}
      >
        <Input
          id='ticket-warranty-months'
          type='number'
          inputMode='numeric'
          min={1}
          max={120}
          placeholder='12'
          aria-invalid={Boolean(errors.warranty_months) || undefined}
          {...register('warranty_months')}
        />
      </FormField>
      <FormField id='ticket-warranty-km' label='Warranty (km)' error={errors.warranty_km?.message}>
        <Input
          id='ticket-warranty-km'
          type='number'
          inputMode='numeric'
          min={100}
          max={500_000}
          placeholder='20000'
          aria-invalid={Boolean(errors.warranty_km) || undefined}
          {...register('warranty_km')}
        />
      </FormField>
      <FileField
        id='ticket-bill'
        label='Bill'
        purpose='maintenance_bill'
        file={bill}
        onChange={setBill}
        onUploadingChange={onUploadingChange}
        error={billError}
        onError={setBillError}
      />
      <FileField
        id='ticket-photo'
        label='Photo'
        purpose='maintenance_photo'
        file={photo}
        onChange={setPhoto}
        onUploadingChange={onUploadingChange}
        error={photoError}
        onError={setPhotoError}
        photoOnly
      />
      <FormField id='ticket-off-road' label='Off road' className='sm:col-span-2'>
        <Controller
          control={control}
          name='off_road'
          render={({ field }) => (
            <div className='flex min-h-9 items-center gap-2'>
              <Switch id='ticket-off-road' checked={field.value} onCheckedChange={field.onChange} />
              <span className='text-sm text-muted-foreground'>
                {field.value
                  ? 'The bus cannot start trips until this ticket is closed'
                  : 'The bus can still run while this is open'}
              </span>
            </div>
          )}
        />
      </FormField>
      <FormField
        id='ticket-notes'
        label='Notes'
        error={errors.notes?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='ticket-notes'
          rows={2}
          maxLength={1000}
          aria-invalid={Boolean(errors.notes) || undefined}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
