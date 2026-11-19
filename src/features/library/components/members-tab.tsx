import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Ban,
  CalendarX2,
  CircleOff,
  GraduationCap,
  IndianRupee,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import { MEMBER_STATUSES, MEMBER_TYPES, useMemberInsights, useMembers, type Member } from '../api'
import { MEMBER_STATUS, MEMBER_TYPE, badgeOf, optionsOf } from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps, type LibrarySearch } from '../search'
import { BulkEnrolModal, EnrolModal } from './enrol-modals'
import { MemberLine } from './library-parts'
import { ClassFilter, SectionFilter } from './school-pickers'

export function MembersTab({ search, onChange }: LibraryTabProps) {
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'library.manage')
  const memberType = oneOf(MEMBER_TYPES, search.member_type)
  const status = oneOf(MEMBER_STATUSES, search.status)
  const members = useMembers({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    search: search.search,
    sort: search.sort,
    order: search.order,
    member_type: memberType,
    status,
    class_id: search.class_id,
    section_id: search.section_id,
    has_overdue: search.has_overdue,
    has_fines: search.has_fines,
  })
  const insights = useMemberInsights()
  const [enrolling, setEnrolling] = useState(false)
  const [bulk, setBulk] = useState(false)
  const data = insights.data

  const only = (patch: Partial<LibrarySearch>, active: boolean) =>
    onChange({
      member_type: undefined,
      status: undefined,
      has_overdue: undefined,
      has_fines: undefined,
      ...(active ? {} : patch),
    })

  const cards: Insight[] = [
    {
      key: 'members',
      label: 'Members',
      value: data?.members ?? 0,
      hint: `${data?.students_not_enrolled ?? 0} students not enrolled yet`,
      icon: UsersRound,
      tone: 'primary',
      active: !memberType && !status && !search.has_overdue && !search.has_fines,
      onClick: () => only({}, true),
    },
    {
      key: 'students',
      label: 'Students',
      value: data?.students ?? 0,
      hint: `${data?.staff ?? 0} staff`,
      icon: GraduationCap,
      tone: 'info',
      active: memberType === 'student',
      onClick: () => only({ member_type: 'student' }, memberType === 'student'),
    },
    {
      key: 'overdue',
      label: 'With overdue books',
      value: data?.with_overdue ?? 0,
      hint: `${data?.suspended ?? 0} suspended`,
      icon: CalendarX2,
      tone: data?.with_overdue ? 'warning' : 'success',
      active: search.has_overdue === true,
      onClick: () => only({ has_overdue: true }, search.has_overdue === true),
    },
    {
      key: 'fines',
      label: 'With unpaid fines',
      value: data?.with_fines ?? 0,
      hint: 'Collect at the desk',
      icon: IndianRupee,
      tone: data?.with_fines ? 'danger' : 'success',
      active: search.has_fines === true,
      onClick: () => only({ has_fines: true }, search.has_fines === true),
    },
  ]

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Member',
      sortKey: 'name',
      cell: (member) => <MemberLine member={member} link={false} />,
    },
    {
      key: 'card_no',
      header: 'Card',
      sortKey: 'card_no',
      hideBelow: 'lg',
      cell: (member) => <span className='font-mono text-xs'>{member.card_no}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (member) => {
        const item = badgeOf(MEMBER_STATUS, member.status)
        return <Badge tone={item.tone}>{item.label}</Badge>
      },
    },
    {
      key: 'loans',
      header: 'Holding',
      cell: (member) => (
        <span className='flex items-center gap-1.5'>
          <span className='tabular'>
            {member.open_loans} / {member.max_books}
          </span>
          {member.overdue_loans > 0 && <Badge tone='danger'>{member.overdue_loans} overdue</Badge>}
        </span>
      ),
    },
    {
      key: 'fines',
      header: 'Unpaid fines',
      align: 'right',
      cell: (member) =>
        member.unpaid_fines ? (
          <span className='tabular font-bold text-destructive'>{rupees(member.unpaid_fines)}</span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'joined_on',
      header: 'Joined',
      sortKey: 'joined_on',
      hideBelow: 'xl',
      cell: (member) => formatDate(member.joined_on),
    },
  ]

  const filtered = Boolean(
    search.search ||
    memberType ||
    status ||
    search.class_id ||
    search.section_id ||
    search.has_overdue ||
    search.has_fines
  )

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={members.data ? `${members.data.total} members` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    member_type: undefined,
                    status: undefined,
                    class_id: undefined,
                    section_id: undefined,
                    has_overdue: undefined,
                    has_fines: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Name, card, admission or employee no'
            label='Search members'
          />
          <FilterSelect
            id='member-type-filter'
            label='Filter by member type'
            allLabel='Students and staff'
            value={memberType}
            options={optionsOf(MEMBER_TYPE)}
            onChange={(member_type) => onChange({ member_type })}
          />
          <FilterSelect
            id='member-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={status}
            options={optionsOf(MEMBER_STATUS)}
            onChange={(next) => onChange({ status: next })}
          />
          <ClassFilter
            value={search.class_id}
            onChange={(class_id) => onChange({ class_id, section_id: undefined })}
          />
          <SectionFilter
            classId={search.class_id}
            value={search.section_id}
            onChange={(section_id) => onChange({ section_id })}
          />
          {canManage && (
            <div className='flex flex-wrap gap-2 sm:ml-auto'>
              <Button variant='outline' size='sm' onClick={() => setBulk(true)}>
                <UsersRound />
                Enrol many
              </Button>
              <Button size='sm' onClick={() => setEnrolling(true)}>
                <UserPlus />
                Enrol
              </Button>
            </div>
          )}
        </ListToolbar>
        <DataTable
          rows={members.data?.items ?? []}
          columns={columns}
          rowKey={(member) => member.id}
          loading={members.isFetching}
          error={members.isError ? members.error.message : null}
          onRetry={() => members.refetch()}
          onRowClick={(member) =>
            navigate({
              to: '/library/members/$memberId',
              params: { memberId: String(member.id) },
              search: {},
            })
          }
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => onChange(next)}
          empty={{
            icon: filtered ? CircleOff : UsersRound,
            title: filtered ? 'No members match these filters' : 'No members yet',
            description: filtered
              ? 'Try another name or number, or clear the filters.'
              : 'Enrol a whole section at once, or scan a student at the desk to enrol them.',
            action: !filtered && canManage && (
              <Button onClick={() => setBulk(true)}>
                <UsersRound />
                Enrol many
              </Button>
            ),
          }}
          card={(member) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <MemberLine member={member} link={false} />
                {member.status !== 'active' ? (
                  <Badge tone='danger'>
                    <Ban className='size-3' />
                    {MEMBER_STATUS[member.status].label}
                  </Badge>
                ) : null}
              </div>
              <span className='text-xs text-muted-foreground'>
                Holding {member.open_loans} / {member.max_books}
                {member.overdue_loans ? ` · ${member.overdue_loans} overdue` : ''}
                {member.unpaid_fines ? ` · ${rupees(member.unpaid_fines)} unpaid` : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: members.data?.total ?? 0,
            label: 'members',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
      {enrolling && <EnrolModal onClose={() => setEnrolling(false)} />}
      {bulk && <BulkEnrolModal onClose={() => setBulk(false)} />}
    </div>
  )
}
