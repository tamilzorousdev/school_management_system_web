import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { transportApi, useBusOptions, useTransportMutation, type BusRoute } from '../api'

export function SwapBusModal({ route, onClose }: { route: BusRoute; onClose: () => void }) {
  const busOptions = useBusOptions().filter(
    (option) => option.value !== String(route.vehicle?.id ?? '')
  )
  const [busId, setBusId] = useState<string>()
  const [date, setDate] = useState(today())
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clash, setClash] = useState<string | null>(null)
  const swap = useTransportMutation(
    (input: { vehicle_id: number; date: string; reason?: string; force?: boolean }) =>
      transportApi.swapBus(route.id, input)
  )

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Bus for a day on ${route.code}`}
      description={`Another bus runs ${route.name} for one day, for example when ${route.vehicle?.name ?? 'the usual bus'} breaks down. The next day the usual bus is back. Parents and both crews get a push.`}
      formId='swap-bus-form'
      submitText={clash ? 'Change anyway' : 'Change bus'}
      loading={swap.isPending}
    >
      <form
        id='swap-bus-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!busId) next.vehicle_id = 'Choose the bus that runs the route'
          if (!date) next.date = 'Choose the day'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const saved = await swap.mutateAsync({
              vehicle_id: Number(busId),
              date,
              ...(reason.trim() ? { reason: reason.trim() } : {}),
              ...(clash ? { force: true } : {}),
            })
            if (saved.warning)
              alerts.warning(`${saved.warning}. Its own parents were told it may be late.`)
            alerts.success(
              `${saved.vehicle.name} runs ${route.code} on that day. ${saved.parents_told} parents told.`
            )
            onClose()
          } catch (error) {
            const problem = toApiError(error)
            const first = problem.fieldErrors[0]
            if (first) setErrors({ [first.field]: first.message })
            else if (problem.code === 'BUS_TIME_CLASH' || problem.code === 'CREW_TIME_CLASH')
              setClash(problem.message.replace(/\. Change anyway if you must\.$/, ''))
            else alerts.error(problem.message)
          }
        }}
      >
        <FormField
          id='swap-bus'
          label='Bus that runs it'
          required
          error={errors.vehicle_id}
          className='sm:col-span-2'
        >
          <Combobox
            id='swap-bus'
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
              setClash(null)
            }}
          />
        </FormField>
        {clash && (
          <p
            role='alert'
            className='rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm sm:col-span-2'
          >
            {clash}. In an emergency you can change anyway: the parents of that route are told the
            bus may be late.
          </p>
        )}
        <FormField id='swap-date' label='Day' required error={errors.date}>
          <Input
            id='swap-date'
            type='date'
            min={today()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </FormField>
        <FormField id='swap-reason' label='Reason' hint='Parents see it.' error={errors.reason}>
          <Input
            id='swap-reason'
            maxLength={200}
            placeholder='e.g. Bus 1 broke down'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
