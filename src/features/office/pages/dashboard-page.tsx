import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarCheck,
  CircleCheck,
  Clock,
  DoorOpen,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Info,
  Search,
  Shapes,
  TrendingDown,
  Trophy,
  Bus,
  UserRoundX,
  Wallet,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useNow } from '@/hooks/use-now'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatNumber } from '@/lib/format'
import {
  officeApi,
  useOfficeDashboard,
  useOfficeMutation,
  type AoCard,
  type ClassExam,
  type Defaulter,
  type OfficeDashboard,
  type OfficeMe,
  type PendingItem,
} from '../api'
import { AoCardView } from '../components/ao-card'
import { PENDING_LABEL, ageLabel, className, percent, rupees } from '../labels'

export function OfficeDashboardPage() {
  const dashboard = useOfficeDashboard()
  const navigate = useNavigate()
  const me = useMe().data

  useShortcut('app.refresh', () => void dashboard.refetch())

  const data = dashboard.data

  return (
    <Page>
      <PageHeader
        eyebrow='Office'
        title='Office dashboard'
        description='Today in your wings: attendance, fees, approvals waiting for you, exams and alerts.'
      />
      {dashboard.isError && !data ? (
        <Card>
          <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
        </Card>
      ) : (
        <>
          {data ? <ScopeBanner me={data.me} /> : <Skeleton className='h-10 rounded-lg' />}
          <InsightCards items={statCards(data, navigate)} loading={dashboard.isPending} />
          {data ? (
            <Sections data={data} canSearchStudents={can(me, 'students.view')} />
          ) : (
            <SectionsSkeleton />
          )}
        </>
      )}
    </Page>
  )
}

function ScopeBanner({ me }: { me: OfficeMe }) {
  const text = me.is_limited
    ? `Wing AO · ${me.wings.map((wing) => wing.name).join(', ') || 'No wing yet'}`
    : me.is_head_ao
      ? 'Head AO · whole school'
      : 'Whole school'
  return (
    <div
      role='status'
      data-testid='office-scope'
      className='flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info'
    >
      <Info className='mt-0.5 size-4 shrink-0' />
      <span className='min-w-0 font-semibold break-words'>{text}</span>
    </div>
  )
}

type Navigate = ReturnType<typeof useNavigate>

function statCards(data: OfficeDashboard | undefined, navigate: Navigate): Insight[] {
  const attendance = data?.attendance
  const fees = data?.fees
  const pending = data?.pending
  return [
    {
      key: 'students',
      label: 'Students',
      value: formatNumber(data?.students),
      icon: GraduationCap,
      tone: 'primary',
      onClick: () => navigate({ to: '/office', search: { page: 1 } }),
    },
    {
      key: 'attendance',
      label: 'Attendance today',
      value: percent(attendance?.percent),
      hint: attendance
        ? `${attendance.sections_marked}/${attendance.sections_total} sections marked · ${attendance.absent} absent`
        : undefined,
      icon: CalendarCheck,
      tone:
        attendance && attendance.sections_marked < attendance.sections_total ? 'warning' : 'info',
      onClick: () =>
        navigate({ to: '/attendance', search: { tab: 'students', leave: 'student', page: 1 } }),
    },
    {
      key: 'staff_on_leave',
      label: 'Staff on leave today',
      value: formatNumber(data?.staff_on_leave),
      hint: 'Whole school',
      icon: UserRoundX,
      tone: data?.staff_on_leave ? 'warning' : 'neutral',
    },
    {
      key: 'fees_today',
      label: 'Fees collected today',
      value: rupees(fees?.collected_today),
      icon: IndianRupee,
      tone: 'success',
    },
    {
      key: 'fees_month',
      label: 'Fees this month',
      value: rupees(fees?.collected_month),
      icon: Wallet,
      tone: 'success',
    },
    {
      key: 'fee_due',
      label: 'Fee due',
      value: rupees(fees?.due),
      hint: fees ? `${fees.defaulters} ${fees.defaulters === 1 ? 'defaulter' : 'defaulters'}` : '',
      icon: TrendingDown,
      tone: fees?.due ? 'warning' : 'neutral',
      onClick: () => navigate({ to: '/fees', search: { tab: 'dues', overdue: true } }),
    },
    {
      key: 'waiting',
      label: 'Waiting for you',
      value: formatNumber(pending?.total),
      hint: pending ? `${pending.overdue} overdue` : undefined,
      icon: Clock,
      tone: pending?.overdue ? 'danger' : pending?.total ? 'warning' : 'neutral',
    },
  ]
}

function Sections({
  data,
  canSearchStudents,
}: {
  data: OfficeDashboard
  canSearchStudents: boolean
}) {
  return (
    <>
      <div className='grid gap-4 lg:grid-cols-2'>
        <WaitingCard items={data.pending_items} total={data.pending.total} />
        <DefaultersCard items={data.fees.top_defaulters} count={data.fees.defaulters} />
      </div>
      <ExamsCard exams={data.exams} />
      <div className='grid gap-4 lg:grid-cols-2'>
        <AlertsCard data={data} />
        <QuickActions canSearchStudents={canSearchStudents} />
      </div>
      {data.aos && <AoStrip cards={data.aos} />}
    </>
  )
}

function SectionsSkeleton() {
  return (
    <>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Skeleton className='h-64 rounded-xl' />
        <Skeleton className='h-64 rounded-xl' />
      </div>
      <Skeleton className='h-48 rounded-xl' />
    </>
  )
}

function studentLink(studentId: number) {
  return {
    to: '/office/students/$studentId' as const,
    params: { studentId: String(studentId) },
    search: { tab: 'overview' as const },
  }
}

function PendingLink({ item, children }: { item: PendingItem; children: ReactNode }) {
  const linkClass =
    'grid min-w-0 gap-1 rounded-lg border p-3 outline-none transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40'
  if (item.kind === 'gate_pass')
    return (
      <Link to='/gate' search={{ tab: 'passes', page: 1, status: 'pending' }} className={linkClass}>
        {children}
      </Link>
    )
  if (item.kind === 'fee_request')
    return (
      <Link
        to='/fees'
        search={{ tab: 'approvals', request_status: 'pending' }}
        className={linkClass}
      >
        {children}
      </Link>
    )
  if (item.kind === 'student_leave')
    return (
      <Link
        to='/attendance'
        search={{ tab: 'leave', leave: 'student', status: 'pending', page: 1 }}
        className={linkClass}
      >
        {children}
      </Link>
    )
  return (
    <Link to='/grievances' search={{ page: 1, grievance: item.id }} className={linkClass}>
      {children}
    </Link>
  )
}

function WaitingCard({ items, total }: { items: PendingItem[]; total: number }) {
  return (
    <Card data-testid='office-waiting'>
      <CardHeader>
        <CardTitle>Waiting for you</CardTitle>
        {total > items.length && (
          <Badge tone='neutral'>
            Oldest {items.length} of {total}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className='grid gap-2'>
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <PendingLink item={item}>
                  <span className='flex flex-wrap items-center gap-1.5'>
                    <Badge tone='info'>{PENDING_LABEL[item.kind]}</Badge>
                    <span className='min-w-0 flex-1 truncate font-semibold'>{item.title}</span>
                    {item.overdue && <Badge tone='danger'>Overdue</Badge>}
                  </span>
                  <span className='flex flex-wrap gap-x-2 text-xs text-muted-foreground'>
                    {item.student && <span className='font-medium'>{item.student}</span>}
                    {item.class_section && <span>{item.class_section}</span>}
                    <span className={item.overdue ? 'text-destructive' : undefined}>
                      Waiting {ageLabel(item.age_hours)}
                    </span>
                  </span>
                </PendingLink>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CircleCheck}
            title='Nothing waiting'
            description='You are all caught up.'
          />
        )}
      </CardContent>
    </Card>
  )
}

function DefaultersCard({ items, count }: { items: Defaulter[]; count: number }) {
  return (
    <Card data-testid='office-defaulters'>
      <CardHeader>
        <CardTitle>Top fee defaulters</CardTitle>
        {count > 0 && <Badge tone='warning'>{count} with dues</Badge>}
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className='grid gap-1'>
            {items.map((item) => (
              <li
                key={item.student_id}
                className='flex min-w-0 items-center gap-3 border-b py-2 last:border-b-0'
              >
                <div className='grid min-w-0 flex-1'>
                  <Link
                    {...studentLink(item.student_id)}
                    className='truncate font-semibold text-primary hover:underline'
                  >
                    {item.name}
                  </Link>
                  <span className='text-xs text-muted-foreground'>
                    {item.class_section ?? 'Not placed'}
                  </span>
                </div>
                <span className='tabular shrink-0 font-bold text-warning'>{rupees(item.due)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={IndianRupee}
            title='No fee dues'
            description='Every student is paid up.'
          />
        )}
      </CardContent>
    </Card>
  )
}

function ExamsCard({ exams }: { exams: ClassExam[] }) {
  return (
    <Card data-testid='office-exams'>
      <CardHeader>
        <CardTitle>Latest exam per class</CardTitle>
      </CardHeader>
      <CardContent>
        {exams.length ? (
          <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {exams.map((exam) => (
              <li
                key={exam.class_id}
                className='grid min-w-0 content-start gap-2 rounded-lg border p-3'
              >
                <div className='flex min-w-0 items-start gap-2'>
                  <div className='grid min-w-0 flex-1'>
                    <span className='truncate font-bold'>{className(exam.class_name)}</span>
                    <span className='truncate text-xs text-muted-foreground'>{exam.exam.name}</span>
                  </div>
                  <Badge tone='info'>Avg {percent(exam.average)}</Badge>
                </div>
                {exam.toppers.length ? (
                  <ol className='grid gap-1 text-sm'>
                    {exam.toppers.slice(0, 3).map((topper) => (
                      <li key={topper.student_id} className='flex min-w-0 items-center gap-2'>
                        <Trophy
                          className={
                            topper.rank === 1
                              ? 'size-3.5 shrink-0 text-warning'
                              : 'size-3.5 shrink-0 text-muted-foreground'
                          }
                        />
                        <span className='tabular w-4 shrink-0 text-xs text-muted-foreground'>
                          {topper.rank}
                        </span>
                        <Link
                          {...studentLink(topper.student_id)}
                          className='min-w-0 flex-1 truncate text-primary hover:underline'
                        >
                          {topper.name}
                        </Link>
                        <span className='tabular shrink-0 text-xs font-semibold'>
                          {percent(topper.percent)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className='text-xs text-muted-foreground'>No toppers yet</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={GraduationCap} title='No published exam yet' />
        )}
      </CardContent>
    </Card>
  )
}

function AlertsCard({ data }: { data: OfficeDashboard }) {
  const chips = [
    { key: 'low', label: 'Low attendance', value: data.alerts.low_attendance, icon: CalendarCheck },
    { key: 'hold', label: 'Bus passes on hold', value: data.alerts.passes_on_hold, icon: Bus },
    { key: 'health', label: 'Health alerts', value: data.alerts.health_alerts, icon: HeartPulse },
  ]
  return (
    <Card data-testid='office-alerts'>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-2'>
        {chips.map((chip) => (
          <Badge key={chip.key} tone={chip.value ? 'danger' : 'neutral'} className='px-2.5 py-1'>
            <chip.icon className='size-3.5' />
            {chip.label}
            <span className='tabular font-extrabold'>{chip.value}</span>
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

function QuickActions({ canSearchStudents }: { canSearchStudents: boolean }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const search = query.trim() || undefined
    if (canSearchStudents) void navigate({ to: '/students', search: { page: 1, search } })
    else void navigate({ to: '/office', search: { page: 1 } })
  }

  return (
    <Card data-testid='office-actions'>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-3'>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link to='/gate' search={{ tab: 'passes', page: 1 }}>
              <DoorOpen />
              Gate passes
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to='/office' search={{ page: 1 }}>
              <Shapes />
              Classes & students
            </Link>
          </Button>
        </div>
        <form role='search' onSubmit={submit} className='flex min-w-0 gap-2'>
          <Input
            aria-label='Search student'
            placeholder='Search student by name or admission no.'
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            className='min-w-0 flex-1'
          />
          <Button type='submit' size='sm' className='h-9'>
            <Search />
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Card className='min-w-0' data-testid='office-aos'>
      <CardHeader>
        <CardTitle>AOs today</CardTitle>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/office/monitor' search={{}}>
            Open AO monitor
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
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
          <p className='text-sm text-muted-foreground'>No AOs yet</p>
        )}
      </CardContent>
    </Card>
  )
}
