import {
  BookOpenCheck,
  CalendarOff,
  Coffee,
  Megaphone,
  MessagesSquare,
  Repeat,
  Star,
  UsersRound,
  Video,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Badge } from '@/components/ui/badge'
import { ConnectTiles } from '@/features/parent-preview/components/connect-screens'
import {
  AppCard,
  Metric,
  QueryView,
  ScreenEmpty,
  SectionTitle,
} from '@/features/parent-preview/components/phone-parts'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTeacherPreview, type TodayPeriod } from '../api'
import type { TeacherTab } from '../search'

const hhmm = (value: string) => value.slice(0, 5)

function PeriodRow({ period }: { period: TodayPeriod }) {
  if (period.is_break || period.kind === 'break') {
    return (
      <div className='flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground'>
        <Coffee className='size-4 shrink-0' />
        <span className='flex-1 truncate'>{period.name}</span>
        <span className='tabular'>
          {hhmm(period.start_time)}–{hhmm(period.end_time)}
        </span>
      </div>
    )
  }
  const teaching = period.kind === 'class' || period.kind === 'substitute'
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs',
        period.is_now && 'border-primary ring-1 ring-primary'
      )}
    >
      <span className='grid w-12 shrink-0 text-center'>
        <span className='tabular text-sm font-extrabold'>{hhmm(period.start_time)}</span>
        <span className='tabular text-[10px] text-muted-foreground'>{hhmm(period.end_time)}</span>
      </span>
      <span className='grid min-w-0 flex-1 gap-0.5'>
        <span className='flex items-center gap-1.5'>
          <span className='truncate text-sm font-bold'>
            {teaching ? (period.subject?.name ?? 'Class') : 'Free period'}
          </span>
          {period.kind === 'substitute' && (
            <Badge tone='warning' className='shrink-0'>
              <Repeat className='size-3' /> Proxy
            </Badge>
          )}
          {period.is_now && (
            <Badge tone='success' dot pulse className='shrink-0'>
              Now
            </Badge>
          )}
        </span>
        <span className='truncate text-[11px] text-muted-foreground'>
          {[period.name, period.section?.name, period.room].filter(Boolean).join(' · ')}
        </span>
      </span>
      {teaching && (
        <span className='grid shrink-0 text-right'>
          <span className='tabular text-sm font-bold'>
            {period.present != null ? `${period.present}/${period.students}` : period.students}
          </span>
          <span className='text-[10px] text-muted-foreground'>
            {period.attendance_marked ? 'present' : 'students'}
          </span>
        </span>
      )}
    </div>
  )
}

export function TeacherHomeScreen({
  staffId,
  onOpen,
}: {
  staffId: number
  onOpen: (tab: TeacherTab) => void
}) {
  const query = useTeacherPreview(staffId)
  return (
    <QueryView query={query}>
      {({ teacher, today, classes, counts }) => (
        <div className='grid gap-3'>
          {!teacher.can_sign_in && (
            <p className='rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning'>
              This teacher’s login is switched off, so the app would not open for them.
            </p>
          )}
          <AppCard className='grid gap-3'>
            <div className='flex items-center gap-3'>
              <Avatar
                name={teacher.name}
                src={teacher.photo_url}
                previewable
                subtitle={
                  teacher.employee_no
                    ? `Employee No: ${teacher.employee_no}`
                    : teacher.designation
                }
                className='size-14 shrink-0 rounded-2xl text-lg'
              />
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate text-lg leading-tight font-extrabold'>
                  {teacher.name}
                </span>
                <span className='truncate text-sm text-muted-foreground'>
                  {teacher.designation}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {teacher.employee_no}
                </span>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <Metric label='Periods' value={today.my_periods} />
              <Metric label='Classes' value={classes.length} />
              <Metric label='Homework' value={counts.diary_pending} />
            </div>
          </AppCard>

          <SectionTitle>School connect</SectionTitle>
          <ConnectTiles<TeacherTab>
            onOpen={onOpen}
            tiles={[
              {
                id: 'diary',
                icon: BookOpenCheck,
                label: 'Homework',
                count: counts.diary_pending,
                hint: 'Homework and remarks',
              },
              {
                id: 'meetings',
                icon: Video,
                label: 'Meetings',
                count: counts.meetings_upcoming,
                hint: counts.meetings_upcoming ? 'Upcoming' : 'With parents',
              },
              {
                id: 'chat',
                icon: MessagesSquare,
                label: 'Chat',
                count: counts.chat_unread,
                hint: counts.chat_unread ? 'Unread messages' : 'With parents',
              },
              {
                id: 'news',
                icon: Megaphone,
                label: 'News',
                count: counts.announcements_unread,
                hint: 'School notices',
              },
            ]}
          />

          <SectionTitle>
            {today.day_name}, {formatDate(today.date)}
          </SectionTitle>
          {!today.working_day ? (
            <ScreenEmpty
              icon={CalendarOff}
              title={today.holiday ?? 'No school today'}
              description='No periods on this day.'
            />
          ) : today.periods.length ? (
            <div className='grid gap-2'>
              {today.periods.map((period, index) => (
                <PeriodRow key={`${period.start_time}-${index}`} period={period} />
              ))}
            </div>
          ) : (
            <AppCard className='text-sm text-muted-foreground'>
              No bell schedule set for today.
            </AppCard>
          )}

          <SectionTitle>My classes</SectionTitle>
          {classes.length ? (
            <div className='grid gap-2'>
              {classes.map((item) => (
                <AppCard key={item.section_id} className='flex items-center gap-3 p-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                    <UsersRound className='size-5' />
                  </span>
                  <span className='grid min-w-0 flex-1'>
                    <span className='flex items-center gap-1.5'>
                      <span className='truncate text-sm font-bold'>
                        {item.class_name} - {item.section_name}
                      </span>
                      {item.is_class_teacher && (
                        <Badge tone='info' className='shrink-0'>
                          <Star className='size-3' /> Class teacher
                        </Badge>
                      )}
                    </span>
                    <span className='truncate text-[11px] text-muted-foreground'>
                      {item.subjects.map((subject) => subject.name).join(', ') || 'No subjects'}
                    </span>
                  </span>
                  <span className='tabular shrink-0 text-xs font-semibold text-muted-foreground'>
                    {item.student_count}
                  </span>
                </AppCard>
              ))}
            </div>
          ) : (
            <AppCard className='text-sm text-muted-foreground'>
              No classes assigned this year.
            </AppCard>
          )}
        </div>
      )}
    </QueryView>
  )
}
