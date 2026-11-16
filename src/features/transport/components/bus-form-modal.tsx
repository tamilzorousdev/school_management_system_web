import { useMemo, useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  transportApi,
  useCrew,
  useTrackers,
  useTransportMutation,
  type Bus,
  type BusInput,
  type Crew,
  type VehicleStatus,
} from '../api'
import { DUTY_HINT, formErrors } from '../labels'

const REGISTRATION = /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{0,3}[ -]?\d{1,4}$/

const DATES = [
  { key: 'insurance_expiry', label: 'Insurance valid until' },
  { key: 'fitness_expiry', label: 'Fitness certificate valid until' },
  { key: 'puc_expiry', label: 'PUC certificate valid until' },
  { key: 'permit_expiry', label: 'Permit valid until' },
] as const

type DateKey = (typeof DATES)[number]['key']

const STATUS_OPTIONS = [
  { value: 'active', label: 'In service' },
  { value: 'inactive', label: 'Off the road' },
]

const crewOptions = (crew: Crew[], role: Crew['role'], busId?: number) =>
  crew
    .filter((person) => person.role === role)
    .map((person) => ({
      value: String(person.user_id),
      label: person.name,
      hint:
        person.duty_status !== 'approved'
          ? DUTY_HINT[person.duty_status]
          : person.vehicle && person.vehicle.id !== busId
            ? `On ${person.vehicle.name}`
            : person.mobile,
    }))

export function BusFormModal({ bus, onClose }: { bus?: Bus; onClose: () => void }) {
  const crew = useCrew()
  const trackers = useTrackers()
  const [form, setForm] = useState({
    registration_no: bus?.registration_no ?? '',
    name: bus?.name ?? '',
    make_model: bus?.make_model ?? '',
    capacity: String(bus?.capacity ?? 40),
    device_id: bus?.device ? String(bus.device.id) : undefined,
    driver_user_id: bus?.driver ? String(bus.driver.id) : undefined,
    attendant_user_id: bus?.attendant ? String(bus.attendant.id) : undefined,
    insurance_expiry: bus?.insurance_expiry ?? '',
    fitness_expiry: bus?.fitness_expiry ?? '',
    puc_expiry: bus?.puc_expiry ?? '',
    permit_expiry: bus?.permit_expiry ?? '',
    status: (bus?.status ?? 'active') as VehicleStatus,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const save = useTransportMutation((input: BusInput) =>
    bus ? transportApi.updateBus(bus.id, input) : transportApi.createBus(input)
  )

  const trackerOptions = useMemo(() => {
    const options = (trackers.data ?? []).map((tracker) => ({
      value: String(tracker.id),
      label: `${tracker.imei} · ${tracker.name}`,
      hint: !tracker.linked_vehicle
        ? 'Free'
        : tracker.linked_vehicle.id === bus?.id
          ? 'This bus'
          : `On ${tracker.linked_vehicle.name}`,
    }))
    const current = bus?.device
    if (current && !options.some((option) => option.value === String(current.id))) {
      options.unshift({
        value: String(current.id),
        label: current.imei ?? `Tracker ${current.id}`,
        hint: 'This bus',
      })
    }
    return options
  }, [trackers.data, bus?.id, bus?.device])

  const submit = async () => {
    const registration = form.registration_no.trim().toUpperCase().replace(/\s+/g, ' ')
    const capacity = Number(form.capacity)
    const next: Record<string, string> = {}
    if (!REGISTRATION.test(registration))
      next.registration_no = 'Enter the registration like TN 09 AB 1234'
    if (!form.name.trim()) next.name = 'Enter a short name, like Bus 1'
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100)
      next.capacity = 'Enter the seats, from 1 to 100'
    setErrors(next)
    if (Object.keys(next).length) return
    const input: BusInput = {
      registration_no: registration,
      name: form.name.trim(),
      make_model: form.make_model.trim() || null,
      capacity,
      device_id: form.device_id ? Number(form.device_id) : null,
      driver_user_id: form.driver_user_id ? Number(form.driver_user_id) : null,
      attendant_user_id: form.attendant_user_id ? Number(form.attendant_user_id) : null,
      insurance_expiry: form.insurance_expiry || null,
      fitness_expiry: form.fitness_expiry || null,
      puc_expiry: form.puc_expiry || null,
      permit_expiry: form.permit_expiry || null,
      status: form.status,
    }
    try {
      await save.mutateAsync(input)
      alerts.success(bus ? `${registration} updated` : `${registration} added`)
      onClose()
    } catch (error) {
      setErrors(
        formErrors(error, {
          VEHICLE_EXISTS: 'registration_no',
          DEVICE_IN_USE: 'device_id',
          DRIVER_NOT_FOUND: 'driver_user_id',
        })
      )
    }
  }

  const trackerDown = trackers.isError
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={bus ? `Edit ${bus.registration_no}` : 'Add bus'}
      description='Registration, seats, tracker, crew and document dates.'
      formId='bus-form'
      submitText={bus ? 'Save' : 'Add bus'}
      loading={save.isPending}
      size='lg'
    >
      <form
        id='bus-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField
          id='bus-registration'
          label='Registration number'
          required
          error={errors.registration_no}
        >
          <Input
            id='bus-registration'
            autoFocus
            placeholder='TN 09 AB 1234'
            value={form.registration_no}
            aria-invalid={Boolean(errors.registration_no) || undefined}
            onChange={(event) => set('registration_no', event.target.value.toUpperCase())}
          />
        </FormField>
        <FormField id='bus-name' label='Bus name' required error={errors.name}>
          <Input
            id='bus-name'
            placeholder='Bus 1'
            maxLength={40}
            value={form.name}
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => set('name', event.target.value)}
          />
        </FormField>
        <FormField id='bus-model' label='Make and model' error={errors.make_model}>
          <Input
            id='bus-model'
            placeholder='Tata Starbus 40'
            maxLength={60}
            value={form.make_model}
            onChange={(event) => set('make_model', event.target.value)}
          />
        </FormField>
        <FormField id='bus-capacity' label='Seats' required error={errors.capacity}>
          <Input
            id='bus-capacity'
            type='number'
            inputMode='numeric'
            min={1}
            max={100}
            value={form.capacity}
            aria-invalid={Boolean(errors.capacity) || undefined}
            onChange={(event) => set('capacity', event.target.value)}
          />
        </FormField>
        <FormField
          id='bus-tracker'
          label='GPS tracker'
          error={errors.device_id}
          className='sm:col-span-2'
          hint={
            trackerDown
              ? 'Trackers cannot be loaded now because the bus tracking service is not reachable. You can still save the bus and fit a tracker later.'
              : 'Trackers come from the bus tracking service. A tracker can be on one bus only.'
          }
        >
          <Combobox
            id='bus-tracker'
            label='GPS tracker'
            value={form.device_id}
            options={trackerOptions}
            allLabel='No tracker'
            placeholder='No tracker'
            searchPlaceholder='Search IMEI or name'
            emptyText={trackerDown ? 'Tracking service not reachable' : 'No trackers yet'}
            invalid={Boolean(errors.device_id)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('device_id', value)}
          />
        </FormField>
        <FormField id='bus-driver' label='Driver' error={errors.driver_user_id}>
          <Combobox
            id='bus-driver'
            label='Driver'
            value={form.driver_user_id}
            options={crewOptions(crew.data ?? [], 'driver', bus?.id)}
            allLabel='No driver'
            placeholder='No driver'
            searchPlaceholder='Search drivers'
            emptyText='No staff with the Driver role'
            invalid={Boolean(errors.driver_user_id)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('driver_user_id', value)}
          />
        </FormField>
        <FormField id='bus-attendant' label='Attendant' error={errors.attendant_user_id}>
          <Combobox
            id='bus-attendant'
            label='Attendant'
            value={form.attendant_user_id}
            options={crewOptions(crew.data ?? [], 'attendant', bus?.id)}
            allLabel='No attendant'
            placeholder='No attendant'
            searchPlaceholder='Search attendants'
            emptyText='No staff with the Bus attendant role'
            invalid={Boolean(errors.attendant_user_id)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('attendant_user_id', value)}
          />
        </FormField>
        {DATES.map((item) => (
          <FormField
            key={item.key}
            id={`bus-${item.key}`}
            label={item.label}
            error={errors[item.key]}
          >
            <Input
              id={`bus-${item.key}`}
              type='date'
              value={form[item.key as DateKey]}
              aria-invalid={Boolean(errors[item.key]) || undefined}
              onChange={(event) => set(item.key as DateKey, event.target.value)}
            />
          </FormField>
        ))}
        <FormField id='bus-status' label='Status' className='sm:col-span-2'>
          <Combobox
            id='bus-status'
            label='Status'
            value={form.status}
            options={STATUS_OPTIONS}
            placeholder='Choose status'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('status', (value ?? 'active') as VehicleStatus)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
