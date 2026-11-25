import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BedDouble,
  CalendarDays,
  MessageSquareText,
  Plus,
  UtensilsCrossed,
  UserX,
} from 'lucide-react'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useHostelModules, useHostels } from '../api'
import { careKeys } from '../api-care'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { nowTime, todayIso } from '../components/leave-helpers'
import { MessFeedbackView } from '../components/mess-feedback'
import { mealAt, MEAL_OPTIONS } from '../components/mess-helpers'
import { MessMenuEditor, MessOverrides } from '../components/mess-menu'
import { MessSkipsView } from '../components/mess-skips'
import { MessAttendanceView, MessDayMenu, MessHeadcountCard } from '../components/mess-today'
import { HostelSelect } from '../components/pickers'
import type { MessSearch } from '../search-life'

const route = getRouteApi('/_app/hostel/mess')

type Tab = MessSearch['tab']

export function MessPage() {
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const modules = useHostelModules(canView)
  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Mess'
      description='Menu, meal headcount and attendance, meal skips and feedback.'
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={UtensilsCrossed}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  if (modules.data?.enabled_modules.mess === false) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/mess' />
        <ModuleOffState module='mess' />
      </Page>
    )
  }

  if (!modules.data) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/mess' />
        {modules.isError ? (
          <ErrorState message={modules.error.message} onRetry={() => modules.refetch()} />
        ) : (
          <Skeleton className='h-64' />
        )}
      </Page>
    )
  }

  return <MessBody />
}

function MessBody() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/mess' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canEdit = can(me, 'hostel.mess')
  const hostels = useHostels()
  const [adding, setAdding] = useState(false)
  const tab: Tab = search.tab
  const today = todayIso()
  const date = search.date ?? today
  const meal = search.meal ?? mealAt(nowTime())
  const hostelId = search.hostel_id ?? hostels.data?.[0]?.id

  const setSearch = (patch: Partial<MessSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })
  const setHostel = (value?: number) => setSearch({ hostel_id: value, page: 1 })

  useShortcut('hostel.create', () => setAdding(true), {
    enabled: canEdit && tab === 'skips',
  })
  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: careKeys.all })
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Mess'
      description='Menu, meal headcount and attendance, meal skips and feedback.'
      actions={
        canEdit && tab === 'skips' ? (
          <Button onClick={() => setAdding(true)}>
            <Plus />
            Add meal skip
            <Kbd id='hostel.create' inverted />
          </Button>
        ) : undefined
      }
    />
  )

  if (hostels.data && hostels.data.length === 0) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/mess' />
        <EmptyState
          icon={BedDouble}
          title='No hostel set up yet'
          description='Add a hostel and admit residents to run the mess here.'
        />
      </Page>
    )
  }

  return (
    <Page>
      {header}
      <HostelLifeTabs active='/hostel/mess' />

      <PageTabs
        label='Mess sections'
        value={tab}
        onChange={(next) =>
          navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id } })
        }
        tabs={[
          { value: 'today', label: 'Today', icon: UtensilsCrossed },
          { value: 'menu', label: 'Menu', icon: CalendarDays },
          { value: 'skips', label: 'Meal skips', icon: UserX },
          { value: 'feedback', label: 'Feedback', icon: MessageSquareText },
        ]}
      />

      {tab === 'today' && (
        <>
          <Card className='flex flex-row flex-wrap items-center gap-3 px-4 py-3'>
            <HostelSelect
              id='mess-hostel'
              value={hostelId ? String(hostelId) : undefined}
              className='sm:w-56'
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <DatePicker
              id='mess-date'
              value={date}
              clearable={false}
              className='w-full sm:w-44'
              onChange={(value: string) =>
                setSearch({ date: value && value !== today ? value : undefined })
              }
            />
            <SegmentedControl
              label='Meal'
              value={meal}
              options={MEAL_OPTIONS}
              onChange={(value) => setSearch({ meal: value })}
            />
          </Card>
          {hostelId ? (
            <div className='grid items-start gap-4 lg:grid-cols-3'>
              <div className='grid gap-4'>
                <MessHeadcountCard hostelId={hostelId} date={date} meal={meal} />
                <MessDayMenu hostelId={hostelId} date={date} meal={meal} />
              </div>
              <div className='lg:col-span-2'>
                <MessAttendanceView
                  key={`${hostelId}-${date}-${meal}`}
                  hostelId={hostelId}
                  date={date}
                  meal={meal}
                  today={today}
                  canMark={canEdit}
                />
              </div>
            </div>
          ) : (
            <Skeleton className='h-64' />
          )}
        </>
      )}

      {tab === 'menu' && (
        <>
          <Card className='flex flex-row flex-wrap items-center gap-3 px-4 py-3'>
            <span className='text-sm font-semibold'>Menu for</span>
            <HostelSelect
              id='mess-menu-scope'
              allLabel='School menu (all hostels)'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
          </Card>
          <MessOverrides hostelId={search.hostel_id} canEdit={canEdit} />
          <MessMenuEditor hostelId={search.hostel_id} canEdit={canEdit} />
        </>
      )}

      {tab === 'skips' && (
        <MessSkipsView
          hostelId={search.hostel_id}
          page={search.page}
          canEdit={canEdit}
          adding={adding}
          onAddingChange={setAdding}
          onHostelChange={setHostel}
          onPageChange={setPage}
        />
      )}

      {tab === 'feedback' && (
        <MessFeedbackView
          hostelId={search.hostel_id}
          page={search.page}
          onHostelChange={setHostel}
          onPageChange={setPage}
        />
      )}
    </Page>
  )
}
