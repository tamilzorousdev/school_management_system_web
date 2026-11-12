import { useNavigate } from '@tanstack/react-router'
import {
  Bus,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  IndianRupee,
  Siren,
  TriangleAlert,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { FleetMap } from '@/components/common/fleet-map'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SosBanner } from '@/features/alerts/components/sos-banner'
import { can, useMe, type Me } from '@/features/auth/api'
import { SportsStarsCard } from '@/features/activities/components/sports-stars-card'
import { TopRankHoldersCard } from '@/features/exams/components/top-rank-holders-card'
import { wholeRupees } from '@/features/fees/labels'
import { useFleetLive, VEHICLE_STATE } from '@/features/fleet/api'
import { formatNumber } from '@/lib/format'
import { useDashboard, type Dashboard } from '../api'
import { YearPerformanceCard } from '../components/year-performance-card'

type Navigate = ReturnType<typeof useNavigate>

const PERFORMANCE_PERMISSIONS = ['students.view', 'attendance.view', 'exams.view', 'fees.view']

export function DashboardPage() {
  const me = useMe().data
  const dashboard = useDashboard()
  const navigate = useNavigate()
  const firstName = greetingName(me?.name ?? '')
  const items = insights(me, dashboard.data, navigate)
  return (
    <Page>
      <PageHeader
        eyebrow='Overview'
        title={`Good ${greeting()}, ${firstName}`}
        description='Today at a glance: students, attendance, staff, buses and alerts.'
      />
      {can(me, 'fleet.view') && <SosBanner />}
      {dashboard.isError && !dashboard.data ? (
        <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
      ) : (
        items.length > 0 && <InsightCards items={items} loading={dashboard.isPending} />
      )}
      {PERFORMANCE_PERMISSIONS.some((permission) => can(me, permission)) && <YearPerformanceCard />}
      {can(me, 'fleet.view') && <BusMap />}
      {can(me, 'exams.view') && <TopRankHoldersCard />}
      {can(me, 'students.view') && <SportsStarsCard />}
    </Page>
  )
}

function greeting() {
  const hour = Number(
    new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })
  )
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
}

const percentText = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${formatNumber(value, value % 1 ? 1 : 0)}%`

function attendanceTone(percent: number | null | undefined): Insight['tone'] {
  if (percent === null || percent === undefined) return 'neutral'
  return percent >= 90 ? 'success' : percent >= 75 ? 'warning' : 'danger'
}

function insights(me: Me | undefined, data: Dashboard | undefined, navigate: Navigate): Insight[] {
  const items: Insight[] = []
  if (can(me, 'students.view')) {
    items.push(
      {
        key: 'students',
        label: 'Students',
        value: formatNumber(data?.students?.total),
        hint: `${data?.students?.joined_this_month ?? 0} joined this month`,
        icon: GraduationCap,
        tone: 'primary',
        onClick: () => navigate({ to: '/students', search: { page: 1 } }),
      },
      {
        key: 'admissions',
        label: 'Applications',
        value: formatNumber(data?.students?.applications_waiting),
        hint: `${data?.students?.approved_not_enrolled ?? 0} approved, not enrolled`,
        icon: ClipboardList,
        tone: 'info',
        onClick: () => navigate({ to: '/admissions', search: { page: 1 } }),
      }
    )
  }
  if (can(me, 'attendance.view')) {
    const students = data?.attendance?.students
    const staff = data?.attendance?.staff
    items.push(
      {
        key: 'student-attendance',
        label: 'Students present',
        value: students && !students.working_day ? 'Holiday' : percentText(students?.percent),
        hint: students
          ? `${students.marked_sections}/${students.total_sections} sections marked`
          : undefined,
        icon: CalendarCheck,
        tone: attendanceTone(students?.percent),
        onClick: () =>
          navigate({ to: '/attendance', search: { tab: 'students', leave: 'student', page: 1 } }),
      },
      {
        key: 'staff-attendance',
        label: 'Staff checked in',
        value: percentText(staff?.percent),
        hint: staff
          ? `${staff.checked_in} of ${staff.total - staff.on_leave} · ${staff.on_leave} on leave`
          : undefined,
        icon: UserRoundCheck,
        tone: attendanceTone(staff?.percent),
        onClick: () =>
          navigate({ to: '/attendance', search: { tab: 'staff', leave: 'student', page: 1 } }),
      }
    )
  }
  if (can(me, 'staff.view')) {
    const attention = data?.staff?.need_attention ?? 0
    items.push({
      key: 'staff',
      label: 'Staff',
      value: formatNumber(data?.staff?.total),
      hint: attention ? `${attention} need attention` : 'All records complete',
      icon: UsersRound,
      tone: attention ? 'warning' : 'success',
      onClick: () => navigate({ to: '/staff', search: { page: 1 } }),
    })
  }
  if (can(me, 'fleet.view')) {
    const buses = data?.buses
    const alerts = data?.alerts
    const down = buses?.telematics_available === false
    items.push(
      {
        key: 'buses',
        label: 'Buses moving',
        value: down || !buses ? '—' : `${buses.moving ?? 0}/${buses.total}`,
        hint: down ? 'Bus tracking is not reachable' : `${buses?.offline ?? 0} offline`,
        icon: Bus,
        tone: down ? 'neutral' : 'success',
        onClick: () => navigate({ to: '/fleet' }),
      },
      {
        key: 'alerts',
        label: 'Open alerts',
        value: formatNumber(alerts?.open),
        hint: alerts?.sos_open
          ? `${alerts.sos_open} SOS active`
          : `${alerts?.high_open ?? 0} high severity`,
        icon: alerts?.sos_open ? Siren : TriangleAlert,
        tone: alerts?.sos_open ? 'danger' : alerts?.open ? 'warning' : 'success',
        onClick: () => navigate({ to: '/fleet/alerts', search: { page: 1, status: 'open' } }),
      }
    )
  }
  if (can(me, 'fees.view') && data?.fees !== null) {
    items.push({
      key: 'fees',
      label: 'Fees overdue',
      value: data?.fees ? wholeRupees(data.fees.overdue_amount) : '—',
      hint: data?.fees ? `${data.fees.overdue_students} students` : undefined,
      icon: IndianRupee,
      tone: data?.fees?.overdue_amount ? 'danger' : 'success',
      onClick: () => navigate({ to: '/fees', search: { tab: 'dues', overdue: true } }),
    })
  }
  return items
}

function BusMap() {
  const live = useFleetLive()
  const vehicles = live.data?.vehicles ?? []
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5'>
        <div className='grid'>
          <h2 className='font-bold'>Buses now</h2>
          <p className='text-xs text-muted-foreground'>Live positions from bus tracking</p>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {vehicles.slice(0, 6).map((vehicle) => (
            <Badge key={vehicle.id} tone={VEHICLE_STATE[vehicle.state].tone} dot>
              {vehicle.name}
            </Badge>
          ))}
        </div>
      </div>
      {live.isError ? (
        <ErrorState message={live.error.message} onRetry={() => live.refetch()} />
      ) : live.isPending ? (
        <Skeleton className='h-80 rounded-none' />
      ) : (
        <FleetMap
          className='h-80'
          emptyText='No bus has sent its position yet'
          points={vehicles
            .filter((vehicle) => vehicle.position)
            .map((vehicle) => ({
              id: vehicle.id,
              lat: vehicle.position!.lat,
              lng: vehicle.position!.lng,
              label: vehicle.name,
              sublabel: VEHICLE_STATE[vehicle.state].label,
              color: VEHICLE_STATE[vehicle.state].color,
            }))}
        />
      )}
    </Card>
  )
}

const ROLE_WORDS = [
  'school',
  'admin',
  'super',
  'principal',
  'administrative',
  'officer',
  'transport',
  'tamilzorous',
]

function greetingName(name: string) {
  const words = name.trim().split(/s+/).filter(Boolean)
  const personal = words.find((word) => !ROLE_WORDS.includes(word.toLowerCase()))
  return personal ?? 'there'
}
