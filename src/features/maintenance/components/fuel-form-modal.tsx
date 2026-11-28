import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { today } from '@/features/attendance/labels'
import { useBusOptions, useCrew } from '@/features/transport/api'
import { ROLE_BADGE } from '@/features/transport/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  maintenanceApi,
  useMaintenanceMutation,
  useVendorOptions,
  type FuelEntry,
  type FuelInput,
  type PaymentMode,
} from '../api'
import { PAYMENT_MODE_OPTIONS, rupees } from '../labels'
import { applyFieldErrors } from '../helpers'
import { FileField, FormAlert, MAINTENANCE_INPUT_CLASS, type AttachedFile } from './shared'

const FORM_ID = 'fuel-form'

const between = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => {
      const number = Number(value)
      return Number.isFinite(number) && number >= min && number <= max
    }, message)

const schema = z.object({
  vehicle_id: z.string().min(1, 'Choose the bus'),
  filled_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date of the fill')
    .refine((value) => value <= today(), 'The date cannot be in the future'),
  litres: between(0.1, 1000, 'Enter the litres, from 0.1 to 1000'),
  amount: between(1, 100_000, 'Enter the amount, from ₹1 to ₹1,00,000'),
  odometer_km: between(0, 2_000_000, 'Enter the odometer, from 0 to 20,00,000 km'),
  is_full: z.boolean(),
  payment_mode: z.string().min(1, 'Choose how it was paid'),
  station_id: z.string(),
  station: z.string().trim().max(100, 'Station must be 100 characters or less'),
  filled_by: z.string(),
  reason: z.string().trim().max(300, 'Reason must be 300 characters or less'),
})

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'vehicle_id',
  'filled_on',
  'litres',
  'amount',
  'odometer_km',
  'is_full',
  'payment_mode',
  'station_id',
  'station',
  'filled_by',
  'reason',
]

interface FuelFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: FuelEntry | null
  defaultVehicleId?: number
}

export function FuelFormModal({ open, onOpenChange, entry, defaultVehicleId }: FuelFormModalProps) {
  const save = useMaintenanceMutation((input: FuelInput) =>
    entry ? maintenanceApi.updateFuel(entry.id, input) : maintenanceApi.createFuel(input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? 'Edit fuel entry' : 'Add fuel entry'}
      description='Litres, amount and odometer from the fuel bill. Mileage is worked out between full-tank fills.'
      formId={FORM_ID}
      submitText={entry ? 'Save changes' : 'Add entry'}
      loading={save.isPending || uploading}
      size='lg'
    >
      {open && (
        <FuelForm
          key={entry?.id ?? 'new'}
          entry={entry}
          defaultVehicleId={defaultVehicleId}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(entry ? 'Fuel entry updated' : 'Fuel entry added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function FuelForm({
  entry,
  defaultVehicleId,
  onUploadingChange,
  onSubmit,
}: {
  entry: FuelEntry | null
  defaultVehicleId?: number
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: FuelInput) => Promise<void>
}) {
  const busOptions = useBusOptions()
  const crew = useCrew()
  const stationOptions = useVendorOptions('fuel_station')
  const savedStation = entry?.fuel_station
  if (savedStation && !stationOptions.some((option) => option.value === String(savedStation.id)))
    stationOptions.unshift({
      value: String(savedStation.id),
      label: savedStation.name,
      hint: undefined,
    })
  const [bill, setBill] = useState<AttachedFile | null>(entry?.bill_file ?? null)
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
      vehicle_id: String(entry?.vehicle.id ?? defaultVehicleId ?? ''),
      filled_on: entry?.filled_on ?? today(),
      litres: entry?.litres.toString() ?? '',
      amount: entry?.amount.toString() ?? '',
      odometer_km: entry?.odometer_km.toString() ?? '',
      is_full: entry?.is_full ?? true,
      payment_mode: entry?.payment_mode ?? 'cash',
      station_id: savedStation ? String(savedStation.id) : '',
      station: savedStation ? '' : (entry?.station ?? ''),
      filled_by: entry?.filled_by ? String(entry.filled_by.id) : '',
      reason: '',
    },
  })

  const crewOptions = (crew.data ?? []).map((person) => ({
    value: String(person.user_id),
    label: person.name,
    hint: ROLE_BADGE[person.role].label,
  }))
  const filledBy = entry?.filled_by
  if (filledBy && !crewOptions.some((option) => option.value === String(filledBy.id))) {
    crewOptions.unshift({ value: String(filledBy.id), label: filledBy.name, hint: '' })
  }

  const litres = Number(useWatch({ control, name: 'litres' }))
  const amount = Number(useWatch({ control, name: 'amount' }))
  const stationId = useWatch({ control, name: 'station_id' })
  const paymentMode = useWatch({ control, name: 'payment_mode' })
  const pricePerLitre = litres > 0 && amount > 0 ? amount / litres : null

  const submit = handleSubmit(async (values) => {
    const clear = entry ? null : undefined
    const input: FuelInput = {
      vehicle_id: Number(values.vehicle_id),
      filled_on: values.filled_on,
      litres: Number(values.litres),
      amount: Number(values.amount),
      odometer_km: Number(values.odometer_km),
      is_full: values.is_full,
      payment_mode: values.payment_mode as PaymentMode,
      station_id: values.station_id ? Number(values.station_id) : clear,
      station: values.station_id ? clear : values.station || clear,
      filled_by: values.filled_by ? Number(values.filled_by) : clear,
      bill_file_id: bill ? bill.id : clear,
    }
    if (entry && values.reason) input.reason = values.reason
    try {
      await onSubmit(input)
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        bill_file_id: setBillError,
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      {entry?.status === 'pending' && (
        <p className='rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning sm:col-span-2'>
          Added from the driver app and waiting for a check. Fix any mistakes here, then approve it
          from the list.
        </p>
      )}
      <FormField id='fuel-bus' label='Bus' required error={errors.vehicle_id?.message}>
        <Controller
          control={control}
          name='vehicle_id'
          render={({ field }) => (
            <Combobox
              id='fuel-bus'
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
      <FormField id='fuel-date' label='Date' required error={errors.filled_on?.message}>
        <Controller
          control={control}
          name='filled_on'
          render={({ field }) => (
            <DatePicker
              id='fuel-date'
              max={today()}
              className={MAINTENANCE_INPUT_CLASS}
              invalid={Boolean(errors.filled_on)}
              required
              value={field.value}
              onChange={(value: string) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField id='fuel-litres' label='Litres' required error={errors.litres?.message}>
        <Input
          id='fuel-litres'
          type='number'
          inputMode='decimal'
          min={0.1}
          max={1000}
          step='0.01'
          placeholder='60.5'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.litres) || undefined}
          {...register('litres')}
        />
      </FormField>
      <FormField
        id='fuel-amount'
        label='Amount (₹)'
        required
        error={errors.amount?.message}
        hint={pricePerLitre ? `${rupees(Number(pricePerLitre.toFixed(2)))} per litre` : undefined}
      >
        <Input
          id='fuel-amount'
          type='number'
          inputMode='decimal'
          min={1}
          max={100_000}
          step='0.01'
          placeholder='5800'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.amount) || undefined}
          {...register('amount')}
        />
      </FormField>
      <FormField
        id='fuel-odometer'
        label='Odometer (km)'
        required
        error={errors.odometer_km?.message}
        hint='Reading on the dashboard at the pump'
      >
        <Input
          id='fuel-odometer'
          type='number'
          inputMode='decimal'
          min={0}
          max={2_000_000}
          step='0.1'
          placeholder='48213'
          className={MAINTENANCE_INPUT_CLASS}
          aria-invalid={Boolean(errors.odometer_km) || undefined}
          {...register('odometer_km')}
        />
      </FormField>
      <FormField id='fuel-full' label='Fill' error={errors.is_full?.message}>
        <Controller
          control={control}
          name='is_full'
          render={({ field }) => (
            <div className='flex min-h-9 items-center gap-2'>
              <Switch id='fuel-full' checked={field.value} onCheckedChange={field.onChange} />
              <span className='text-sm text-muted-foreground'>
                {field.value ? 'Full tank' : 'Part fill (not used for km/l)'}
              </span>
            </div>
          )}
        />
      </FormField>
      <FormField
        id='fuel-payment'
        label='Paid by'
        required
        error={errors.payment_mode?.message}
        hint={paymentMode === 'driver_paid' ? 'Shows in To pay back until paid' : undefined}
      >
        <Controller
          control={control}
          name='payment_mode'
          render={({ field }) => (
            <Combobox
              id='fuel-payment'
              label='Paid by'
              value={field.value || undefined}
              options={PAYMENT_MODE_OPTIONS}
              placeholder='Choose how it was paid'
              searchPlaceholder='Search payment modes'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.payment_mode)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField id='fuel-station-id' label='Fuel station' error={errors.station_id?.message}>
        <Controller
          control={control}
          name='station_id'
          render={({ field }) => (
            <Combobox
              id='fuel-station-id'
              label='Fuel station'
              value={field.value || undefined}
              options={stationOptions}
              allLabel='Not a saved station'
              placeholder='Not a saved station'
              searchPlaceholder='Search stations'
              emptyText='No saved stations yet'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      {!stationId && (
        <FormField id='fuel-station' label='Station name' error={errors.station?.message}>
          <Input
            id='fuel-station'
            maxLength={100}
            placeholder='Indian Oil, Anna Nagar'
            className={MAINTENANCE_INPUT_CLASS}
            aria-invalid={Boolean(errors.station) || undefined}
            {...register('station')}
          />
        </FormField>
      )}
      <FormField id='fuel-filled-by' label='Filled by' error={errors.filled_by?.message}>
        <Controller
          control={control}
          name='filled_by'
          render={({ field }) => (
            <Combobox
              id='fuel-filled-by'
              label='Filled by'
              value={field.value || undefined}
              options={crewOptions}
              allLabel='Not recorded'
              placeholder='Not recorded'
              searchPlaceholder='Search drivers'
              emptyText='No drivers or attendants yet'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.filled_by)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FileField
        id='fuel-bill'
        label='Bill'
        purpose='fuel_bill'
        file={bill}
        onChange={setBill}
        onUploadingChange={onUploadingChange}
        error={billError}
        onError={setBillError}
      />
      {entry && (
        <FormField
          id='fuel-reason'
          label='Reason for the change'
          error={errors.reason?.message}
          hint='Kept in the change history'
          className='sm:col-span-2'
        >
          <Input
            id='fuel-reason'
            maxLength={300}
            placeholder='Wrong amount typed'
            aria-invalid={Boolean(errors.reason) || undefined}
            {...register('reason')}
          />
        </FormField>
      )}
    </form>
  )
}
