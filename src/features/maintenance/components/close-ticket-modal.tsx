import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useVendorOptions,
  type CloseTicketInput,
  type Ticket,
} from '../api'
import { numberText, optionalNumber, rupees, wholeText } from '../labels'
import { applyFieldErrors } from '../helpers'
import { FileField, FormAlert, MAINTENANCE_INPUT_CLASS, type AttachedFile } from './shared'

const FORM_ID = 'close-ticket-form'

const schema = z.object({
  parts_cost: numberText(0, 1_000_000, 'Enter the parts cost, from ₹0 to ₹10,00,000'),
  labour_cost: numberText(0, 1_000_000, 'Enter the labour cost, from ₹0 to ₹10,00,000'),
  cost: numberText(0, 1_000_000, 'Enter the cost, from ₹0 to ₹10,00,000'),
  vendor_id: z.string(),
  vendor: z.string().trim().max(100, 'Vendor must be 100 characters or less'),
  odometer_km: numberText(0, 2_000_000, 'Enter the odometer, from 0 to 20,00,000 km'),
  warranty_months: wholeText(1, 120, 'Enter 1 to 120 months'),
  warranty_km: wholeText(100, 500_000, 'Enter 100 to 5,00,000 km'),
  notes: z.string().trim().max(1000, 'Notes must be 1000 characters or less'),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = [
  'parts_cost',
  'labour_cost',
  'cost',
  'vendor_id',
  'vendor',
  'odometer_km',
  'warranty_months',
  'warranty_km',
  'notes',
]

interface CloseTicketModalProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloseTicketModal({ ticket, open, onOpenChange }: CloseTicketModalProps) {
  const close = useMaintenanceMutation((input: CloseTicketInput) =>
    maintenanceApi.closeTicket(ticket!.id, input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open && Boolean(ticket)}
      onOpenChange={onOpenChange}
      title='Close ticket'
      description={ticket ? `${ticket.title} · ${ticket.vehicle.registration_no}` : undefined}
      formId={FORM_ID}
      submitText='Mark as done'
      loading={close.isPending || uploading}
      size='lg'
    >
      {open && ticket && (
        <CloseForm
          key={ticket.id}
          ticket={ticket}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            await close.mutateAsync(input)
            alerts.success('Ticket closed')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function CloseForm({
  ticket,
  onUploadingChange,
  onSubmit,
}: {
  ticket: Ticket
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: CloseTicketInput) => Promise<void>
}) {
  const garageOptions = useVendorOptions('garage')
  const garage = ticket.garage
  if (garage && !garageOptions.some((option) => option.value === String(garage.id)))
    garageOptions.unshift({ value: String(garage.id), label: garage.name, hint: undefined })
  const [bill, setBill] = useState<AttachedFile | null>(ticket.bill_file ?? null)
  const [billError, setBillError] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      parts_cost: ticket.parts_cost?.toString() ?? '',
      labour_cost: ticket.labour_cost?.toString() ?? '',
      cost: ticket.cost?.toString() ?? '',
      vendor_id: garage ? String(garage.id) : '',
      vendor: garage ? '' : (ticket.vendor ?? ''),
      odometer_km: ticket.odometer_km?.toString() ?? '',
      warranty_months: ticket.warranty_months?.toString() ?? '',
      warranty_km: ticket.warranty_km?.toString() ?? '',
      notes: ticket.notes ?? '',
    },
  })

  const vendorId = useWatch({ control, name: 'vendor_id' })
  const parts = useWatch({ control, name: 'parts_cost' })
  const labour = useWatch({ control, name: 'labour_cost' })
  const split = parts.trim() !== '' || labour.trim() !== ''

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        parts_cost: optionalNumber(values.parts_cost),
        labour_cost: optionalNumber(values.labour_cost),
        cost: split ? undefined : optionalNumber(values.cost),
        vendor_id: values.vendor_id ? Number(values.vendor_id) : undefined,
        vendor: values.vendor_id ? undefined : values.vendor || undefined,
        odometer_km: optionalNumber(values.odometer_km),
        warranty_months: optionalNumber(values.warranty_months),
        warranty_km: optionalNumber(values.warranty_km),
        bill_file_id: bill?.id,
        notes: values.notes || undefined,
      })
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        bill_file_id: setBillError,
      })
      if (!mapped) {
        setError('root', {
          message:
            apiError.code === 'TICKET_CLOSED'
              ? 'This ticket is already closed. Refresh the list to see it.'
              : apiError.message,
        })
      }
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      {(ticket.kind === 'service' || ticket.schedule_id) && (
        <p className='flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm font-medium text-info sm:col-span-2'>
          <RotateCcw className='mt-0.5 size-4 shrink-0' />
          <span>
            Closing this service resets its schedule: the next one is counted from today and the
            odometer you enter here.
          </span>
        </p>
      )}
      <FormField id='close-parts' label='Parts (₹)' error={errors.parts_cost?.message}>
        <Input
          id='close-parts'
          type='number'
          inputMode='decimal'
          autoFocus
          min={0}
          max={1_000_000}
          step='0.01'
          placeholder='3000'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.parts_cost) || undefined}
          {...register('parts_cost')}
        />
      </FormField>
      <FormField
        id='close-labour'
        label='Labour (₹)'
        error={errors.labour_cost?.message}
        hint={
          split ? `Final cost ${rupees((Number(parts) || 0) + (Number(labour) || 0))}` : undefined
        }
      >
        <Input
          id='close-labour'
          type='number'
          inputMode='decimal'
          min={0}
          max={1_000_000}
          step='0.01'
          placeholder='1500'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.labour_cost) || undefined}
          {...register('labour_cost')}
        />
      </FormField>
      {!split && (
        <FormField
          id='close-cost'
          label='Final cost (₹)'
          error={errors.cost?.message}
          hint='Or enter parts and labour'
        >
          <Input
            id='close-cost'
            type='number'
            inputMode='decimal'
            min={0}
            max={1_000_000}
            step='0.01'
            placeholder='4500'
            className={MAINTENANCE_INPUT_CLASS}
            aria-invalid={Boolean(errors.cost) || undefined}
            {...register('cost')}
          />
        </FormField>
      )}
      <FormField id='close-odometer' label='Odometer (km)' error={errors.odometer_km?.message}>
        <Input
          id='close-odometer'
          type='number'
          inputMode='decimal'
          min={0}
          max={2_000_000}
          step='0.1'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.odometer_km) || undefined}
          {...register('odometer_km')}
        />
      </FormField>
      <FormField id='close-garage' label='Garage' error={errors.vendor_id?.message}>
        <Controller
          control={control}
          name='vendor_id'
          render={({ field }) => (
            <Combobox
              id='close-garage'
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
        <FormField id='close-vendor' label='Vendor name' error={errors.vendor?.message}>
          <Input
            id='close-vendor'
            maxLength={100}
            placeholder='Sri Murugan Motors'
            className={MAINTENANCE_INPUT_CLASS}
            aria-invalid={Boolean(errors.vendor) || undefined}
            {...register('vendor')}
          />
        </FormField>
      )}
      <FormField
        id='close-warranty-months'
        label='Warranty (months)'
        error={errors.warranty_months?.message}
      >
        <Input
          id='close-warranty-months'
          type='number'
          inputMode='numeric'
          min={1}
          max={120}
          placeholder='12'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.warranty_months) || undefined}
          {...register('warranty_months')}
        />
      </FormField>
      <FormField id='close-warranty-km' label='Warranty (km)' error={errors.warranty_km?.message}>
        <Input
          id='close-warranty-km'
          type='number'
          inputMode='numeric'
          min={100}
          max={500_000}
          placeholder='20000'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.warranty_km) || undefined}
          {...register('warranty_km')}
        />
      </FormField>
      <FileField
        id='close-bill'
        label='Bill'
        purpose='maintenance_bill'
        file={bill}
        onChange={setBill}
        onUploadingChange={onUploadingChange}
        error={billError}
        onError={setBillError}
        className='sm:col-span-2'
      />
      <FormField
        id='close-notes'
        label='Work done'
        error={errors.notes?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='close-notes'
          rows={3}
          maxLength={1000}
          placeholder='Replaced the thermostat and topped up coolant'
          aria-invalid={Boolean(errors.notes) || undefined}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
