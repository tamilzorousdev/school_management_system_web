import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBusOptions } from '@/features/transport/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { fleetApi, useTripMutation, type HandoverResult, type Trip } from '../api'

export function HandoverModal({
  trip,
  onClose,
  onDone,
}: {
  trip: Trip
  onClose: () => void
  onDone: (result: HandoverResult) => void
}) {
  const busOptions = useBusOptions().filter((option) => option.value !== String(trip.vehicle.id))
  const [busId, setBusId] = useState<string>()
  const [reason, setReason] = useState('')
  const [keep, setKeep] = useState(true)
  const [error, setError] = useState('')
  const handover = useTripMutation(
    (input: { vehicle_id: number; reason?: string; keep_for_today: boolean }) =>
      fleetApi.handover(trip.id, input)
  )

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Hand over to another bus'
      description={`${trip.vehicle.name} broke down? Another bus takes over the ${trip.route.name} trip for the stops that are left. Children already on board are carried over and their parents are told.`}
      formId='handover-form'
      submitText='Hand over'
      loading={handover.isPending}
    >
      <form
        id='handover-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!busId) {
            setError('Choose the bus that takes over')
            return
          }
          try {
            const result = await handover.mutateAsync({
              vehicle_id: Number(busId),
              keep_for_today: keep,
              ...(reason.trim() ? { reason: reason.trim() } : {}),
            })
            alerts.success(
              `${result.new_trip.vehicle.name} took over: ${result.on_board} on board, ${result.waiting} still to pick up. ${result.parents_told} parents told.`
            )
            if (result.warning) alerts.warning(result.warning)
            onDone(result)
          } catch (failure) {
            const problem = toApiError(failure)
            setError(problem.fieldErrors[0]?.message ?? problem.message)
          }
        }}
      >
        <FormField id='handover-bus' label='Bus that takes over' required error={error}>
          <Combobox
            id='handover-bus'
            label='Bus'
            value={busId}
            options={busOptions}
            placeholder='Choose a bus'
            searchPlaceholder='Search buses'
            emptyText='No other bus'
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => {
              setBusId(value)
              setError('')
            }}
          />
        </FormField>
        <FormField id='handover-reason' label='Reason' hint='Parents see it.'>
          <Input
            id='handover-reason'
            maxLength={200}
            placeholder='e.g. Puncture near Koyambedu'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
        <label className='flex items-start gap-3 rounded-lg border p-3 text-sm'>
          <Switch
            checked={keep}
            onCheckedChange={setKeep}
            aria-label='Keep this bus on the route for the rest of today'
          />
          <span className='grid gap-0.5'>
            <span className='font-semibold'>Keep this bus on the route for the rest of today</span>
            <span className='text-xs text-muted-foreground'>
              The other trip of the day also runs with it. Tomorrow the usual bus is back.
            </span>
          </span>
        </label>
      </form>
    </AppModal>
  )
}
