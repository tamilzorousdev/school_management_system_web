import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Bus, CalendarClock, IdCard, Route as RouteIcon, UsersRound } from 'lucide-react'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { can, useMe } from '@/features/auth/api'
import { useBusRoutes, useBuses, useExpiries } from '../api'
import { BusesTab } from '../components/buses-tab'
import { ExpiriesTab } from '../components/expiries-tab'
import { RoutesTab } from '../components/routes-tab'
import { StudentsTab } from '../components/students-tab'
import type { TransportSearch, TransportTab } from '../search'

const route = getRouteApi('/_app/transport')

export function TransportPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/transport' })
  const canManage = can(useMe().data, 'fleet.manage')
  const fleet = useBuses({ page: 1, limit: 100 })
  const routes = useBusRoutes()
  const expiries = useExpiries(30)

  const setSearch = (patch: Partial<TransportSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void fleet.refetch()
    void routes.refetch()
    void expiries.refetch()
  })

  const buses = fleet.data?.items ?? []
  const seats = buses.reduce((sum, bus) => sum + bus.capacity, 0)
  const riders = buses.reduce((sum, bus) => sum + bus.students, 0)
  const tracked = buses.filter((bus) => bus.device).length
  const stops = (routes.data ?? []).reduce((sum, item) => sum + item.stops, 0)
  const due = expiries.data ?? []
  const expired = due.filter((item) => item.days_left < 0).length

  const cards: Insight[] = [
    {
      key: 'buses',
      label: 'Buses',
      value: fleet.data?.total ?? 0,
      hint: `${tracked} with a GPS tracker`,
      icon: Bus,
      tone: 'primary',
    },
    {
      key: 'students',
      label: 'Students on buses',
      value: riders,
      hint: `${seats} seats in all`,
      icon: UsersRound,
      tone: 'info',
    },
    {
      key: 'routes',
      label: 'Routes',
      value: routes.data?.length ?? 0,
      hint: `${stops} stops`,
      icon: RouteIcon,
      tone: 'success',
    },
    {
      key: 'expiries',
      label: 'Documents due',
      value: due.length,
      hint: expired ? `${expired} already expired` : 'Ending in the next 30 days',
      icon: CalendarClock,
      tone: expired ? 'danger' : due.length ? 'warning' : 'success',
      onClick: () => setSearch({ tab: 'expiries', search: undefined }),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Buses and routes'
        description='School buses with their tracker, crew and documents, the routes and stops they run, and the students at each stop.'
        actions={
          <Button variant='outline' asChild>
            <Link to='/crew' search={{ page: 1 }}>
              <IdCard />
              Drivers and attendants
            </Link>
          </Button>
        }
      />
      <InsightCards items={cards} loading={fleet.isPending || routes.isPending} />
      <PageTabs
        label='Transport sections'
        value={search.tab}
        onChange={(tab: TransportTab) =>
          setSearch({ tab, search: undefined, route_id: undefined, stop_id: undefined })
        }
        tabs={[
          { value: 'buses', label: 'Buses', icon: Bus },
          { value: 'routes', label: 'Routes', icon: RouteIcon },
          { value: 'students', label: 'Students', icon: UsersRound },
          {
            value: 'expiries',
            label: 'Expiries',
            icon: CalendarClock,
            count: due.length || undefined,
          },
        ]}
      />
      {search.tab === 'buses' && (
        <BusesTab
          search={search.search}
          page={search.page ?? 1}
          canManage={canManage}
          onSearch={(value) => setSearch({ search: value })}
          onPage={(page) => setSearch({ page })}
        />
      )}
      {search.tab === 'routes' && <RoutesTab canManage={canManage} />}
      {search.tab === 'students' && (
        <StudentsTab
          filters={{
            search: search.search,
            page: search.page ?? 1,
            route_id: search.route_id,
            stop_id: search.stop_id,
          }}
          canManage={canManage}
          onChange={(patch) => setSearch(patch)}
        />
      )}
      {search.tab === 'expiries' && <ExpiriesTab canManage={canManage} />}
    </Page>
  )
}
