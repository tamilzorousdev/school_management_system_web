import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  BedDouble,
  BedSingle,
  ClipboardList,
  Gavel,
  IndianRupee,
  Percent,
  Settings2,
  UserRoundCheck,
  UserRoundX,
  Wrench,
} from 'lucide-react'
import { StatCard, EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import {
  useAdmissionInsights,
  useConductInsights,
  useFeesInsights,
  useHostelDashboard,
  useHostels,
} from '../api'
import { HostelTabs } from '../components/hostel-tabs'
import { HostelSelect } from '../components/pickers'
import { MODULE_LABELS } from '../labels'

const route = getRouteApi('/_app/hostel')

export function HostelDashboardPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const hostelId = search.hostel_id
  const hostels = useHostels(canView)
  const dashboard = useHostelDashboard(hostelId, canView)
  const residents = useAdmissionInsights(hostelId, canView)
  const conduct = useConductInsights(hostelId, canView)
  const fees = useFeesInsights(hostelId, canView)

  useShortcut('app.refresh', () => {
    void dashboard.refetch()
    void residents.refetch()
    void conduct.refetch()
    void fees.refetch()
  })

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel dashboard' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  if (hostels.data && hostels.data.length === 0) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel dashboard' />
        <HostelTabs active='/hostel' />
        <EmptyState
          icon={BedDouble}
          title='No hostel set up yet'
          description='Add a hostel, its blocks, floors, room types and rooms to start.'
          action={
            can(me, 'hostel.manage') ? (
              <Button asChild>
                <Link to='/hostel/setup' search={{ tab: 'hostels' }}>
                  <Settings2 />
                  Set up the hostel
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Page>
    )
  }

  const beds = dashboard.data
  const people = residents.data
  const cards: Insight[] = [
    {
      key: 'staying',
      label: 'Staying',
      value: people?.active ?? 0,
      hint: `${people?.on_leave ?? 0} on leave now`,
      icon: UserRoundCheck,
      tone: 'success',
      onClick: () =>
        void navigate({
          to: '/hostel/residents',
          search: { tab: 'residents', page: 1, status: 'active' },
        }),
    },
    {
      key: 'without_bed',
      label: 'Without a bed',
      value: people?.without_bed ?? 0,
      hint: 'Admitted, waiting for a bed',
      icon: UserRoundX,
      tone: (people?.without_bed ?? 0) > 0 ? 'warning' : 'neutral',
      onClick: () =>
        void navigate({
          to: '/hostel/residents',
          search: { tab: 'residents', page: 1, has_bed: false },
        }),
    },
    {
      key: 'applications',
      label: 'Applications',
      value: people?.pending_applications ?? 0,
      hint: `${people?.waitlisted_applications ?? 0} on the waitlist`,
      icon: ClipboardList,
      tone: 'info',
      onClick: () =>
        void navigate({
          to: '/hostel/residents',
          search: { tab: 'applications', page: 1, application_status: 'pending' },
        }),
    },
    {
      key: 'checking_out',
      label: 'Checking out',
      value: people?.checking_out ?? 0,
      hint: `${people?.checked_out ?? 0} checked out this year`,
      icon: BedSingle,
      tone: 'neutral',
      onClick: () =>
        void navigate({
          to: '/hostel/residents',
          search: { tab: 'checkouts', page: 1, checkout_status: 'open' },
        }),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Hostel dashboard'
        description='Beds, residents, complaints, discipline and hostel fees at a glance.'
        actions={
          (hostels.data?.length ?? 0) > 1 ? (
            <HostelSelect
              id='dashboard-hostel'
              allLabel='All hostels'
              value={hostelId ? String(hostelId) : undefined}
              onChange={(value) =>
                void navigate({
                  search: { hostel_id: value ? Number(value) : undefined },
                  replace: true,
                })
              }
            />
          ) : undefined
        }
      />
      <HostelTabs active='/hostel' />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label='Occupancy'
          value={`${beds?.occupancy_percent ?? 0}%`}
          hint={`${beds?.occupied_beds ?? 0} of ${(beds?.total_beds ?? 0) - (beds?.unavailable_beds ?? 0)} usable beds`}
          icon={Percent}
          loading={dashboard.isPending}
        />
        <StatCard
          label='Vacant beds'
          value={beds?.vacant_beds ?? 0}
          hint={`${beds?.rooms ?? 0} rooms in ${beds?.blocks ?? 0} blocks`}
          icon={BedDouble}
          tone='success'
          loading={dashboard.isPending}
        />
        <StatCard
          label='Beds out of use'
          value={beds?.unavailable_beds ?? 0}
          hint={`${beds?.rooms_under_maintenance ?? 0} rooms under maintenance`}
          icon={Wrench}
          tone={(beds?.unavailable_beds ?? 0) > 0 ? 'warning' : 'neutral'}
          loading={dashboard.isPending}
        />
        <StatCard
          label='Hostel fee due'
          value={rupees(fees.data?.outstanding ?? 0)}
          hint={`${fees.data?.residents_with_dues ?? 0} residents owe · ${rupees(fees.data?.collected ?? 0)} collected`}
          icon={IndianRupee}
          tone={(fees.data?.outstanding ?? 0) > 0 ? 'warning' : 'success'}
          loading={fees.isPending}
        />
      </div>

      <InsightCards items={cards} loading={residents.isPending} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='grid gap-4 p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-bold'>Needs attention</h2>
            <AlertTriangle className='size-4 text-muted-foreground' />
          </div>
          <ul className='grid gap-3 text-sm'>
            <AttentionRow
              label='Open discipline cases'
              value={conduct.data?.open_cases ?? 0}
              icon={Gavel}
              to='/hostel/discipline'
              search={{ page: 1, status: 'open' }}
            />
            <AttentionRow
              label='Open complaints'
              value={conduct.data?.open_complaints ?? 0}
              extra={
                (conduct.data?.overdue_complaints ?? 0) > 0
                  ? `${conduct.data?.overdue_complaints} overdue`
                  : undefined
              }
              icon={ClipboardList}
              to='/hostel/complaints'
              search={{ tab: 'complaints', page: 1, complaint_status: 'open' }}
            />
            <AttentionRow
              label='Open maintenance tickets'
              value={conduct.data?.open_tickets ?? 0}
              extra={
                (conduct.data?.overdue_tickets ?? 0) > 0
                  ? `${conduct.data?.overdue_tickets} overdue`
                  : undefined
              }
              icon={Wrench}
              to='/hostel/complaints'
              search={{ tab: 'maintenance', page: 1, open: true }}
            />
            <AttentionRow
              label='Residents not billed for a due instalment'
              value={fees.data?.unbilled_residents ?? 0}
              icon={IndianRupee}
              to='/hostel/fees'
              search={{ tab: 'dues', page: 1 }}
            />
          </ul>
          {conduct.data?.average_rating != null && (
            <p className='text-sm text-muted-foreground'>
              Parents rate complaint handling{' '}
              <span className='font-semibold text-foreground'>{conduct.data.average_rating}/5</span>{' '}
              over the last 90 days.
            </p>
          )}
        </Card>

        <Card className='grid content-start gap-4 p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-bold'>Optional modules</h2>
            {can(me, 'hostel.settings') && (
              <Button variant='outline' size='sm' asChild>
                <Link to='/hostel/setup' search={{ tab: 'settings' }}>
                  <Settings2 />
                  Change
                </Link>
              </Button>
            )}
          </div>
          <ul className='grid gap-2 sm:grid-cols-2'>
            {(Object.keys(MODULE_LABELS) as (keyof typeof MODULE_LABELS)[]).map((key) => {
              const on = beds?.enabled_modules[key] ?? false
              return (
                <li
                  key={key}
                  className='flex items-center justify-between gap-3 rounded-md border px-3 py-2'
                >
                  <span className='text-sm font-medium'>{MODULE_LABELS[key].label}</span>
                  <Badge tone={on ? 'success' : 'neutral'}>{on ? 'On' : 'Off'}</Badge>
                </li>
              )
            })}
          </ul>
          <p className='text-sm text-muted-foreground'>
            Turned-off modules are hidden in the Hostel life menu, the Staff app and the Parent app;
            their data is kept.
          </p>
        </Card>
      </div>
    </Page>
  )
}

function AttentionRow({
  label,
  value,
  extra,
  icon: Icon,
  to,
  search,
}: {
  label: string
  value: number
  extra?: string
  icon: typeof Gavel
  to: '/hostel/discipline' | '/hostel/complaints' | '/hostel/fees'
  search: Record<string, string | number | boolean>
}) {
  return (
    <li>
      <Link
        to={to}
        search={search as never}
        className='flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted'
      >
        <span className='flex items-center gap-2'>
          <Icon className='size-4 text-muted-foreground' />
          {label}
        </span>
        <span className='flex items-center gap-2'>
          {extra && <Badge tone='danger'>{extra}</Badge>}
          <span className='font-bold tabular-nums'>{value}</span>
        </span>
      </Link>
    </li>
  )
}
