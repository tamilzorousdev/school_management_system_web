import { useState } from 'react'
import {
  BookOpenCheck,
  BusFront,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Go,
  ClipboardCheck,
  IndianRupee,
  MapPin,
  Megaphone,
  MessagesSquare,
  UserRound,
  Video,
} from 'lucide-react'
import type { ChatThread } from '@/features/chat/api'
import type { Meeting } from '@/features/meetings/api'
import { Avatar } from '@/components/common/avatar'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { ATTENDANCE_STATUS, today } from '@/features/attendance/labels'
import { useStudentResults } from '@/features/exams/api'
import { useStudentFees } from '@/features/fees/api'
import { STUDENT_FEE_STATUS, wholeRupees } from '@/features/fees/labels'
import { useTrip } from '@/features/fleet/api'
import { STOP_STATUS } from '@/features/fleet/labels'
import { useStudent } from '@/features/students/api'
import { useRouteDetail } from '@/features/transport/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  parentBase,
  usePreviewBus,
  usePreviewHome,
  useStudentMonth,
  type ChildBus,
  type ChildBusStatus,
  type DayStatus,
  type MonthlyAttendance,
} from '../api'
import type { PhoneTab } from '../tabs'
import { usePreviewList, type DiaryFeedItem, type MyAnnouncement } from '../connect-api'
import { ConnectTiles } from './connect-screens'
import { AppCard, Metric, QueryView, ScreenEmpty, ScreenLoading, SectionTitle } from './phone-parts'

const BUS_TONE: Record<ChildBusStatus, string> = {
  no_trip: 'bg-muted text-muted-foreground',
  on_the_way: 'bg-info/12 text-info',
  approaching: 'bg-warning/15 text-warning',
  at_stop: 'bg-success/15 text-success',
  passed: 'bg-muted text-muted-foreground',
  trip_ended: 'bg-muted text-muted-foreground',
}

function BusHeadline({ bus, onOpen }: { bus: ChildBus; onOpen?: () => void }) {
  const body = (
    <>
      <span
        className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', BUS_TONE[bus.status])}
      >
        <BusFront className='size-6' />
      </span>
      <span className='grid min-w-0 flex-1 gap-0.5 text-left'>
        <span className='text-base leading-snug font-bold'>{bus.headline}</span>
        <span className='truncate text-xs text-muted-foreground'>
          {[bus.vehicle?.registration_no, bus.route.name].filter(Boolean).join(' · ')}
        </span>
      </span>
      {onOpen && <Go className='size-5 shrink-0 text-muted-foreground' />}
    </>
  )
  return onOpen ? (
    <button
      type='button'
      onClick={onOpen}
      className='flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs hover:bg-muted/50'
    >
      {body}
    </button>
  ) : (
    <AppCard className='flex items-center gap-3'>{body}</AppCard>
  )
}

function ChildPhoto({ name, url }: { name: string; url: string | null }) {
  return url ? (
    <img src={url} alt={name} className='size-16 shrink-0 rounded-2xl object-cover' />
  ) : (
    <Avatar name={name} className='size-16 rounded-2xl text-lg' />
  )
}

function Tile({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof CalendarCheck
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='grid min-h-24 min-w-0 content-between gap-2 rounded-2xl border bg-card p-3 text-left shadow-xs hover:bg-muted/50'
    >
      <Icon className='size-5 text-primary' />
      <span className='grid min-w-0'>
        <span className='tabular truncate text-lg font-extrabold'>{value}</span>
        <span className='truncate text-[11px] font-semibold text-muted-foreground'>{label}</span>
      </span>
    </button>
  )
}

function ParentConnect({
  studentId,
  onOpen,
}: {
  studentId: number
  onOpen: (tab: PhoneTab) => void
}) {
  const base = parentBase(studentId)
  const diary = usePreviewList<DiaryFeedItem>(base, 'diary', { page: 1, limit: 30 })
  const meetings = usePreviewList<Meeting>(base, 'meetings', {
    page: 1,
    limit: 1,
    scope: 'upcoming',
  })
  const chat = usePreviewList<ChatThread>(base, 'chat', { page: 1, limit: 50 })
  const news = usePreviewList<MyAnnouncement>(base, 'announcements', {
    page: 1,
    limit: 1,
    unread: true,
  })
  const unseen = diary.data?.items.filter((item) => !item.seen).length
  const unreadChat = chat.data?.items.reduce((sum, thread) => sum + thread.unread, 0)
  return (
    <>
      <SectionTitle>School connect</SectionTitle>
      <ConnectTiles<PhoneTab>
        onOpen={onOpen}
        tiles={[
          {
            id: 'diary',
            icon: BookOpenCheck,
            label: 'Homework',
            count: unseen,
            hint: diary.data ? `${diary.data.total} this year` : 'Homework and remarks',
          },
          {
            id: 'meetings',
            icon: Video,
            label: 'Meetings',
            count: meetings.data?.total,
            hint: meetings.data?.total ? 'Upcoming' : 'With teachers',
          },
          {
            id: 'chat',
            icon: MessagesSquare,
            label: 'Chat',
            count: unreadChat,
            hint: chat.data
              ? `${chat.data.total} ${chat.data.total === 1 ? 'conversation' : 'conversations'}`
              : 'With teachers',
          },
          {
            id: 'news',
            icon: Megaphone,
            label: 'News',
            count: news.data?.total,
            hint: 'School notices',
          },
        ]}
      />
    </>
  )
}

export function HomeScreen({
  studentId,
  onOpen,
}: {
  studentId: number
  onOpen: (tab: PhoneTab) => void
}) {
  const home = usePreviewHome(studentId)
  const student = useStudent(home.data && !home.data.child ? studentId : null)
  const bus = usePreviewBus(studentId)
  const month = useStudentMonth(studentId, today().slice(0, 7))
  const fees = useStudentFees(studentId)
  const results = useStudentResults(studentId)

  return (
    <QueryView query={home}>
      {(data) => {
        const child = data.child
        const fallback = student.data
        if (!child && student.isPending) return <ScreenLoading />
        const name = child?.full_name ?? fallback?.full_name ?? 'Student'
        const classText = child
          ? [child.class_name && `Class ${child.class_name}`, child.section_name]
              .filter(Boolean)
              .join(' - ')
          : [fallback?.class && `Class ${fallback.class.name}`, fallback?.section?.name]
              .filter(Boolean)
              .join(' - ')
        const status = data.today.status
        const latest = results.data?.[0]
        return (
          <div className='grid gap-3'>
            {!data.parent && (
              <p className='rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning'>
                No parent of this student signs in to the app yet. This is what they will see.
              </p>
            )}
            <AppCard className='grid gap-4'>
              <div className='flex items-center gap-3'>
                <ChildPhoto name={name} url={child?.photo_url ?? null} />
                <div className='grid min-w-0 gap-0.5'>
                  <span className='truncate text-lg leading-tight font-extrabold'>{name}</span>
                  <span className='truncate text-sm text-muted-foreground'>
                    {classText || 'No class yet'}
                    {(child?.roll_no ?? fallback?.roll_no)
                      ? ` · Roll ${child?.roll_no ?? fallback?.roll_no}`
                      : ''}
                  </span>
                  <span className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
                    <UserRound className='size-3.5 shrink-0' />
                    <span className='truncate'>
                      {child?.class_teacher
                        ? `Class teacher: ${child.class_teacher}`
                        : 'Class teacher not set'}
                    </span>
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5'>
                <span className='text-sm font-semibold'>Today</span>
                {status ? (
                  <Badge tone={ATTENDANCE_STATUS[status].tone} className='px-3 py-1 text-sm'>
                    {ATTENDANCE_STATUS[status].label}
                  </Badge>
                ) : (
                  <Badge className='px-3 py-1 text-sm'>Not marked yet</Badge>
                )}
              </div>
            </AppCard>

            {bus.isPending ? (
              <ScreenLoading rows={0} />
            ) : bus.data ? (
              <BusHeadline bus={bus.data} onOpen={() => onOpen('bus')} />
            ) : bus.isError ? null : (
              <AppCard className='flex items-center gap-3 text-sm text-muted-foreground'>
                <BusFront className='size-5' /> Does not use the school bus
              </AppCard>
            )}

            <div className='grid grid-cols-3 gap-2'>
              <Tile
                icon={CalendarCheck}
                label='This month'
                value={month.data?.percent != null ? `${month.data.percent}%` : '—'}
                onClick={() => onOpen('attendance')}
              />
              <Tile
                icon={IndianRupee}
                label={fees.data ? STUDENT_FEE_STATUS[fees.data.status].label : 'Fees'}
                value={fees.data ? wholeRupees(fees.data.balance) : '—'}
                onClick={() => onOpen('fees')}
              />
              <Tile
                icon={ClipboardCheck}
                label={latest ? latest.exam.name : 'Results'}
                value={latest?.percent != null ? `${latest.percent}%` : '—'}
                onClick={() => onOpen('results')}
              />
            </div>

            <ParentConnect studentId={studentId} onOpen={onOpen} />
          </div>
        )
      }}
    </QueryView>
  )
}

const DAY_STYLE: Record<DayStatus, string> = {
  present: 'bg-success/15 text-success',
  absent: 'bg-destructive/15 text-destructive',
  late: 'bg-warning/15 text-warning',
  half_day: 'bg-info/15 text-info',
  leave: 'bg-secondary text-secondary-foreground ring-1 ring-border',
  od: 'bg-info/15 text-info',
  not_marked: 'text-foreground',
  holiday: 'bg-muted text-muted-foreground',
  weekly_off: 'text-muted-foreground/60',
}

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: 'present', label: 'Present' },
  { status: 'absent', label: 'Absent' },
  { status: 'late', label: 'Late' },
  { status: 'half_day', label: 'Half day' },
  { status: 'leave', label: 'Leave' },
  { status: 'holiday', label: 'Holiday' },
]

const shiftMonth = (month: string, by: number) => {
  const [year, value] = month.split('-').map(Number)
  return new Date(Date.UTC(year, value - 1 + by, 1)).toISOString().slice(0, 7)
}

const daysOfMonth = (data: MonthlyAttendance) => {
  const known = new Map(data.days.map((day) => [day.date, day.status]))
  const [year, month] = data.month.split('-').map(Number)
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: count }, (_, index) => {
    const date = `${data.month}-${String(index + 1).padStart(2, '0')}`
    return { date, status: known.get(date) ?? null }
  })
}

const monthTitle = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

export function AttendanceScreen({ studentId }: { studentId: number }) {
  const current = today().slice(0, 7)
  const [month, setMonth] = useState(current)
  const query = useStudentMonth(studentId, month)

  return (
    <div className='grid gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <button
          type='button'
          aria-label='Previous month'
          onClick={() => setMonth(shiftMonth(month, -1))}
          className='grid size-11 place-items-center rounded-full hover:bg-muted'
        >
          <ChevronLeft className='size-5' />
        </button>
        <span className='text-base font-bold'>{monthTitle(month)}</span>
        <button
          type='button'
          aria-label='Next month'
          disabled={month >= current}
          onClick={() => setMonth(shiftMonth(month, 1))}
          className='grid size-11 place-items-center rounded-full hover:bg-muted disabled:opacity-30'
        >
          <ChevronRight className='size-5' />
        </button>
      </div>
      <QueryView query={query}>
        {(data) => {
          const firstWeekday = (new Date(`${data.month}-01T00:00:00Z`).getUTCDay() + 6) % 7
          return (
            <>
              <AppCard className='grid gap-3'>
                <div className='flex items-end justify-between gap-2'>
                  <div>
                    <div className='tabular text-4xl font-extrabold text-primary'>
                      {data.percent != null ? `${data.percent}%` : '—'}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {data.working_days} school days so far
                    </div>
                  </div>
                  <CalendarCheck className='size-8 text-primary/40' />
                </div>
                <div className='grid grid-cols-3 gap-2'>
                  <Metric label='Present' value={data.present} tone='success' />
                  <Metric
                    label='Absent'
                    value={data.absent}
                    tone={data.absent ? 'danger' : undefined}
                  />
                  <Metric label='Late / leave' value={data.late + data.leave} />
                </div>
              </AppCard>
              <AppCard>
                <div className='grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground'>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <span key={index}>{day}</span>
                  ))}
                </div>
                <div className='mt-1 grid grid-cols-7 gap-1'>
                  {Array.from({ length: firstWeekday }, (_, index) => (
                    <span key={`pad-${index}`} />
                  ))}
                  {daysOfMonth(data).map((day) => (
                    <span
                      key={day.date}
                      title={day.status ? `${day.date}: ${day.status.replace('_', ' ')}` : day.date}
                      className={cn(
                        'tabular grid aspect-square place-items-center rounded-lg text-sm font-semibold',
                        day.status ? DAY_STYLE[day.status] : 'font-medium text-muted-foreground/60'
                      )}
                    >
                      {Number(day.date.slice(8))}
                    </span>
                  ))}
                </div>
                <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1.5'>
                  {LEGEND.map((item) => (
                    <span
                      key={item.status}
                      className='flex items-center gap-1.5 text-[11px] text-muted-foreground'
                    >
                      <span className={cn('size-3 rounded', DAY_STYLE[item.status])} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </AppCard>
            </>
          )
        }}
      </QueryView>
    </div>
  )
}

interface StopRow {
  id: number
  name: string
  time: string | null
  status: keyof typeof STOP_STATUS | null
}

function StopList({ stops, mine }: { stops: StopRow[]; mine: number | undefined }) {
  return (
    <ol className='grid'>
      {stops.map((stop, index) => {
        const isMine = stop.id === mine
        const done = stop.status === 'departed' || stop.status === 'skipped'
        return (
          <li key={stop.id} className='relative flex gap-3 pb-4 last:pb-0'>
            {index < stops.length - 1 && (
              <span
                className={cn(
                  'absolute top-5 left-[9px] h-full w-0.5',
                  done ? 'bg-success/50' : 'bg-border'
                )}
              />
            )}
            <span
              className={cn(
                'relative mt-0.5 size-5 shrink-0 rounded-full border-4 border-card ring-2',
                stop.status ? STOP_STATUS[stop.status].pin : 'bg-muted-foreground',
                isMine ? 'ring-primary' : 'ring-border'
              )}
            />
            <div className='grid min-w-0 flex-1 gap-0.5'>
              <span
                className={cn(
                  'truncate text-sm',
                  isMine ? 'font-extrabold text-primary' : 'font-semibold'
                )}
              >
                {stop.name}
                {isMine && ' · your stop'}
              </span>
              <span className='text-xs text-muted-foreground'>
                {[stop.time, stop.status && STOP_STATUS[stop.status].label]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TripStops({ tripId, mine }: { tripId: number; mine: number | undefined }) {
  const trip = useTrip(tripId, true)
  return (
    <QueryView query={trip} rows={2}>
      {(data) => (
        <StopList
          mine={mine}
          stops={data.stop_list.map((stop) => ({
            id: stop.stop_id,
            name: stop.name,
            time: stop.planned_time,
            status: stop.status,
          }))}
        />
      )}
    </QueryView>
  )
}

function RouteStops({
  routeId,
  mine,
  drop,
}: {
  routeId: number
  mine: number | undefined
  drop: boolean
}) {
  const route = useRouteDetail(routeId)
  return (
    <QueryView query={route} rows={2}>
      {(data) => (
        <StopList
          mine={mine}
          stops={data.stop_list.map((stop) => ({
            id: stop.id,
            name: stop.name,
            time: drop ? stop.drop_time : stop.pickup_time,
            status: null,
          }))}
        />
      )}
    </QueryView>
  )
}

const BOARDING_TONE: Record<'boarded' | 'alighted', BadgeTone> = {
  boarded: 'success',
  alighted: 'info',
}

export function BusScreen({ studentId }: { studentId: number }) {
  const bus = usePreviewBus(studentId)
  return (
    <QueryView query={bus}>
      {(data) =>
        !data ? (
          <ScreenEmpty
            icon={BusFront}
            title='No school bus'
            description='This child does not use the school bus.'
          />
        ) : (
          <div className='grid gap-3'>
            <BusHeadline bus={data} />
            <div className='grid grid-cols-2 gap-2'>
              <Metric
                label='Arrives in'
                value={
                  data.eta_seconds != null
                    ? `${Math.max(1, Math.round(data.eta_seconds / 60))} min`
                    : '—'
                }
              />
              <Metric label='Pickup time' value={data.stop?.planned_time ?? '—'} />
            </div>
            {data.boarding && (
              <AppCard className='flex items-center justify-between gap-2'>
                <span className='text-sm font-semibold'>
                  {data.boarding.action === 'boarded' ? 'Boarded the bus' : 'Got down'}
                </span>
                <Badge tone={BOARDING_TONE[data.boarding.action]}>
                  {formatDateTime(data.boarding.occurred_at)}
                </Badge>
              </AppCard>
            )}
            {data.position_stale && data.trip?.status === 'active' && (
              <p className='rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning'>
                The bus location is more than 2 minutes old.
              </p>
            )}
            <SectionTitle>
              <span className='flex items-center gap-1.5'>
                <MapPin className='size-3.5' /> Stops
              </span>
            </SectionTitle>
            <AppCard>
              {data.trip ? (
                <TripStops tripId={data.trip.id} mine={data.stop?.stop_id} />
              ) : (
                <RouteStops routeId={data.route.id} mine={data.stop?.stop_id} drop={false} />
              )}
            </AppCard>
          </div>
        )
      }
    </QueryView>
  )
}
