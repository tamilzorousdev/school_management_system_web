import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  IdCard,
  LayoutGrid,
  MessagesSquare,
  School,
  UserRoundX,
} from 'lucide-react'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import { useSetupSummary } from '../api'
import { ClassesTab } from '../components/classes-tab'
import { CommunicationTab } from '../components/communication-settings'
import { HolidaysTab } from '../components/holidays-tab'
import { IdCardDesignTab } from '../components/id-card-design-tab'
import { ProfileTab } from '../components/profile-tab'
import { SubjectsTab } from '../components/subjects-tab'
import { YearsTab } from '../components/years-tab'
import type { SetupTab } from '../search'

const route = getRouteApi('/_app/setup')

export function SetupPage() {
  const { tab } = route.useSearch()
  const navigate = useNavigate({ from: '/setup' })
  const canManage = can(useMe().data, 'schools.manage')
  const summary = useSetupSummary()
  const data = summary.data
  const go = (next: SetupTab) => navigate({ search: { tab: next }, replace: true })

  const cards: Insight[] = [
    {
      key: 'year',
      label: 'Current academic year',
      value: data?.current_year?.name ?? 'Not set',
      hint: data?.current_year
        ? `${formatDate(data.current_year.start_date)} to ${formatDate(data.current_year.end_date)}`
        : 'Add one in Academic years',
      icon: CalendarRange,
      tone: data?.current_year ? 'primary' : 'danger',
      onClick: () => go('years'),
    },
    {
      key: 'classes',
      label: 'Classes and sections',
      value: `${data?.classes ?? 0} / ${data?.sections ?? 0}`,
      hint: 'Classes / sections this year',
      icon: LayoutGrid,
      tone: 'info',
      onClick: () => go('classes'),
    },
    {
      key: 'teachers',
      label: 'Sections without a class teacher',
      value: data?.sections_without_teacher ?? 0,
      hint: data?.sections_without_teacher ? 'Assign one in Classes' : 'Every section has one',
      icon: UserRoundX,
      tone: data?.sections_without_teacher ? 'warning' : 'success',
      onClick: () => go('classes'),
    },
    {
      key: 'holiday',
      label: 'Next holiday',
      value: data?.next_holiday ? formatDate(data.next_holiday.date) : '—',
      hint: data?.next_holiday?.name ?? 'None coming up',
      icon: CalendarDays,
      tone: 'success',
      onClick: () => go('holidays'),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Settings'
        title='School setup'
        description='The basics every other module uses: school profile, academic year, classes, sections, subjects, holidays, and chat hours.'
      />
      <InsightCards items={cards} loading={summary.isPending} />
      <PageTabs
        label='School setup sections'
        value={tab}
        onChange={go}
        wrap
        tabs={[
          { value: 'profile', label: 'School profile', icon: School },
          { value: 'years', label: 'Academic years', icon: CalendarRange },
          {
            value: 'classes',
            label: 'Classes and sections',
            icon: LayoutGrid,
            count: data?.sections,
          },
          { value: 'subjects', label: 'Subjects', icon: BookOpen, count: data?.subjects },
          { value: 'holidays', label: 'Holidays', icon: CalendarDays },
          { value: 'communication', label: 'Chat', icon: MessagesSquare },
          { value: 'id-cards', label: 'Student ID card', icon: IdCard },
        ]}
      />
      {tab === 'profile' && <ProfileTab canManage={canManage} />}
      {tab === 'years' && <YearsTab canManage={canManage} />}
      {tab === 'classes' && <ClassesTab canManage={canManage} />}
      {tab === 'subjects' && <SubjectsTab canManage={canManage} />}
      {tab === 'holidays' && <HolidaysTab canManage={canManage} />}
      {tab === 'communication' && <CommunicationTab canManage={canManage} />}
      {tab === 'id-cards' && <IdCardDesignTab canManage={canManage} />}
    </Page>
  )
}
