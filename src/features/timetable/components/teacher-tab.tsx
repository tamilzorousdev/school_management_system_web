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
        <Card
          className={cn(
            'min-w-0 overflow-hidden shadow-xs transition-opacity',
            timetable.isFetching && 'opacity-70'
          )}
        >
          <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5'>
            <div className='flex items-center gap-3'>
              <div className='grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20'>
                <UserRound className='size-5' />
              </div>
              <div className='grid gap-0.5'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-sm font-bold tracking-tight text-foreground sm:text-base'>
                    {data.teacher.name}
                  </h2>
                  <span className='rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200'>
                    {data.periods_per_week} regular periods / week
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Teacher's weekly schedule across all assigned classes and sections.
                </p>
              </div>
            </div>
            <span className='inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
              Teacher schedule
            </span>
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
