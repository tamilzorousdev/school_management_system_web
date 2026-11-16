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
  type FuelType,
  type Ownership,
  type VehicleStatus,
  type VehicleType,
} from '../api'
import {
  DUTY_HINT,
  formErrors,
  FUEL_LABELS,
  OWNERSHIP_LABELS,
  toOptions,
  VEHICLE_TYPE_LABELS,
} from '../labels'

const REGISTRATION = /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{0,3}[ -]?\d{1,4}$/

const DATES = [
  { key: 'insurance_expiry', label: 'Insurance valid until' },
  { key: 'fitness_expiry', label: 'Fitness certificate valid until' },
  { key: 'permit_expiry', label: 'Permit valid until' },
  { key: 'puc_expiry', label: 'PUC certificate valid until' },
  { key: 'rc_expiry', label: 'RC valid until' },
  { key: 'road_tax_expiry', label: 'Road tax paid until' },
  { key: 'speed_governor_expiry', label: 'Speed governor certificate until' },
  { key: 'fire_extinguisher_expiry', label: 'Fire extinguisher refill due' },
  { key: 'first_aid_expiry', label: 'First aid kit refill due' },
] as const

const MOBILE = /^[6-9]\d{9}$/
const THIS_YEAR = new Date().getFullYear()

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
    vehicle_type: (bus?.vehicle_type ?? 'bus') as VehicleType,
    fuel_type: (bus?.fuel_type ?? undefined) as FuelType | undefined,
    manufacture_year: bus?.manufacture_year ? String(bus.manufacture_year) : '',
    chassis_no: bus?.chassis_no ?? '',
    engine_no: bus?.engine_no ?? '',
    ownership: (bus?.ownership ?? 'school') as Ownership,
    contractor_name: bus?.contractor_name ?? '',
    contractor_mobile: bus?.contractor_mobile ?? '',
    device_id: bus?.device ? String(bus.device.id) : undefined,
    driver_user_id: bus?.driver ? String(bus.driver.id) : undefined,
    attendant_user_id: bus?.attendant ? String(bus.attendant.id) : undefined,
    insurance_expiry: bus?.insurance_expiry ?? '',
    fitness_expiry: bus?.fitness_expiry ?? '',
    puc_expiry: bus?.puc_expiry ?? '',
    permit_expiry: bus?.permit_expiry ?? '',
    rc_expiry: bus?.rc_expiry ?? '',
    road_tax_expiry: bus?.road_tax_expiry ?? '',
    speed_governor_expiry: bus?.speed_governor_expiry ?? '',
    fire_extinguisher_expiry: bus?.fire_extinguisher_expiry ?? '',
    first_aid_expiry: bus?.first_aid_expiry ?? '',
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
    else if (bus && capacity < bus.students)
      next.capacity = `${bus.students} students ride this bus; seats cannot go below that`
    const year = form.manufacture_year ? Number(form.manufacture_year) : null
    if (year !== null && (!Number.isInteger(year) || year < 1980 || year > THIS_YEAR + 1))
      next.manufacture_year = `Enter a year from 1980 to ${THIS_YEAR + 1}`
    const contractor = form.ownership === 'contractor'
    if (contractor && !form.contractor_name.trim())
      next.contractor_name = 'Enter the contractor or travels name'
    if (contractor && form.contractor_mobile && !MOBILE.test(form.contractor_mobile))
      next.contractor_mobile = 'Enter a 10-digit mobile number'
    setErrors(next)
    if (Object.keys(next).length) return
    const input: BusInput = {
      registration_no: registration,
      name: form.name.trim(),
      make_model: form.make_model.trim() || null,
      capacity,
      vehicle_type: form.vehicle_type,
      fuel_type: form.fuel_type ?? null,
      manufacture_year: year,
      chassis_no: form.chassis_no.trim() || null,
      engine_no: form.engine_no.trim() || null,
      ownership: form.ownership,
      contractor_name: contractor ? form.contractor_name.trim() || null : null,
      contractor_mobile: contractor ? form.contractor_mobile || null : null,
      device_id: form.device_id ? Number(form.device_id) : null,
      driver_user_id: form.driver_user_id ? Number(form.driver_user_id) : null,
      attendant_user_id: form.attendant_user_id ? Number(form.attendant_user_id) : null,
      insurance_expiry: form.insurance_expiry || null,
      fitness_expiry: form.fitness_expiry || null,
      puc_expiry: form.puc_expiry || null,
      permit_expiry: form.permit_expiry || null,
      rc_expiry: form.rc_expiry || null,
      road_tax_expiry: form.road_tax_expiry || null,
      speed_governor_expiry: form.speed_governor_expiry || null,
      fire_extinguisher_expiry: form.fire_extinguisher_expiry || null,
      first_aid_expiry: form.first_aid_expiry || null,
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
          CAPACITY_BELOW_ASSIGNED: 'capacity',
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
      description='Registration, vehicle details, seats, tracker, crew and document dates. Upload the document copies from Documents on the bus list.'
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
        <FormField id='bus-type' label='Vehicle type'>
          <Combobox
            id='bus-type'
            label='Vehicle type'
            value={form.vehicle_type}
            options={toOptions(VEHICLE_TYPE_LABELS)}
            placeholder='Choose type'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('vehicle_type', (value ?? 'bus') as VehicleType)}
          />
        </FormField>
        <FormField id='bus-fuel' label='Fuel'>
          <Combobox
            id='bus-fuel'
            label='Fuel'
            value={form.fuel_type}
            options={toOptions(FUEL_LABELS)}
            allLabel='Not given'
            placeholder='Not given'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('fuel_type', value as FuelType | undefined)}
          />
        </FormField>
        <FormField id='bus-year' label='Year of manufacture' error={errors.manufacture_year}>
          <Input
            id='bus-year'
            type='number'
            inputMode='numeric'
            placeholder='2019'
            value={form.manufacture_year}
            aria-invalid={Boolean(errors.manufacture_year) || undefined}
            onChange={(event) => set('manufacture_year', event.target.value)}
          />
        </FormField>
        <FormField id='bus-chassis' label='Chassis number' error={errors.chassis_no}>
          <Input
            id='bus-chassis'
            maxLength={30}
            value={form.chassis_no}
            aria-invalid={Boolean(errors.chassis_no) || undefined}
            onChange={(event) => set('chassis_no', event.target.value.toUpperCase())}
          />
        </FormField>
        <FormField id='bus-engine' label='Engine number' error={errors.engine_no}>
          <Input
            id='bus-engine'
            maxLength={30}
            value={form.engine_no}
            aria-invalid={Boolean(errors.engine_no) || undefined}
            onChange={(event) => set('engine_no', event.target.value.toUpperCase())}
          />
        </FormField>
        <FormField id='bus-ownership' label='Owned by'>
          <Combobox
            id='bus-ownership'
            label='Owned by'
            value={form.ownership}
            options={toOptions(OWNERSHIP_LABELS)}
            placeholder='Choose'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => set('ownership', (value ?? 'school') as Ownership)}
          />
        </FormField>
        {form.ownership === 'contractor' && (
          <>
            <FormField
              id='bus-contractor'
              label='Contractor name'
              required
              error={errors.contractor_name}
            >
              <Input
                id='bus-contractor'
                maxLength={80}
                placeholder='Sri Murugan Travels'
                value={form.contractor_name}
                aria-invalid={Boolean(errors.contractor_name) || undefined}
                onChange={(event) => set('contractor_name', event.target.value)}
              />
            </FormField>
            <FormField
              id='bus-contractor-mobile'
              label='Contractor mobile'
              error={errors.contractor_mobile}
            >
              <Input
                id='bus-contractor-mobile'
                inputMode='numeric'
                maxLength={10}
                value={form.contractor_mobile}
                aria-invalid={Boolean(errors.contractor_mobile) || undefined}
                onChange={(event) =>
                  set('contractor_mobile', event.target.value.replace(/\D/g, ''))
                }
              />
            </FormField>
          </>
        )}
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
