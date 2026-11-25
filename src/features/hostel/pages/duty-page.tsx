import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { BarChart3, CalendarClock, CalendarDays, Clock, MoonStar, Repeat2, Sun } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useHostelModules, useHostels } from '../api'
import { dutyKeys } from '../api-duty'
import { DutyReportTab } from '../components/duty-report'
import { DutyRosterTab } from '../components/duty-roster'
import { DutyRoundsTab } from '../components/duty-rounds'
import { DutyShiftsTab } from '../components/duty-shifts'
import { DutySwapsTab } from '../components/duty-swaps'
import { DutyTodayTab } from '../components/duty-today'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { HostelSelect } from '../components/pickers'
import type { DutySearch } from '../search-life'

const route = getRouteApi('/_app/hostel/duty')

type Tab = DutySearch['tab']

const TABS: { value: Tab; label: string; icon: typeof Sun }[] = [
  { value: 'today', label: 'Today', icon: Sun },
  { value: 'roster', label: 'Roster', icon: CalendarDays },
  { value: 'shifts', label: 'Shifts', icon: Clock },
  { value: 'swaps', label: 'Swaps', icon: Repeat2 },
  { value: 'rounds', label: 'Night rounds', icon: MoonStar },
  { value: 'report', label: 'Report', icon: BarChart3 },
]

export function DutyPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/duty' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canManage = can(me, 'hostel.staff_duty')
  const modules = useHostelModules(canView)
  const hostels = useHostels(canView)
  const enabled = modules.data?.enabled_modules.staff_duty ?? false

  const setSearch = (patch: Partial<DutySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (tab: Tab) =>
    navigate({ search: { tab, page: 1, hostel_id: search.hostel_id } })

  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: dutyKeys.all })
  })

  const header = (
    <PageHeader
      eyebrow='Hostel life'
      title='Staff duty'
      description='Who is on duty, the weekly roster, shift swaps and night rounds for hostel staff.'
      actions={
        canView && enabled && (hostels.data?.length ?? 0) > 1 ? (
          <HostelSelect
            id='duty-hostel'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
          />
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={CalendarClock}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const content = () => {
    if (!me) return <Skeleton className='h-64' />
    if (search.tab === 'roster')
      return (
        <DutyRosterTab
          hostelId={search.hostel_id}
          from={search.from}
          canManage={canManage}
          onWeekChange={(from) => setSearch({ from, to: undefined })}
        />
      )
    if (search.tab === 'shifts') return <DutyShiftsTab canManage={canManage} />
    if (search.tab === 'swaps')
      return (
        <DutySwapsTab
          me={me}
          canManage={canManage}
          status={search.status}
          page={search.page}
          onStatusChange={(status) => setSearch({ status })}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
        />
      )
    if (search.tab === 'rounds')
      return (
        <DutyRoundsTab
          hostelId={search.hostel_id}
          date={search.date}
          onDateChange={(date) => setSearch({ date })}
        />
      )
    if (search.tab === 'report')
      return (
        <DutyReportTab
          hostelId={search.hostel_id}
          from={search.from}
          to={search.to}
          onRangeChange={(range) => setSearch(range)}
        />
      )
    return <DutyTodayTab hostelId={search.hostel_id} canManage={canManage} />
  }

  return (
    <Page>
      {header}
      <HostelLifeTabs active='/hostel/duty' />
      {modules.isPending ? (
        <Skeleton className='h-64' />
      ) : !enabled ? (
        <ModuleOffState module='staff_duty' />
      ) : (
        <>
          <PageTabs
            label='Staff duty sections'
            value={search.tab}
            onChange={switchTab}
            tabs={TABS}
          />
          {content()}
        </>
      )}
    </Page>
  )
}
