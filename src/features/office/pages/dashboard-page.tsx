import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Bus,
  BusFront,
  CalendarCheck,
  CalendarX2,
  CircleCheck,
  DoorOpen,
  GraduationCap,
  HeartPulse,
  Hourglass,
  IndianRupee,
  Medal,
  MessageSquareWarning,
  Trophy,
  UserRoundX,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  officeApi,
  useOfficeDashboard,
  useOfficeMutation,
  type AoCard,
  type BusesToday,
  type ClassExam,
  type Defaulter,
  type OdToday,
  type OfficeDashboard,
  type OfficeMe,
  type PendingItem,
  type PendingKind,
  type TeachersToday,
} from '../api'
import { AoCardView } from '../components/ao-card'
import { CheckInControl } from '../components/check-in-control'
import {
  PENDING_LABEL,
  className,
  greeting,
  longDate,
  pendingAge,
  percent,
  plural,
  rupees,
} from '../labels'

const PENDING_ID = 'office-pending'

const PENDING_ICON: Record<PendingKind, LucideIcon> = {
  gate_pass: DoorOpen,
  fee_request: IndianRupee,
  student_leave: CalendarX2,
  grievance: MessageSquareWarning,
}

export function OfficeDashboardPage() {
  const dashboard = useOfficeDashboard()
  const me = useMe().data

  useShortcut('app.refresh', () => void dashboard.refetch())

  const data = dashboard.data

  if (dashboard.isError && !data)
    return (
      <Page>
        <Card>
          <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
        </Card>
      </Page>
    )

  if (!data)
    return (
      <Page>
        <DashboardSkeleton />
      </Page>
    )

  return (
    <Page className='gap-5 lg:gap-6'>
      <Hero data={data} name={me?.name} />
      <TodayStrip data={data} />
      <div className='grid gap-5 lg:grid-cols-2 lg:gap-6'>
        <TeachersCard teachers={data.teachers} />
        <BusesCard buses={data.buses} />
      </div>
      <div className='grid gap-5 lg:grid-cols-2 lg:gap-6'>
        <PendingCard items={data.pending_items} total={data.pending.total} />
        <DefaultersCard items={data.fees.top_defaulters} count={data.fees.defaulters} />
      </div>
      <div className='grid gap-5 lg:grid-cols-2 lg:gap-6'>
        <ExamsCard exams={data.exams} />
        <div className='grid content-start gap-5 lg:gap-6'>
          <OdCard od={data.od_today} />
          <AlertsCard data={data} />
        </div>
      </div>
      {data.aos && <AoStrip cards={data.aos} />}
    </Page>
  )
}

function roleLine(me: OfficeMe) {
  if (me.is_limited)
    return `Wing AO · ${me.wings.map((wing) => wing.name).join(', ') || 'No wing yet'}`
  return me.is_head_ao ? 'Head AO · whole school' : 'Admin · whole school'
}

function Hero({ data, name }: { data: OfficeDashboard; name: string | undefined }) {
  const now = useNow(60_000)
  const displayName = name?.trim()
  const { attendance, fees } = data
  const marked = attendance.sections_marked > 0 && attendance.percent !== null

  return (
    <section
      aria-label='Today at a glance'
      className='relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to p-5 text-hero-foreground shadow-sm sm:p-7'
    >
      <div className='pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-hero-foreground/[0.07]' />
      <div className='pointer-events-none absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-hero-foreground/[0.05]' />
      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end'>
        <div className='grid min-w-0 gap-4'>
          <div className='grid min-w-0 gap-1.5'>
            <p className='text-xs font-bold tracking-[0.14em] text-hero-foreground/70 uppercase'>
              {longDate(data.me.today)}
            </p>
            <h1 className='text-2xl font-extrabold tracking-tight text-balance sm:text-3xl'>
              {greeting(now)}
              {displayName ? `, ${displayName}` : ''}
            </h1>
            <p
              data-testid='office-scope'
              className='min-w-0 text-sm font-semibold break-words text-hero-foreground/85'
            >
              {roleLine(data.me)}
            </p>
          </div>
          <CheckInControl />
        </div>
        <div className='grid gap-2 sm:grid-cols-3 sm:gap-3 xl:w-[560px]'>
          <HeroFigure
            label='Students'
            value={formatNumber(data.students)}
            hint={plural(data.me.wings.length, 'wing')}
            link={<Link to='/office' search={{ page: 1 }} aria-label='Open classes and students' />}
          />
          <HeroFigure
            label='Attendance today'
            value={marked ? percent(attendance.percent) : 'Not marked'}
            small={!marked}
            hint={`${attendance.sections_marked}/${attendance.sections_total} sections`}
            link={
              <Link
                to='/attendance'
                search={{ tab: 'students', leave: 'student', page: 1 }}
                aria-label='Open attendance'
              />
            }
          />
          <HeroFigure
            label='Fee due'
            value={rupees(fees.due)}
            hint={plural(fees.defaulters, 'defaulter')}
            link={
              <Link to='/fees' search={{ tab: 'dues', overdue: true }} aria-label='Open fee dues' />
            }
          />
        </div>
      </div>
    </section>
  )
}

function HeroFigure({
  label,
  value,
  hint,
  small,
  link,
}: {
  label: string
  value: string
  hint: string
  small?: boolean
  link: ReactNode
}) {
  return (
    <div className='relative flex min-w-0 items-center justify-between gap-3 rounded-xl bg-hero-foreground/10 px-4 py-3 ring-1 ring-hero-foreground/15 transition-colors ring-inset hover:bg-hero-foreground/15 sm:grid sm:content-start sm:justify-normal sm:gap-1 sm:p-4 [&>a]:absolute [&>a]:inset-0 [&>a]:rounded-xl [&>a]:outline-none [&>a:focus-visible]:ring-[3px] [&>a:focus-visible]:ring-hero-foreground/60'>
      <span className='grid min-w-0 gap-0.5 sm:contents'>
        <span className='truncate text-xs font-semibold text-hero-foreground/75 sm:order-1'>
          {label}
        </span>
        <span className='truncate text-xs text-hero-foreground/75 sm:order-3'>{hint}</span>
      </span>
      <span
        className={cn(
          'tabular shrink-0 truncate font-extrabold tracking-tight sm:order-2',
          small ? 'text-lg sm:leading-9' : 'text-2xl sm:text-3xl'
        )}
      >
        {value}
      </span>
      {link}
    </div>
  )
}

function TodayStrip({ data }: { data: OfficeDashboard }) {
  const { fees, pending } = data
  const scrollToPending = () =>
    document.getElementById(PENDING_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section aria-label='Today' className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4'>
      <Tile
        icon={IndianRupee}
        tone='success'
        label='Collected today'
        value={rupees(fees.collected_today)}
        hint='Fee payments'
      />
      <Tile
        icon={Wallet}
        tone='success'
        label='This month'
        value={rupees(fees.collected_month)}
        hint='Fees collected'
      />
      <Tile
        icon={UserRoundX}
        tone='warning'
        label='Staff on leave'
        value={formatNumber(data.staff_on_leave)}
        hint='Whole school, today'
      />
      <Tile
        icon={Hourglass}
        tone={pending.overdue ? 'danger' : 'info'}
        label='Pending approvals'
        value={formatNumber(pending.total)}
        hint={
          pending.overdue ? (
            <span className='font-semibold text-destructive'>{pending.overdue} over 1 day</span>
          ) : pending.total ? (
            'All under 1 day'
          ) : (
            'All caught up'
          )
        }
        onClick={scrollToPending}
      />
    </section>
  )
}

const TONE_ICON = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

type Tone = keyof typeof TONE_ICON

function Tile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  onClick,
}: {
  icon: LucideIcon
  tone: Tone
  label: string
  value: string
  hint: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      <span className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-md sm:size-7 sm:rounded-lg',
            TONE_ICON[tone]
          )}
        >
          <Icon className='size-3.5' />
        </span>
        <span className='truncate text-xs font-semibold text-muted-foreground'>{label}</span>
      </span>
      <span className='tabular truncate text-xl font-extrabold tracking-tight sm:text-2xl'>
        {value}
      </span>
      <span className='truncate text-xs text-muted-foreground'>{hint}</span>
    </>
  )
  const base =
    'grid min-w-0 content-start gap-2 rounded-xl border bg-card p-3.5 text-left sm:p-4 text-card-foreground shadow-xs'
  if (onClick)
    return (
      <button
        type='button'
        onClick={onClick}
        className={cn(
          base,
          'cursor-pointer transition-colors outline-none hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40'
        )}
      >
        {body}
      </button>
    )
  return <div className={base}>{body}</div>
}

function Section({
  title,
  aside,
  children,
  className: extra,
  ...props
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  id?: string
  'data-testid'?: string
}) {
  return (
    <Card className={cn('min-w-0 gap-4 p-5', extra)} {...props}>
      <div className='flex min-h-7 flex-wrap items-center justify-between gap-2'>
        <h2 className='text-sm font-bold tracking-tight'>{title}</h2>
        {aside && <div className='flex items-center gap-2'>{aside}</div>}
      </div>
      {children}
    </Card>
  )
}

function Figure({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground'>
        <span className={cn('size-2 shrink-0 rounded-full', dot)} />
        <span className='truncate'>{label}</span>
      </span>
      <span className='tabular text-2xl font-extrabold tracking-tight'>{formatNumber(value)}</span>
    </div>
  )
}

function SplitBar({ parts, total }: { parts: { value: number; color: string }[]; total: number }) {
  return (
    <div className='flex h-2 w-full overflow-hidden rounded-full bg-muted' aria-hidden>
      {total > 0 &&
        parts.map((part) =>
          part.value > 0 ? (
            <span
              key={part.color}
              className={part.color}
              style={{ width: `${(part.value / total) * 100}%` }}
            />
          ) : null
        )}
    </div>
  )
}

function TeachersCard({ teachers }: { teachers: TeachersToday }) {
  return (
    <Section
      title='Teachers today'
      data-testid='office-teachers'
      aside={<Badge tone='neutral'>{plural(teachers.total, 'teacher')}</Badge>}
    >
      {teachers.total ? (
        <div className='grid gap-4'>
          <SplitBar
            total={teachers.total}
            parts={[
              { value: teachers.present, color: 'bg-success' },
              { value: teachers.late, color: 'bg-warning' },
              { value: teachers.on_leave, color: 'bg-info' },
            ]}
          />
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <Figure label='Present' value={teachers.present} dot='bg-success' />
            <Figure label='Late' value={teachers.late} dot='bg-warning' />
            <Figure label='On leave' value={teachers.on_leave} dot='bg-info' />
            <Figure
              label='Not checked in'
              value={teachers.not_checked_in}
              dot='bg-muted-foreground/40'
            />
          </div>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>No teachers in your wings yet</p>
      )}
    </Section>
  )
}

function BusesCard({ buses }: { buses: BusesToday }) {
  if (!buses.buses)
    return (
      <div
        data-testid='office-buses'
        className='flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-sm text-muted-foreground'
      >
        <Bus className='size-4' />
        No school buses for your wings
      </div>
    )

  return (
    <Section
      title='Buses today'
      data-testid='office-buses'
      aside={
        <>
          {buses.late > 0 && <Badge tone='danger'>{buses.late} late</Badge>}
          <Badge tone='neutral'>{plural(buses.students, 'student')} by bus</Badge>
        </>
      }
    >
      <div className='grid gap-4'>
        <SplitBar
          total={buses.buses}
          parts={[
            { value: buses.reached, color: 'bg-success' },
            { value: buses.running, color: 'bg-info' },
          ]}
        />
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <Figure label='Buses' value={buses.buses} dot='bg-primary' />
          <Figure label='Reached' value={buses.reached} dot='bg-success' />
          <Figure label='Running' value={buses.running} dot='bg-info' />
          <Figure label='Not started' value={buses.not_started} dot='bg-muted-foreground/40' />
        </div>
        {buses.not_boarded.length > 0 && (
          <div className='grid gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3'>
            <span className='text-xs font-bold text-destructive'>
              Not boarded (no leave) · {buses.not_boarded.length}
            </span>
            <ul className='grid gap-1.5'>
              {buses.not_boarded.slice(0, 4).map((student) => (
                <li key={student.student_id} className='flex min-w-0 items-center gap-2 text-sm'>
                  <Link
                    {...studentLink(student.student_id)}
                    className='min-w-0 truncate font-semibold text-destructive hover:underline'
                  >
                    {student.name}
                  </Link>
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {student.class_section ?? 'Not placed'}
                  </span>
                  <span className='ml-auto min-w-0 truncate text-xs text-muted-foreground'>
                    {student.route}
                  </span>
                </li>
              ))}
            </ul>
            {buses.not_boarded.length > 4 && (
              <span className='text-xs text-muted-foreground'>
                and {buses.not_boarded.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </Section>
  )
}

function studentLink(studentId: number) {
  return {
    to: '/office/students/$studentId' as const,
    params: { studentId: String(studentId) },
    search: { tab: 'overview' as const },
  }
}

const ROW_LINK =
  'flex min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40'

function PendingLink({ item, children }: { item: PendingItem; children: ReactNode }) {
  if (item.kind === 'gate_pass')
    return (
      <Link to='/gate' search={{ tab: 'passes', page: 1, status: 'pending' }} className={ROW_LINK}>
        {children}
      </Link>
    )
  if (item.kind === 'fee_request')
    return (
      <Link
        to='/fees'
        search={{ tab: 'approvals', request_status: 'pending' }}
        className={ROW_LINK}
      >
        {children}
      </Link>
    )
  if (item.kind === 'student_leave')
    return (
      <Link
        to='/attendance'
        search={{ tab: 'leave', leave: 'student', status: 'pending', page: 1 }}
        className={ROW_LINK}
      >
        {children}
      </Link>
    )
  return (
    <Link to='/grievances' search={{ page: 1, grievance: item.id }} className={ROW_LINK}>
      {children}
    </Link>
  )
}

function PendingCard({ items, total }: { items: PendingItem[]; total: number }) {
  const shown = items.slice(0, 5)
  return (
    <Section
      title='Pending approvals'
      id={PENDING_ID}
      data-testid='office-pending'
      className='scroll-mt-20'
      aside={total > 0 && <Badge tone='neutral'>{formatNumber(total)} pending</Badge>}
    >
      {shown.length ? (
        <div className='grid gap-2'>
          <ul className='-mx-2 -my-2.5 grid divide-y'>
            {shown.map((item) => {
              const Icon = PENDING_ICON[item.kind]
              return (
                <li key={`${item.kind}-${item.id}`}>
                  <PendingLink item={item}>
                    <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground'>
                      <Icon className='size-4' />
                    </span>
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='truncate text-sm font-semibold'>{item.title}</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {[item.student ?? PENDING_LABEL[item.kind], item.class_section]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-right text-xs font-semibold',
                        item.age_hours >= 24 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {pendingAge(item.age_hours)}
                    </span>
                  </PendingLink>
                </li>
              )
            })}
          </ul>
          {total > shown.length && (
            <p className='pt-2 text-xs text-muted-foreground'>
              Oldest {shown.length} of {formatNumber(total)} shown
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          className='py-8'
          icon={CircleCheck}
          title='No pending approvals'
          description='You are all caught up.'
        />
      )}
    </Section>
  )
}

function DefaultersCard({ items, count }: { items: Defaulter[]; count: number }) {
  const shown = items.slice(0, 5)
  return (
    <Section
      title='Fee defaulters'
      data-testid='office-defaulters'
      aside={
        count > 0 && (
          <Button variant='ghost' size='sm' className='-my-1 -mr-2' asChild>
            <Link to='/fees' search={{ tab: 'dues', overdue: true }}>
              All {formatNumber(count)}
              <ArrowRight />
            </Link>
          </Button>
        )
      }
    >
      {shown.length ? (
        <ul className='-mx-2 -my-2.5 grid divide-y'>
          {shown.map((item, index) => (
            <li key={item.student_id}>
              <Link {...studentLink(item.student_id)} className={ROW_LINK}>
                <span className='tabular grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground'>
                  {index + 1}
                </span>
                <span className='grid min-w-0 flex-1 gap-0.5'>
                  <span className='truncate text-sm font-semibold'>{item.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {item.class_section ?? 'Not placed'}
                  </span>
                </span>
                <span className='tabular shrink-0 text-right text-sm font-bold'>
                  {rupees(item.due)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className='py-8'
          icon={IndianRupee}
          title='No fee dues'
          description='Every student is paid up.'
        />
      )}
    </Section>
  )
}

function ExamsCard({ exams }: { exams: ClassExam[] }) {
  return (
    <Section
      title='Latest exams'
      data-testid='office-exams'
      aside={
        exams.length > 0 && <Badge tone='neutral'>{plural(exams.length, 'class', 'classes')}</Badge>
      }
    >
      {exams.length ? (
        <ul className='grid divide-y'>
          {exams.map((exam) => {
            const top = exam.toppers.find((topper) => topper.rank === 1) ?? exam.toppers[0]
            return (
              <li
                key={exam.class_id}
                className='grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]'
              >
                <span className='grid min-w-0'>
                  <span className='truncate text-sm font-bold'>{className(exam.class_name)}</span>
                  <span className='truncate text-xs text-muted-foreground'>{exam.exam.name}</span>
                </span>
                <span className='tabular text-right sm:order-last'>
                  <span className='block text-sm font-bold'>{percent(exam.average)}</span>
                  <span className='block text-[11px] text-muted-foreground'>average</span>
                </span>
                {top ? (
                  <span className='col-span-2 flex min-w-0 items-center gap-1.5 text-xs sm:col-span-1 sm:text-sm'>
                    <Trophy className='size-3.5 shrink-0 text-warning' />
                    <Link
                      {...studentLink(top.student_id)}
                      className='min-w-0 truncate font-medium text-primary hover:underline'
                    >
                      {top.name}
                    </Link>
                    <span className='tabular shrink-0 text-muted-foreground'>
                      {percent(top.percent)}
                    </span>
                  </span>
                ) : (
                  <span className='col-span-2 text-xs text-muted-foreground sm:col-span-1'>
                    No toppers yet
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState className='py-8' icon={GraduationCap} title='No published exam yet' />
      )}
    </Section>
  )
}

function OdCard({ od }: { od: OdToday }) {
  return (
    <Section
      title='On sports OD today'
      data-testid='office-od'
      aside={<Badge tone={od.count ? 'info' : 'neutral'}>{plural(od.count, 'student')}</Badge>}
    >
      {od.students.length ? (
        <ul className='grid divide-y'>
          {od.students.slice(0, 3).map((student) => (
            <li
              key={`${student.id}-${student.student_id}`}
              className='flex min-w-0 items-center gap-3 py-2 first:pt-0 last:pb-0'
            >
              <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground'>
                <Medal className='size-4' />
              </span>
              <span className='grid min-w-0 flex-1'>
                <Link
                  {...studentLink(student.student_id)}
                  className='truncate text-sm font-semibold hover:underline'
                >
                  {student.name}
                </Link>
                <span className='truncate text-xs text-muted-foreground'>
                  {[student.class_section, student.sport_name, student.venue]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              {student.session && (
                <Badge tone='neutral' className='capitalize'>
                  {student.session}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Medal className='size-4' />
          No students on OD today
        </p>
      )}
      {od.count > 3 && <p className='text-xs text-muted-foreground'>and {od.count - 3} more</p>}
    </Section>
  )
}

function AlertsCard({ data }: { data: OfficeDashboard }) {
  const pills = [
    { key: 'low', label: 'Low attendance', value: data.alerts.low_attendance, icon: CalendarCheck },
    { key: 'hold', label: 'Bus passes on hold', value: data.alerts.passes_on_hold, icon: BusFront },
    { key: 'health', label: 'Health alerts', value: data.alerts.health_alerts, icon: HeartPulse },
  ]
  return (
    <Section title='Alerts' data-testid='office-alerts'>
      <div className='grid grid-cols-3 gap-2'>
        {pills.map((pill) => (
          <div
            key={pill.key}
            className={cn(
              'grid min-w-0 content-start gap-1 rounded-lg border px-3 py-2.5',
              pill.value
                ? 'border-destructive/25 bg-destructive/5 text-destructive'
                : 'bg-muted/40 text-muted-foreground'
            )}
          >
            <span className='flex items-center justify-between gap-2'>
              <pill.icon className='size-4 shrink-0' />
              <span
                className={cn(
                  'tabular text-lg leading-6 font-extrabold',
                  !pill.value && 'text-card-foreground'
                )}
              >
                {pill.value}
              </span>
            </span>
            <span className='text-xs leading-tight font-semibold'>{pill.label}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function AoStrip({ cards }: { cards: AoCard[] }) {
  const navigate = useNavigate()
  const now = useNow(30_000)
  const [remindingId, setRemindingId] = useState<number | null>(null)
  const remind = useOfficeMutation((userId: number) => officeApi.remind(userId))

  const sendReminder = async (card: AoCard) => {
    setRemindingId(card.user.id)
    try {
      const result = await remind.mutateAsync(card.user.id)
      alerts.success(result.message, {
        description: `${card.user.name} has ${result.pending} pending`,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setRemindingId(null)
    }
  }

  return (
    <Section
      title='AOs today'
      data-testid='office-aos'
      aside={
        <Button variant='ghost' size='sm' className='-my-1 -mr-2' asChild>
          <Link to='/office/monitor' search={{}}>
            Open AO monitor
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      {cards.length ? (
        <div className='-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2'>
          {cards.map((card) => (
            <div key={card.user.id} className='w-[min(300px,80vw)] shrink-0 snap-start'>
              <AoCardView
                card={card}
                now={now}
                onOpen={() => navigate({ to: '/office/monitor', search: { ao: card.user.id } })}
                onRemind={() => sendReminder(card)}
                reminding={remindingId === card.user.id}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Users className='size-4' />
          No AOs yet
        </p>
      )}
    </Section>
  )
}

function DashboardSkeleton() {
  return (
    <div className='grid gap-5 lg:gap-6' aria-busy='true' aria-label='Loading dashboard'>
      <Skeleton className='h-56 rounded-2xl sm:h-48' />
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-[104px] rounded-xl' />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className='grid gap-5 lg:grid-cols-2 lg:gap-6'>
          <Skeleton className='h-56 rounded-xl' />
          <Skeleton className='h-56 rounded-xl' />
        </div>
      ))}
    </div>
  )
}
