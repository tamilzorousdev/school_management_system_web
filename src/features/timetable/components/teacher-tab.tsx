import { UserRound } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeachers } from '@/features/setup/api'
import { cn } from '@/lib/utils'
import { useSpecialClasses } from '@/features/performance/api'
import { hoursText, weeklySpecialLoad } from '@/features/performance/special-week'
import { useTeacherTimetable } from '../api'
import { SlotContent, WeekGrid } from './week-grid'

export function TeacherTab({
  teacherId,
  onTeacherChange,
}: {
  teacherId?: number
  onTeacherChange: (teacherId: number | undefined) => void
}) {
  const teachers = useTeachers()
  const timetable = useTeacherTimetable(teacherId)
  const data = timetable.data?.teacher.id === teacherId ? timetable.data : undefined
  const specials = useSpecialClasses({ teacher_user_id: teacherId })
  const extra = weeklySpecialLoad(teacherId ? (specials.data ?? []) : [])

  useShortcut('app.refresh', () => void timetable.refetch())

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Combobox
          id='timetable-teacher'
          label='Teacher'
          value={teacherId ? String(teacherId) : undefined}
          placeholder='Choose a teacher'
          searchPlaceholder='Search teachers'
          options={(teachers.data ?? []).map((teacher) => ({
            value: String(teacher.id),
            label: teacher.name,
          }))}
          onChange={(value) => onTeacherChange(value ? Number(value) : undefined)}
          highlightSelected={false}
          className='sm:w-64'
        />
        {data && <Badge tone='info'>{data.periods_per_week} regular periods a week</Badge>}
        {data && (
          <Badge tone={extra.sessions ? 'warning' : 'neutral'}>
            {extra.sessions
              ? `${extra.sessions} special ${extra.sessions === 1 ? 'class' : 'classes'} a week · ${hoursText(extra.minutes)}`
              : 'No special classes'}
          </Badge>
        )}
      </div>
      {!teacherId ? (
        <Card>
          <EmptyState
            icon={UserRound}
            title='Choose a teacher'
            description='See the teacher’s week across every section they teach.'
          />
        </Card>
      ) : timetable.isError && !data ? (
        <Card>
          <ErrorState message={timetable.error.message} onRetry={() => timetable.refetch()} />
        </Card>
      ) : !data ? (
        <Skeleton className='h-[28rem] w-full rounded-xl' />
      ) : (
        <Card className={cn('min-w-0 overflow-hidden', timetable.isFetching && 'opacity-70')}>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='font-bold'>{data.teacher.name}</h2>
            <span className='text-xs text-muted-foreground'>Read only</span>
          </div>
          <WeekGrid
            label={`Timetable of ${data.teacher.name}`}
            periods={data.periods}
            slots={data.slots}
            renderSlot={(slot) => (
              <SlotContent
                code={slot.subject.code}
                title={slot.subject.name}
                lines={[`Class ${slot.section.name}`, slot.room]}
              />
            )}
            specials={specials.data ?? []}
            showSection
          />
        </Card>
      )}
    </div>
  )
}
