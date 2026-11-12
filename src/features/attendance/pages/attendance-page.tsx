import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CalendarCheck, Inbox, UsersRound } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { can, useMe } from '@/features/auth/api'
import { useStaffLeaves } from '../api'
import { LeaveTab } from '../components/leave-tab'
import { StaffTab } from '../components/staff-tab'
import { StudentsTab } from '../components/students-tab'
import { today } from '../labels'
import type { AttendanceSearch, AttendanceTab } from '../search'

const route = getRouteApi('/_app/attendance')

export function AttendancePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/attendance' })
  const me = useMe().data
  const canManage = can(me, 'attendance.manage')
  const canApprove = can(me, 'leave.approve')
  const date = search.date ?? today()
  const staffWaiting = useStaffLeaves({ page: 1, limit: 1, status: 'waiting' })

  const setSearch = (patch: Partial<AttendanceSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  const go = (tab: AttendanceTab) =>
    setSearch({ tab, section_id: undefined, page: 1, search: undefined, status: undefined })
  const setDate = (next: string) =>
    setSearch({ date: next === today() ? undefined : next, section_id: undefined })

  return (
    <Page>
      <PageHeader
        eyebrow='Academics'
        title='Attendance'
        description='Daily attendance of every section, staff check-ins and leave requests waiting for a decision.'
      />
      <PageTabs
        label='Attendance sections'
        value={search.tab}
        onChange={go}
        tabs={[
          { value: 'students', label: 'Students', icon: CalendarCheck },
          { value: 'staff', label: 'Staff', icon: UsersRound },
          {
            value: 'leave',
            label: 'Leave requests',
            icon: Inbox,
            count: staffWaiting.data?.total || undefined,
          },
        ]}
      />
      {search.tab === 'students' && (
        <StudentsTab
          date={date}
          session={search.session ?? 'morning'}
          onSessionChange={(session) =>
            setSearch({
              session: session === 'morning' ? undefined : session,
              section_id: undefined,
            })
          }
          sectionId={search.section_id}
          canManage={canManage}
          onDateChange={setDate}
          onOpenSection={(section_id) => setSearch({ section_id })}
        />
      )}
      {search.tab === 'staff' && (
        <StaffTab
          date={date}
          canManage={canManage}
          page={search.staff_page ?? 1}
          search={search.staff_search}
          status={search.staff_status}
          onDateChange={(next) =>
            setSearch({
              date: next === today() ? undefined : next,
              section_id: undefined,
              staff_page: 1,
            })
          }
          onSearchChange={setSearch}
        />
      )}
      {search.tab === 'leave' && (
        <LeaveTab
          search={search}
          canDecideStaff={canApprove}
          onSearchChange={(patch) => setSearch({ page: 1, ...patch })}
        />
      )}
    </Page>
  )
}
