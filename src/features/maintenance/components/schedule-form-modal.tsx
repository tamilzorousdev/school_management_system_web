import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { today } from '@/features/attendance/labels'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  maintenanceApi,
  useMaintenanceMutation,
  type Schedule,
  type ScheduleInput,
  type ScheduleUpdate,
  type ServiceCategory,
} from '../api'
import {
  SERVICE_CATEGORY,
  SERVICE_CATEGORY_OPTIONS,
  numberText,
  optionalNumber,
  wholeText,
} from '../labels'
import { applyFieldErrors } from '../helpers'
import { FormAlert } from './shared'

const FORM_ID = 'schedule-form'

const schema = z
  .object({
    category: z.string().min(1, 'Choose the kind of service'),
    title: z
      .string()
      .trim()
      .refine((value) => value === '' || value.length >= 3, 'Enter at least 3 characters')
      .refine((value) => value.length <= 100, 'Title must be 100 characters or less'),
    every_km: wholeText(500, 200_000, 'Enter 500 to 2,00,000 km'),
    every_months: wholeText(1, 60, 'Enter 1 to 60 months'),
    last_done_on: z
      .string()
      .refine((value) => value === '' || value <= today(), 'The date cannot be in the future'),
    last_done_km: numberText(0, 2_000_000, 'Enter the odometer, from 0 to 20,00,000 km'),
    is_active: z.boolean(),
  })
  .refine((values) => values.every_km !== '' || values.every_months !== '', {
    path: ['every_km'],
    message: 'Enter every how many km, months, or both',
  })

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'category',
  'title',
  'every_km',
  'every_months',
  'last_done_on',
  'last_done_km',
  'is_active',
]

interface ScheduleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: Schedule | null
  defaultVehicleId?: number
}

type SaveInput = { create?: ScheduleInput; update?: ScheduleUpdate }

export function ScheduleFormModal({
  open,
  onOpenChange,
  schedule,
  defaultVehicleId,
}: ScheduleFormModalProps) {
  const save = useMaintenanceMutation(async (input: SaveInput) => {
    if (schedule && input.update)
      return [await maintenanceApi.updateSchedule(schedule.id, input.update)]
    return maintenanceApi.createSchedules(input.create!)
  })
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={schedule ? 'Edit service rule' : 'Add service rule'}
      description={
        schedule
          ? `${schedule.vehicle.registration_no} · ${schedule.vehicle.name}`
          : 'A service that repeats every so many km or months. Add the same rule to several buses at once.'
      }
      formId={FORM_ID}
      submitText={schedule ? 'Save changes' : 'Add rule'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <ScheduleForm
          key={schedule?.id ?? 'new'}
          schedule={schedule}
          defaultVehicleId={defaultVehicleId}
          onSubmit={async (input) => {
            const saved = await save.mutateAsync(input)
            alerts.success(
              schedule
                ? 'Service rule updated'
                : `Service rule added to ${saved.length} ${saved.length === 1 ? 'bus' : 'buses'}`
            )
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ScheduleForm({
  schedule,
  defaultVehicleId,
  onSubmit,
}: {
  schedule: Schedule | null
  defaultVehicleId?: number
  onSubmit: (input: SaveInput) => Promise<void>
}) {
  const busOptions = useBusOptions()
  const [buses, setBuses] = useState<string[]>(defaultVehicleId ? [String(defaultVehicleId)] : [])
  const [busError, setBusError] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: schedule?.category ?? '',
      title: schedule?.title ?? '',
      every_km: schedule?.every_km?.toString() ?? '',
      every_months: schedule?.every_months?.toString() ?? '',
      last_done_on: schedule?.last_done_on ?? '',
      last_done_km: schedule?.last_done_km?.toString() ?? '',
      is_active: schedule?.is_active ?? true,
    },
  })

  const remaining = busOptions.filter((option) => !buses.includes(option.value))
  const labelOf = (value: string) =>
    busOptions.find((option) => option.value === value)?.label ?? `Bus ${value}`

  const checkBuses = () => {
    if (!schedule && buses.length === 0) setBusError('Choose at least one bus')
  }

  const submit = handleSubmit(async (values) => {
    if (!schedule && buses.length === 0) return setBusError('Choose at least one bus')
    const clear = schedule ? null : undefined
    const common = {
      title: values.title || undefined,
      every_km: optionalNumber(values.every_km) ?? clear,
      every_months: optionalNumber(values.every_months) ?? clear,
      last_done_on: values.last_done_on || undefined,
      last_done_km: optionalNumber(values.last_done_km) ?? clear,
    }
    try {
      await onSubmit(
        schedule
          ? { update: { ...common, is_active: values.is_active } }
          : {
              create: {
                ...common,
                vehicle_ids: buses.map(Number),
                category: values.category as ServiceCategory,
              },
            }
      )
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        vehicle_ids: setBusError,
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  }, checkBuses)

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      {!schedule && (
        <FormField
          id='schedule-buses'
          label='Buses'
          required
          error={busError}
          className='sm:col-span-2'
        >
          <div className='flex flex-wrap items-center gap-2'>
            <Combobox
              id='schedule-buses'
              label='Add a bus'
              value={undefined}
              options={remaining}
              placeholder={buses.length ? 'Add another bus' : 'Choose buses'}
              searchPlaceholder='Search buses'
              emptyText='Every bus is added'
              highlightSelected={false}
              className='w-full sm:w-72'
              invalid={Boolean(busError)}
              onChange={(value) => {
                if (!value) return
                setBusError('')
                setBuses((current) => [...current, value])
              }}
            />
            {remaining.length > 0 && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setBusError('')
                  setBuses(busOptions.map((option) => option.value))
                }}
              >
                All buses
              </Button>
            )}
          </div>
          {buses.length > 0 && (
            <ul className='flex flex-wrap gap-1.5' aria-label='Chosen buses'>
              {buses.map((value) => (
                <li
                  key={value}
                  className='inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2.5 text-xs font-semibold'
                >
                  <span className='truncate'>{labelOf(value)}</span>
                  <button
                    type='button'
                    aria-label={`Remove ${labelOf(value)}`}
                    onClick={() => setBuses((current) => current.filter((item) => item !== value))}
                    className='grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground'
                  >
                    <X className='size-3' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormField>
      )}
      <FormField id='schedule-category' label='Service' required error={errors.category?.message}>
        <Controller
          control={control}
          name='category'
          render={({ field }) =>
            schedule ? (
              <Input
                id='schedule-category'
                value={SERVICE_CATEGORY[schedule.category]}
                disabled
                readOnly
              />
            ) : (
              <Combobox
                id='schedule-category'
                label='Service'
                value={field.value || undefined}
                options={SERVICE_CATEGORY_OPTIONS}
                placeholder='Choose the service'
                searchPlaceholder='Search services'
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.category)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )
          }
        />
      </FormField>
      <FormField
        id='schedule-title'
        label='Title'
        error={errors.title?.message}
        hint='Leave empty to use the service name'
      >
        <Input
          id='schedule-title'
          maxLength={100}
          placeholder='Engine oil and filter change'
          aria-invalid={Boolean(errors.title) || undefined}
          {...register('title')}
        />
      </FormField>
      <FormField id='schedule-every-km' label='Every (km)' error={errors.every_km?.message}>
        <Input
          id='schedule-every-km'
          type='number'
          inputMode='numeric'
          min={500}
          max={200_000}
          step='1'
          placeholder='10000'
          aria-invalid={Boolean(errors.every_km) || undefined}
          {...register('every_km')}
        />
      </FormField>
      <FormField
        id='schedule-every-months'
        label='Every (months)'
        error={errors.every_months?.message}
        hint='Due at whichever comes first'
      >
        <Input
          id='schedule-every-months'
          type='number'
          inputMode='numeric'
          min={1}
          max={60}
          step='1'
          placeholder='6'
          aria-invalid={Boolean(errors.every_months) || undefined}
          {...register('every_months')}
        />
      </FormField>
      <FormField
        id='schedule-last-on'
        label='Last done on'
        error={errors.last_done_on?.message}
        hint={schedule ? undefined : 'Leave empty for today'}
      >
        <Controller
          control={control}
          name='last_done_on'
          render={({ field }) => (
            <Input
              id='schedule-last-on'
              type='date'
              max={today()}
              aria-invalid={Boolean(errors.last_done_on) || undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
      <FormField
        id='schedule-last-km'
        label='Last done at (km)'
        error={errors.last_done_km?.message}
        hint={schedule ? undefined : 'Leave empty for the bus’s current km'}
      >
        <Input
          id='schedule-last-km'
          type='number'
          inputMode='decimal'
          min={0}
          max={2_000_000}
          step='0.1'
          placeholder='40000'
          aria-invalid={Boolean(errors.last_done_km) || undefined}
          {...register('last_done_km')}
        />
      </FormField>
      {schedule && (
        <FormField id='schedule-active' label='Reminders' className='sm:col-span-2'>
          <Controller
            control={control}
            name='is_active'
            render={({ field }) => (
              <div className='flex min-h-9 items-center gap-2'>
                <Switch
                  id='schedule-active'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className='text-sm text-muted-foreground'>
                  {field.value ? 'On: shows when due' : 'Switched off: never shows as due'}
                </span>
              </div>
            )}
          />
        </FormField>
      )}
    </form>
  )
}
