import { Badge } from '@/components/ui/badge'
import { DateStepper } from '@/features/attendance/components/date-stepper'
import { today } from '@/features/attendance/labels'

export function OpsDayBar({
  id,
  day,
  live,
  onChange,
}: {
  id: string
  day: string
  live: boolean
  onChange: (date: string | undefined) => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <DateStepper
        id={id}
        value={day}
        onChange={(value) => onChange(value === today() ? undefined : value)}
      />
      {live ? (
        <Badge tone='success' dot pulse title='Refreshes every 30 seconds'>
          Live
        </Badge>
      ) : (
        <Badge>Past day</Badge>
      )}
    </div>
  )
}
