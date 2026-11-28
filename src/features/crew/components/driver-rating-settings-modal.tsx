import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  transportApi,
  useTransportMutation,
  type DriverRatingSettings,
} from '@/features/transport/api'

export function DriverRatingSettingsModal({
  settings,
  onClose,
}: {
  settings: DriverRatingSettings
  onClose: () => void
}) {
  const [lowMax, setLowMax] = useState(settings.low_rating_max)
  const [minResponses, setMinResponses] = useState(String(settings.min_responses))
  const save = useTransportMutation(transportApi.saveDriverRatingSettings)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Driver rating settings'
      description='Decide which ratings count as low and when a driver sees their own average.'
      formId='driver-rating-settings-form'
      submitText='Save settings'
      loading={save.isPending}
    >
      <form
        id='driver-rating-settings-form'
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            await save.mutateAsync({
              low_rating_max: lowMax,
              min_responses: Math.min(50, Math.max(1, Number(minResponses) || 1)),
            })
            alerts.success('Driver rating settings saved')
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <div className='grid gap-1.5'>
          <span className='text-sm font-semibold'>A rating is low at or below</span>
          <SegmentedControl
            label='Low rating line'
            value={lowMax}
            onChange={setLowMax}
            options={[
              { value: 2, label: '2 stars' },
              { value: 3, label: '3 stars' },
            ]}
          />
          <span className='text-xs text-muted-foreground'>
            Parents must say what went wrong on a low rating, and you are alerted.
          </span>
        </div>
        <div className='grid gap-1.5'>
          <label htmlFor='driver-min-responses' className='text-sm font-semibold'>
            Ratings needed before a driver sees an average
          </label>
          <Input
            id='driver-min-responses'
            type='number'
            min={1}
            max={50}
            value={minResponses}
            onChange={(event) => setMinResponses(event.target.value)}
            className='w-28'
          />
        </div>
      </form>
    </AppModal>
  )
}
