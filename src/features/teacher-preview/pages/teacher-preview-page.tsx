import { useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Smartphone } from 'lucide-react'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { Card } from '@/components/ui/card'
import { useMe } from '@/features/auth/api'
import {
  ChatScreen,
  DiaryScreen,
  MeetingsScreen,
  NewsScreen,
} from '@/features/parent-preview/components/connect-screens'
import { PhoneFrame } from '@/features/parent-preview/components/phone-frame'
import { useStaff, useStaffList, type StaffListItem } from '@/features/staff/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { teacherBase, useTeacherPreview } from '../api'
import { TeacherHomeScreen } from '../components/teacher-home'
import type { TeacherTab } from '../search'
import { TEACHER_TABS, teacherTitle } from '../tabs'

const route = getRouteApi('/_app/teacher-preview')

const toOption = (staff: Pick<StaffListItem, 'id' | 'name' | 'employee_no' | 'designation'>) => ({
  value: String(staff.id),
  label: `${staff.name} (${staff.employee_no})`,
  hint: staff.designation,
})

function Screen({
  tab,
  staffId,
  onTab,
}: {
  tab: TeacherTab
  staffId: number
  onTab: (tab: TeacherTab) => void
}) {
  const base = teacherBase(staffId)
  switch (tab) {
    case 'diary':
      return <DiaryScreen base={base} party='teacher' />
    case 'meetings':
      return <MeetingsScreen base={base} party='teacher' />
    case 'chat':
      return <ChatScreen base={base} party='teacher' />
    case 'news':
      return <NewsScreen base={base} />
    default:
      return <TeacherHomeScreen staffId={staffId} onOpen={onTab} />
  }
}

function TeacherPhone({
  staffId,
  tab,
  onTab,
}: {
  staffId: number
  tab: TeacherTab
  onTab: (tab: TeacherTab) => void
}) {
  const me = useMe().data
  const home = useTeacherPreview(staffId)
  const schoolName = me?.school?.name ?? 'School'
  return (
    <PhoneFrame
      app='Teacher app'
      nav={TEACHER_TABS}
      tab={tab}
      onTab={onTab}
      title={tab === 'home' ? schoolName : teacherTitle(tab)}
      subtitle={home.data?.teacher.name ?? 'Teacher app'}
      schoolName={schoolName}
      logoUrl={me?.school?.logo_url ?? null}
      unread={home.data?.counts.announcements_unread ?? 0}
      onBell={() => onTab('news')}
    >
      <Screen key={`${staffId}-${tab}`} tab={tab} staffId={staffId} onTab={onTab} />
    </PhoneFrame>
  )
}

export function TeacherPreviewPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/teacher-preview' })
  const me = useMe().data
  const [query, setQuery] = useState('')
  const term = useDebouncedValue(query.trim(), 300)
  const staff = useStaffList({
    page: 1,
    limit: 20,
    staff_type: 'teaching',
    status: 'active',
    search: term || undefined,
  })
  const selected = useStaff(search.staff ?? null)
  const home = useTeacherPreview(search.staff ?? 0)
  const tab = search.tab ?? 'home'

  const options = useMemo<ComboboxOption[]>(() => {
    const list = (staff.data?.items ?? []).map(toOption)
    const current = selected.data
    if (current && !list.some((option) => option.value === String(current.id))) {
      list.unshift(toOption(current))
    }
    return list
  }, [staff.data, selected.data])

  const setSearch = (patch: { staff?: number; tab?: TeacherTab }) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const teacher = search.staff ? home.data?.teacher : undefined

  return (
    <Page>
      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_auto] lg:justify-center xl:gap-12'>
        <div className='grid gap-6'>
          <PageHeader
            eyebrow='Teacher app'
            title='Teacher app preview'
            description='See what a teacher sees in the mobile app: today’s periods, classes, homework posts, parent meetings, chat and announcements.'
          />
          <Card className='grid gap-4 p-5'>
            <div className='grid gap-1.5'>
              <label htmlFor='preview-teacher' className='text-sm font-semibold'>
                Teacher
              </label>
              <Combobox
                id='preview-teacher'
                label='Teacher'
                placeholder='Pick a teacher'
                searchPlaceholder='Search by name or employee no.'
                value={search.staff ? String(search.staff) : undefined}
                options={options}
                onSearch={setQuery}
                emptyText={staff.isPending ? 'Loading teachers…' : 'No teachers found'}
                onChange={(value) =>
                  setSearch({ staff: value ? Number(value) : undefined, tab: 'home' })
                }
                className='h-11 sm:w-full'
              />
            </div>
            {search.staff && (
              <div className='grid gap-2 text-sm'>
                <div className='flex justify-between gap-3'>
                  <span className='text-muted-foreground'>Signed-in teacher</span>
                  <span className='truncate text-right font-semibold'>
                    {home.isPending
                      ? '…'
                      : teacher
                        ? teacher.can_sign_in
                          ? teacher.name
                          : `${teacher.name} (login off)`
                        : '—'}
                  </span>
                </div>
                <div className='flex justify-between gap-3'>
                  <span className='text-muted-foreground'>School</span>
                  <span className='truncate text-right font-semibold'>
                    {me?.school?.name ?? '—'}
                  </span>
                </div>
                <Link
                  to='/staff/$staffId'
                  params={{ staffId: String(search.staff) }}
                  search={{ tab: 'profile' }}
                  className='mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline'
                >
                  Open staff profile <ExternalLink className='size-3.5' />
                </Link>
              </div>
            )}
            <p className='text-xs text-muted-foreground'>
              Read-only. The preview uses the same data as the Teacher app and never signs in as the
              teacher. Opening a chat is recorded in the chat access log.
            </p>
          </Card>
        </div>

        {search.staff ? (
          <TeacherPhone
            staffId={search.staff}
            tab={tab}
            onTab={(next) => setSearch({ tab: next })}
          />
        ) : (
          <Card className='sm:w-[390px]'>
            <EmptyState
              icon={Smartphone}
              title='Pick a teacher'
              description='Choose a teacher to see the teacher app as they see it.'
            />
          </Card>
        )}
      </div>
    </Page>
  )
}
