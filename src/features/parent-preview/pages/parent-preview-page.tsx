import { useEffect, useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Smartphone } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { Card } from '@/components/ui/card'
import { useMe } from '@/features/auth/api'
import { useStudent, useStudents, type StudentListItem } from '@/features/students/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { parentBase, useMyChildren, usePreviewHome, usePreviewNotifications } from '../api'
import { ChatScreen, DiaryScreen, MeetingsScreen, NewsScreen } from '../components/connect-screens'
import { AttendanceScreen, BusScreen, HomeScreen } from '../components/home-screens'
import { PhoneFrame } from '../components/phone-frame'
import { isConnectScreen, PHONE_TABS, screenTitle, type PhoneTab } from '../tabs'
import {
  AchievementsScreen,
  FeesScreen,
  NotificationsScreen,
  ResultsScreen,
} from '../components/record-screens'

const route = getRouteApi('/_app/parent-preview')

const classText = (student: Pick<StudentListItem, 'class' | 'section'>) =>
  [student.class?.name, student.section?.name].filter(Boolean).join(' - ')

const toOption = (student: StudentListItem): ComboboxOption => ({
  value: String(student.id),
  label: `${student.full_name} (${student.admission_no})`,
  hint: classText(student),
})

function Screen({
  tab,
  studentId,
  onTab,
}: {
  tab: PhoneTab
  studentId: number
  onTab: (tab: PhoneTab) => void
}) {
  switch (tab) {
    case 'attendance':
      return <AttendanceScreen studentId={studentId} />
    case 'bus':
      return <BusScreen studentId={studentId} />
    case 'results':
      return <ResultsScreen studentId={studentId} />
    case 'fees':
      return <FeesScreen studentId={studentId} />
    case 'achievements':
      return <AchievementsScreen studentId={studentId} />
    case 'notifications':
      return <NotificationsScreen studentId={studentId} />
    case 'diary':
      return <DiaryScreen base={parentBase(studentId)} party='parent' />
    case 'meetings':
      return <MeetingsScreen base={parentBase(studentId)} party='parent' />
    case 'chat':
      return <ChatScreen base={parentBase(studentId)} party='parent' />
    case 'news':
      return <NewsScreen base={parentBase(studentId)} />
    default:
      return <HomeScreen studentId={studentId} onOpen={onTab} />
  }
}

function ChildPhone({
  studentId,
  tab,
  onTab,
}: {
  studentId: number
  tab: PhoneTab
  onTab: (tab: PhoneTab) => void
}) {
  const me = useMe().data
  const home = usePreviewHome(studentId)
  const notifications = usePreviewNotifications(studentId)
  const unread = notifications.data?.items.filter((item) => !item.is_read).length ?? 0
  const schoolName = home.data?.child?.school.name ?? me?.school?.name ?? 'School'
  return (
    <PhoneFrame
      app='Parent app'
      nav={PHONE_TABS}
      tab={tab}
      onTab={onTab}
      title={tab === 'home' ? schoolName : screenTitle(tab)}
      subtitle={home.data?.child?.full_name ?? 'Parent app'}
      schoolName={schoolName}
      logoUrl={me?.school?.logo_url ?? null}
      unread={unread}
      onBell={() => onTab('notifications')}
      onBack={isConnectScreen(tab) ? () => onTab('home') : undefined}
    >
      <Screen key={`${studentId}-${tab}`} tab={tab} studentId={studentId} onTab={onTab} />
    </PhoneFrame>
  )
}

export function ParentPreviewPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/parent-preview' })
  const me = useMe().data
  const isParentOnly = Boolean(me?.apps.includes('parent') && !me?.apps.includes('admin'))
  const myChildren = useMyChildren(isParentOnly)
  const [query, setQuery] = useState('')
  const term = useDebouncedValue(query.trim(), 300)
  const students = useStudents(
    { page: 1, limit: 20, status: 'active', search: term || undefined },
    !isParentOnly
  )
  const selected = useStudent(isParentOnly ? null : (search.student ?? null))

  const activeStudentId = search.student ?? (isParentOnly ? myChildren.data?.[0]?.id : undefined)
  const home = usePreviewHome(activeStudentId ?? 0)
  const tab = search.tab ?? 'home'

  useEffect(() => {
    if (isParentOnly && !search.student && myChildren.data?.[0]) {
      navigate({ search: (prev) => ({ ...prev, student: myChildren.data![0].id }), replace: true })
    }
  }, [isParentOnly, search.student, myChildren.data, navigate])

  const options = useMemo(() => {
    if (isParentOnly) {
      return (myChildren.data ?? []).map((child) => ({
        value: String(child.id),
        label: `${child.first_name}${child.last_name ? ' ' + child.last_name : ''} (${child.admission_no})`,
        hint: [child.class_name, child.section_name].filter(Boolean).join(' - '),
      }))
    }
    const list = (students.data?.items ?? []).map(toOption)
    const current = selected.data
    if (current && !list.some((option) => option.value === String(current.id))) {
      list.unshift(toOption(current))
    }
    return list
  }, [isParentOnly, myChildren.data, students.data, selected.data])

  const setSearch = (patch: { student?: number; tab?: PhoneTab }) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const parent = activeStudentId ? home.data?.parent : undefined

  return (
    <Page>
      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_auto] lg:justify-center xl:gap-12'>
        <div className='grid gap-6'>
          <PageHeader
            eyebrow='Parent app'
            title={isParentOnly ? 'My child' : 'Parent app preview'}
            description={
              isParentOnly
                ? 'View your child’s attendance, bus location, results, homework, messages and announcements.'
                : 'See what a parent sees in the mobile app for their child: home, attendance, bus, results, fees, awards, homework, meetings, chat and announcements.'
            }
          />
          <Card className='grid gap-4 p-5'>
            <div className='grid gap-1.5'>
              <label htmlFor='preview-student' className='text-sm font-semibold'>
                {isParentOnly ? 'My child' : 'Student'}
              </label>
              <Combobox
                id='preview-student'
                label={isParentOnly ? 'My child' : 'Student'}
                placeholder={isParentOnly ? 'Choose child' : 'Pick a student'}
                searchPlaceholder='Search by name or admission no.'
                value={activeStudentId ? String(activeStudentId) : undefined}
                options={options}
                onSearch={setQuery}
                emptyText={students.isPending ? 'Loading students…' : 'No students found'}
                onChange={(value) =>
                  setSearch({ student: value ? Number(value) : undefined, tab: 'home' })
                }
                className='h-11 sm:w-full'
              />
            </div>
            {activeStudentId && (
              <div className='grid gap-2 text-sm'>
                <div className='flex justify-between gap-3'>
                  <span className='text-muted-foreground'>Signed-in parent</span>
                  <span className='truncate text-right font-semibold'>
                    {home.isPending
                      ? '…'
                      : parent
                        ? `${parent.name} (${parent.relation})`
                        : (me?.name ?? '—')}
                  </span>
                </div>
                <div className='flex justify-between gap-3'>
                  <span className='text-muted-foreground'>School</span>
                  <span className='truncate text-right font-semibold'>
                    {me?.school?.name ?? '—'}
                  </span>
                </div>
                {!isParentOnly && (
                  <Link
                    to='/students/$studentId'
                    params={{ studentId: String(activeStudentId) }}
                    search={{ tab: 'profile' }}
                    className='mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline'
                  >
                    Open student profile <ExternalLink className='size-3.5' />
                  </Link>
                )}
              </div>
            )}
            <p className='text-xs text-muted-foreground'>
              {isParentOnly
                ? `Logged in as ${me?.name}. Viewing live child information.`
                : 'Read-only. The preview uses the same data as the Parent app and never signs in as the parent.'}
            </p>
          </Card>
        </div>

        {activeStudentId ? (
          <ChildPhone
            studentId={activeStudentId}
            tab={tab}
            onTab={(next) => setSearch({ tab: next })}
          />
        ) : (
          <Card className='sm:w-[390px]'>
            <EmptyState
              icon={Smartphone}
              title='Pick a student'
              description='Choose a student to see the parent app for that child.'
            />
          </Card>
        )}
      </div>
    </Page>
  )
}
