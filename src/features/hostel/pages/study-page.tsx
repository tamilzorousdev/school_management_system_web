import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { BarChart3, BookOpen, CalendarClock, LayoutGrid, Sun } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useHostelModules, useHostels } from '../api'
import { studyKeys } from '../api-duty'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { HostelSelect } from '../components/pickers'
import { StudyHallsTab } from '../components/study-halls'
import { StudyReportTab } from '../components/study-report'
import { StudySchedulesTab } from '../components/study-schedules'
import { StudyTodayTab } from '../components/study-today'
import type { StudySearch } from '../search-life'

const route = getRouteApi('/_app/hostel/study')

type Tab = StudySearch['tab']

const TABS: { value: Tab; label: string; icon: typeof Sun }[] = [
  { value: 'today', label: 'Today', icon: Sun },
  { value: 'schedules', label: 'Schedules', icon: CalendarClock },
  { value: 'halls', label: 'Study halls', icon: LayoutGrid },
  { value: 'report', label: 'Report', icon: BarChart3 },
]

export function StudyPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/study' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canStudy = can(me, 'hostel.study')
  const canHall = can(me, 'hostel.study_hall')
  const modules = useHostelModules(canView)
  const hostels = useHostels(canView)
  const hallOn = modules.data?.enabled_modules.study_hall ?? false

  const setSearch = (patch: Partial<StudySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (tab: Tab) =>
    navigate({ search: { tab, page: 1, hostel_id: search.hostel_id } })

  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: studyKeys.all })
  })

  const header = (
    <PageHeader
      eyebrow='Hostel life'
      title='Study hours'
      description='Evening prep schedules, study attendance and study hall seats.'
      actions={
        canView && (hostels.data?.length ?? 0) > 1 ? (
          <HostelSelect
            id='study-hostel'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) =>
              setSearch({
                hostel_id: value ? Number(value) : undefined,
                schedule_id: undefined,
                hall: undefined,
              })
            }
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
          icon={BookOpen}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const content = () => {
    if (!me || modules.isPending) return <Skeleton className='h-64' />
    if (search.tab === 'schedules')
      return <StudySchedulesTab hostelId={search.hostel_id} canEdit={canStudy} hallOn={hallOn} />
    if (search.tab === 'halls')
      return hallOn ? (
        <StudyHallsTab
          hostelId={search.hostel_id}
          hallId={search.hall}
          canEdit={canHall}
          onOpen={(hall) => setSearch({ hall })}
        />
      ) : (
        <ModuleOffState module='study_hall' />
      )
    if (search.tab === 'report')
      return (
        <StudyReportTab
          search={search}
          onChange={setSearch}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
        />
      )
    return (
      <StudyTodayTab
        hostelId={search.hostel_id}
        scheduleId={search.schedule_id}
        date={search.date}
        canMark={canStudy}
        onPick={(patch) => setSearch(patch)}
      />
    )
  }

  return (
    <Page>
      {header}
      <HostelLifeTabs active='/hostel/study' />
      <PageTabs label='Study sections' value={search.tab} onChange={switchTab} tabs={TABS} />
      {content()}
    </Page>
  )
}
