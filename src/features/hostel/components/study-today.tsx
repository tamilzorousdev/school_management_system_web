import { BookOpen, ListChecks } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useStudySchedules, useStudyToday, type StudyToday } from '../api-duty'
import type { StudySearch } from '../search-life'
import { daysText, shiftTime } from './duty-helpers'
import { shiftDate, todayIso } from './leave-helpers'
import { StudySheetView } from './study-sheet'

export function StudyTodayTab({
  hostelId,
  scheduleId,
  date,
  canMark,
  onPick,
}: {
  hostelId?: number
  scheduleId?: number
  date?: string
  canMark: boolean
  onPick: (patch: Partial<Pick<StudySearch, 'schedule_id' | 'date'>>) => void
}) {
  const sessions = useStudyToday(hostelId)
  const schedules = useStudySchedules({ hostel_id: hostelId })
  const today = todayIso()
  const minDate = shiftDate(today, -2)
  const day = date ?? today
  const list = sessions.data ?? []
  const options = (schedules.data ?? []).map((schedule) => ({
    value: String(schedule.id),
    label: schedule.name,
    hint: [
      schedule.hostel_name,
      daysText(schedule.days),
      shiftTime(schedule.start_time, schedule.end_time),
      schedule.active ? null : 'Off',
    ]
      .filter(Boolean)
      .join(' · '),
  }))

  const lockedReason =
    day > today
      ? 'Study attendance cannot be marked for a future date.'
      : day < minDate
        ? 'Study attendance can be changed only for today and the last 2 days. This sheet is read only.'
        : undefined

  return (
    <div className='grid gap-6'>
      <section className='grid gap-3'>
        <h2 className='text-sm font-semibold'>Running today</h2>
        {sessions.isPending ? (
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-32' />
            ))}
          </div>
        ) : sessions.isError ? (
          <ErrorState message={sessions.error.message} onRetry={() => sessions.refetch()} />
        ) : list.length === 0 ? (
          <Card className='px-4 py-6 text-center text-sm text-muted-foreground'>
            No study sessions today. Add schedules in the Schedules tab.
          </Card>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {list.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selected={session.id === scheduleId && day === today}
                onClick={() => onPick({ schedule_id: session.id, date: undefined })}
              />
            ))}
          </div>
        )}
      </section>

      <section className='grid gap-4'>
        <Card className='flex flex-row flex-wrap items-center gap-3 px-4 py-3'>
          <Combobox
            id='study-sheet-schedule'
            label='Study schedule'
            value={scheduleId ? String(scheduleId) : undefined}
            options={options}
            placeholder='Choose a study schedule'
            emptyText={schedules.isPending ? 'Loading…' : 'No study schedules yet'}
            highlightSelected={false}
            className='w-full sm:w-72'
            onChange={(value) => onPick({ schedule_id: value ? Number(value) : undefined })}
          />
          <DatePicker
            id='study-sheet-date'
            value={day}
            min={minDate}
            max={today}
            clearable={false}
            className='w-full sm:w-44'
            onChange={(value: string) =>
              onPick({ date: value && value !== today ? value : undefined })
            }
          />
        </Card>

        {scheduleId ? (
          <StudySheetView
            key={`${scheduleId}-${day}`}
            scheduleId={scheduleId}
            date={day}
            canMark={canMark}
            lockedReason={lockedReason}
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title='Choose a study session'
            description='Pick a session above or a schedule and date to mark study attendance.'
          />
        )}
      </section>
    </div>
  )
}

function SessionCard({
  session,
  selected,
  onClick,
}: {
  session: StudyToday
  selected: boolean
  onClick: () => void
}) {
  const counts = session.counts
  const done = counts.total > 0 && counts.unmarked === 0
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'grid gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40',
        selected && 'border-primary/60 ring-1 ring-primary/30'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='grid min-w-0 gap-0.5'>
          <span className='flex items-center gap-2 truncate font-semibold'>
            <BookOpen className='size-4 shrink-0 text-primary' />
            {session.name}
          </span>
          <span className='truncate text-xs text-muted-foreground'>
            {shiftTime(session.start_time, session.end_time)} ·{' '}
            {[session.hostel_name, session.block_name, session.hall_name]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <Badge tone={done ? 'success' : counts.marked ? 'warning' : 'neutral'} className='shrink-0'>
          {counts.marked}/{counts.total}
        </Badge>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        <Badge tone='success'>Present {counts.present}</Badge>
        <Badge tone='danger'>Absent {counts.absent}</Badge>
        <Badge tone='warning'>Late {counts.late}</Badge>
        <Badge tone='info'>Excused {counts.excused}</Badge>
      </div>
      {session.supervisor_name && (
        <span className='text-xs text-muted-foreground'>Supervisor: {session.supervisor_name}</span>
      )}
    </button>
  )
}
