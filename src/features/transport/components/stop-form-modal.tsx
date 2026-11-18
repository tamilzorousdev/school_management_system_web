import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'

export interface DraftStop {
  key: string
  id?: number
  name: string
  landmark: string | null
  lat: number
  lng: number
  pickup_time: string | null
  drop_time: string | null
  geofence_radius_m: number
  fee_override: number | null
}

export function StopFormModal({
  stop,
  isNew,
  routeFee,
  onSave,
  onClose,
}: {
  stop: DraftStop
  isNew: boolean
  routeFee: number
  onSave: (stop: DraftStop) => void
  onClose: () => void
}) {
  const [name, setName] = useState(stop.name)
  const [landmark, setLandmark] = useState(stop.landmark ?? '')
  const [pickup, setPickup] = useState(stop.pickup_time ?? '')
  const [drop, setDrop] = useState(stop.drop_time ?? '')
  const [radius, setRadius] = useState(String(stop.geofence_radius_m))
  const [fee, setFee] = useState(stop.fee_override === null ? '' : String(stop.fee_override))
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Add stop' : `Edit ${stop.name}`}
      description='Changes stay on this page until you press Save stops.'
      formId='stop-form'
      submitText={isNew ? 'Add stop' : 'Done'}
    >
      <form
        id='stop-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          const radiusValue = Number(radius)
          const feeValue = fee.trim() === '' ? null : Number(fee)
          const next: Record<string, string> = {}
          if (name.trim().length < 2) next.name = 'Enter the stop name'
          if (!Number.isInteger(radiusValue) || radiusValue < 30 || radiusValue > 1000)
            next.radius = 'Enter 30 to 1000 metres'
          if (
            feeValue !== null &&
            (!Number.isFinite(feeValue) || feeValue < 0 || feeValue > 100000)
          )
            next.fee = 'Enter an amount from 0 to 100000'
          setErrors(next)
          if (Object.keys(next).length) return
          onSave({
            ...stop,
            name: name.trim(),
            landmark: landmark.trim() || null,
            pickup_time: pickup || null,
            drop_time: drop || null,
            geofence_radius_m: radiusValue,
            fee_override: feeValue === null ? null : Math.round(feeValue * 100) / 100,
          })
        }}
      >
        <p className='flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2'>
          <MapPin className='size-3.5 shrink-0 text-primary' />
          <span className='tabular'>
            {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
          </span>
          <span>· drag the pin on the map to move it</span>
        </p>
        <FormField
          id='stop-name'
          label='Stop name'
          required
          error={errors.name}
          className='sm:col-span-2'
        >
          <Input
            id='stop-name'
            autoFocus
            maxLength={80}
            placeholder='Enter the stop name'
            value={name}
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField id='stop-landmark' label='Landmark' className='sm:col-span-2'>
          <Input
            id='stop-landmark'
            maxLength={120}
            placeholder='Opposite the park gate'
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
          />
        </FormField>
        <FormField id='stop-pickup' label='Morning pickup time'>
          <Input
            id='stop-pickup'
            type='time'
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
          />
        </FormField>
        <FormField id='stop-drop' label='Evening drop time'>
          <Input
            id='stop-drop'
            type='time'
            value={drop}
            onChange={(event) => setDrop(event.target.value)}
          />
        </FormField>
        <FormField
          id='stop-radius'
          label='Geofence radius (metres)'
          error={errors.radius}
          hint='The bus counts as at the stop inside this circle'
        >
          <Input
            id='stop-radius'
            type='number'
            inputMode='numeric'
            min={30}
            max={1000}
            step={10}
            value={radius}
            aria-invalid={Boolean(errors.radius) || undefined}
            onChange={(event) => setRadius(event.target.value)}
          />
        </FormField>
        <FormField
          id='stop-fee'
          label='Own monthly fee (₹)'
          error={errors.fee}
          hint={`Leave empty to use the route fee, ₹${routeFee.toLocaleString('en-IN')}`}
        >
          <Input
            id='stop-fee'
            type='number'
            inputMode='decimal'
            min={0}
            max={100000}
            placeholder={String(routeFee)}
            value={fee}
            aria-invalid={Boolean(errors.fee) || undefined}
            onChange={(event) => setFee(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
