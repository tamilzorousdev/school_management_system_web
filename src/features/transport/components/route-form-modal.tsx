import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import {
  transportApi,
  useBusOptions,
  useTransportMutation,
  type BusRoute,
  type RouteDetail,
  type RouteInput,
} from '../api'
import { formErrors } from '../labels'

export function RouteFormModal({
  route,
  onClose,
  onCreated,
}: {
  route?: BusRoute
  onClose: () => void
  onCreated?: (route: RouteDetail) => void
}) {
  const busOptions = useBusOptions()
  const [code, setCode] = useState(route?.code ?? '')
  const [name, setName] = useState(route?.name ?? '')
  const [busId, setBusId] = useState(route?.vehicle ? String(route.vehicle.id) : undefined)
  const [active, setActive] = useState(route?.is_active ?? true)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useTransportMutation((input: RouteInput) =>
    route ? transportApi.updateRoute(route.id, input) : transportApi.createRoute(input)
  )

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={route ? `Edit route ${route.code}` : 'New route'}
      description={
        route ? undefined : 'Give the route a code and name. You add its stops on the map next.'
      }
      formId='route-form'
      submitText={route ? 'Save' : 'Create route'}
      loading={save.isPending}
    >
      <form
        id='route-form'
        noValidate
        className='grid gap-4 sm:grid-cols-[8rem_1fr]'
        onSubmit={async (event) => {
          event.preventDefault()
          const cleanCode = code.trim().toUpperCase()
          const next: Record<string, string> = {}
          if (!cleanCode) next.code = 'Enter a code, like R1'
          if (name.trim().length < 2) next.name = 'Enter the route name'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const saved = await save.mutateAsync({
              code: cleanCode,
              name: name.trim(),
              vehicle_id: busId ? Number(busId) : null,
              ...(route ? { is_active: active } : {}),
              ...(route && reason.trim() ? { reason: reason.trim() } : {}),
            })
            alerts.success(route ? `Route ${cleanCode} updated` : `Route ${cleanCode} created`)
            onClose()
            if (!route) onCreated?.(saved)
          } catch (error) {
            setErrors(formErrors(error, { ROUTE_EXISTS: 'code' }))
          }
        }}
      >
        <FormField id='route-code' label='Code' required error={errors.code}>
          <Input
            id='route-code'
            autoFocus
            placeholder='R3'
            maxLength={20}
            value={code}
            aria-invalid={Boolean(errors.code) || undefined}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </FormField>
        <FormField id='route-name' label='Route name' required error={errors.name}>
          <Input
            id='route-name'
            placeholder='Anna Nagar - School'
            maxLength={60}
            value={name}
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField
          id='route-bus'
          label='Bus'
          error={errors.vehicle_id}
          className='sm:col-span-2'
          hint='The bus that runs this route. You can change it later.'
        >
          <Combobox
            id='route-bus'
            label='Bus'
            value={busId}
            options={busOptions}
            allLabel='No bus yet'
            placeholder='No bus yet'
            searchPlaceholder='Search buses'
            emptyText='No buses yet'
            highlightSelected={false}
            className='sm:w-full'
            onChange={setBusId}
          />
        </FormField>
        {route && String(route.vehicle?.id ?? '') !== (busId ?? '') && (
          <FormField
            id='route-reason'
            label='Reason for the bus change'
            hint='Optional. Parents see it in their note. For one day only, use Bus for a day instead.'
            className='sm:col-span-2'
          >
            <Input
              id='route-reason'
              maxLength={200}
              placeholder='e.g. Bus 2 needs a new engine'
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </FormField>
        )}
        {route && (
          <div className='flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2'>
            <span className='grid gap-0.5'>
              <Label htmlFor='route-active'>Route is running</Label>
              <span className='text-xs text-muted-foreground'>
                Switch off a route that is not used this term.
              </span>
            </span>
            <Switch
              id='route-active'
              aria-label='Route is running'
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        )}
      </form>
    </AppModal>
  )
}
