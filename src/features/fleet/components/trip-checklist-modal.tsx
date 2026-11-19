import { Phone, UsersRound } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useTripChecklist,
  type BoardingMark,
  type ChecklistStudent,
  type ChecklistSummary,
} from '../api'
import { BOARDING_METHOD, RIDER_STATUS, TRIP_FLAG, TRIP_KIND, clock } from '../labels'

const SUMMARY: { key: keyof ChecklistSummary; label: string; alert?: boolean }[] = [
  { key: 'total', label: 'Riders' },
  { key: 'on_bus', label: 'On the bus' },
  { key: 'off_bus', label: 'Got off' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'away', label: 'Away today' },
  { key: 'not_boarded', label: 'Never got on', alert: true },
  { key: 'not_alighted', label: 'Not marked off', alert: true },
]

export function TripChecklistModal({
  tripId,
  onOpenChange,
}: {
  tripId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const checklist = useTripChecklist(tripId, true)
  const data = checklist.data
  return (
    <AppModal
      open={tripId !== null}
      onOpenChange={onOpenChange}
      size='xl'
      title='Boarding checklist'
      description={
        data
          ? `${data.trip.route.name} · ${data.trip.vehicle.name} · ${TRIP_KIND[data.trip.kind]} · ${formatDate(data.trip.trip_date)}`
          : 'Who got on and off this trip, as the attendant marked them.'
      }
    >
      {checklist.isPending ? (
        <Skeleton className='h-64' />
      ) : checklist.isError ? (
        <ErrorState message={checklist.error.message} onRetry={() => checklist.refetch()} />
      ) : !data?.students.length ? (
        <EmptyState icon={UsersRound} title='No students on this trip' className='py-6' />
      ) : (
        <div className='grid max-h-[70vh] gap-4 overflow-y-auto'>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7'>
            {SUMMARY.map((item) => (
              <div
                key={item.key}
                className={cn(
                  'grid rounded-xl border p-2.5',
                  item.alert &&
                    data.summary[item.key] > 0 &&
                    'border-destructive/30 bg-destructive/5'
                )}
              >
                <span className='tabular text-lg font-bold'>{data.summary[item.key]}</span>
                <span className='text-xs text-muted-foreground'>{item.label}</span>
              </div>
            ))}
          </div>
          <ul className='grid divide-y rounded-xl border'>
            {data.students.map((student) => (
              <ChecklistRow key={student.student_id} student={student} />
            ))}
          </ul>
        </div>
      )}
    </AppModal>
  )
}

function markText(label: string, mark: BoardingMark | null) {
  if (!mark) return null
  const where = mark.stop ? ` at ${mark.stop.name}` : ''
  const who = mark.recorded_by ? ` by ${mark.recorded_by.name}` : ''
  return `${label} ${clock(mark.at)}${where} · ${BOARDING_METHOD[mark.method]}${who}`
}

function ChecklistRow({ student }: { student: ChecklistStudent }) {
  const parent = student.parents[0]
  const marks = [markText('On', student.boarded), markText('Off', student.alighted)].filter(Boolean)
  return (
    <li className='flex flex-wrap items-start gap-x-3 gap-y-1 p-3'>
      <span className='grid min-w-0 flex-1 gap-0.5'>
        <span className='flex flex-wrap items-center gap-1.5'>
          <span className='truncate font-semibold'>{student.full_name}</span>
          {student.pass_status === 'on_hold' && <Badge tone='warning'>Pass on hold</Badge>}
        </span>
        <span className='truncate text-xs text-muted-foreground'>
          {[student.class_section, student.stop?.name].filter(Boolean).join(' · ')}
        </span>
        {marks.map((text) => (
          <span key={text} className='text-xs text-muted-foreground'>
            {text}
          </span>
        ))}
      </span>
      <span className='grid justify-items-end gap-1'>
        <span className='flex flex-wrap justify-end gap-1'>
          {student.flag ? (
            <Badge tone={TRIP_FLAG[student.flag].tone}>{TRIP_FLAG[student.flag].label}</Badge>
          ) : (
            <Badge tone={RIDER_STATUS[student.status].tone}>
              {student.status === 'away' && student.away_note
                ? student.away_note
                : RIDER_STATUS[student.status].label}
            </Badge>
          )}
        </span>
        {parent && (
          <a
            href={`tel:+91${parent.mobile}`}
            className='tabular flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
          >
            <Phone className='size-3' />
            {parent.name} · +91 {parent.mobile}
          </a>
        )}
      </span>
    </li>
  )
}
