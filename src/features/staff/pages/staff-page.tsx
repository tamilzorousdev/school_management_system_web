import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  CircleOff,
  Gauge,
  Grid3x3,
  Plus,
  School,
  Smartphone,
  UsersRound,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useStaffInsights, useStaffList, type StaffListItem } from '../api'
import { LoadBar } from '../components/load-bar'
import { AttentionBadges, StaffRoleBadges } from '../components/staff-badges'
import { StaffFormModal } from '../components/staff-form-modal'
import {
  STAFF_ROLE_LABELS,
  STAFF_STATUS,
  STAFF_STATUS_LABELS,
  STAFF_TYPE_LABELS,
  toOptions,
} from '../labels'
import type { StaffSearch } from '../search'

const route = getRouteApi('/_app/staff')
const LIMIT = 20

type CardFlag = 'class_teacher' | 'needs_attention' | 'overloaded'

export function StaffPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/staff' })
  const me = useMe().data
  const canManage = can(me, 'staff.manage')
  const [adding, setAdding] = useState(false)

  const staff = useStaffList({ ...search, limit: LIMIT })
  const insights = useStaffInsights()
  const rows = staff.data?.items ?? []

  const setSearch = (patch: Partial<StaffSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const toggle = (key: CardFlag) =>
    setSearch({
      class_teacher: undefined,
      needs_attention: undefined,
      overloaded: undefined,
      [key]: search[key] ? undefined : true,
    })
  const openStaff = (id: number) =>
    navigate({
      to: '/staff/$staffId',
      params: { staffId: String(id) },
      search: { tab: 'profile' },
    })

  useShortcut('app.refresh', () => {
    void staff.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const overloaded = data?.overloaded ?? 0
  const attention = data?.need_attention ?? 0
  const cards: Insight[] = [
    {
      key: 'teachers',
      label: 'Teachers',
      value: data?.total_teachers ?? 0,
      hint: `${data?.total_staff ?? 0} staff in all`,
      icon: UsersRound,
      tone: 'primary',
      active: search.staff_type === 'teaching',
      onClick: () =>
        setSearch({ staff_type: search.staff_type === 'teaching' ? undefined : 'teaching' }),
    },
    {
      key: 'load',
      label: 'Average load',
      value: data?.average_load ?? 0,
      hint: overloaded ? `${overloaded} over their limit` : 'periods a week',
      icon: Gauge,
      tone: overloaded ? 'danger' : 'info',
      active: Boolean(search.overloaded),
      onClick: overloaded || search.overloaded ? () => toggle('overloaded') : undefined,
    },
    {
      key: 'class-teachers',
      label: 'Class teachers',
      value: data?.class_teachers ?? 0,
      hint: 'In charge of a section this year',
      icon: School,
      tone: 'success',
      active: Boolean(search.class_teacher),
      onClick: () => toggle('class_teacher'),
    },
    {
      key: 'attention',
      label: 'Need attention',
      value: attention,
      hint: attention ? 'Documents, bank details or classes' : 'Every profile is complete',
      icon: AlertTriangle,
      tone: attention ? (attention > 5 ? 'danger' : 'warning') : 'success',
      active: Boolean(search.needs_attention),
      onClick: () => toggle('needs_attention'),
    },
  ]

  const columns: Column<StaffListItem>[] = [
    {
      key: 'name',
      header: 'Staff',
      sortKey: 'name',
      cell: (member) => (
        <div className='flex items-center gap-3'>
          <Avatar
            name={member.name}
            src={member.photo_url}
            previewable
            subtitle={member.employee_no ? `Employee No: ${member.employee_no}` : member.designation}
          />
          <div className='grid min-w-0'>
            <span className='flex items-center gap-1.5 truncate font-bold'>
              {member.name}
              {member.status !== 'active' && (
                <Badge tone={STAFF_STATUS[member.status].tone}>
                  {STAFF_STATUS[member.status].label}
                </Badge>
              )}
            </span>
            <span className='truncate font-mono text-xs text-muted-foreground'>
              {member.employee_no}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Role',
      sortKey: 'designation',
      cell: (member) => (
        <div className='grid gap-1'>
          <span className='font-semibold'>
            {member.designation}
            {member.department && (
              <span className='font-normal text-muted-foreground'> · {member.department}</span>
            )}
          </span>
          <StaffRoleBadges roles={member.roles} />
        </div>
      ),
    },
    {
      key: 'load',
      header: 'Load',
      cell: (member) =>
        member.staff_type === 'teaching' ? (
          <LoadBar
            load={member.load_periods}
            max={member.max_periods_per_week}
            className='max-w-36'
          />
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'class-teacher',
      header: 'Class teacher of',
      hideBelow: 'xl',
      cell: (member) =>
        member.class_teacher_of.length ? (
          <span className='flex flex-wrap gap-1'>
            {member.class_teacher_of.map((section) => (
              <Badge key={section.id} tone='info'>
                {section.name}
              </Badge>
            ))}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'attention',
      header: 'Attention',
      hideBelow: 'lg',
      cell: (member) => <AttentionBadges reasons={member.attention} />,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.staff_type ||
    search.status ||
    search.role ||
    search.department ||
    search.class_teacher ||
    search.needs_attention ||
    search.overloaded
  )

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Staff'
        description='Teachers and support staff with their roles, teaching load and anything that needs follow-up. Click a person for the full profile.'
        actions={
          <>
            <Button variant='outline' onClick={() => navigate({ to: '/staff/assignments' })}>
              <Grid3x3 />
              Assignments
            </Button>
            {canManage && (
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add staff
              </Button>
            )}
          </>
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={staff.data ? `${staff.data.total} staff` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Name, mobile, employee no. or department'
            label='Search staff'
          />
          <FilterSelect
            id='staff-type-filter'
            label='Filter by staff type'
            allLabel='All staff'
            value={search.staff_type}
            options={toOptions(STAFF_TYPE_LABELS)}
            onChange={(value) => setSearch({ staff_type: value as StaffSearch['staff_type'] })}
          />
          <FilterSelect
            id='role-filter'
            label='Filter by role'
            allLabel='All roles'
            value={search.role}
            options={toOptions(STAFF_ROLE_LABELS)}
            onChange={(value) => setSearch({ role: value as StaffSearch['role'] })}
          />
          <FilterSelect
            id='status-filter'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toOptions(STAFF_STATUS_LABELS)}
            onChange={(value) => setSearch({ status: value as StaffSearch['status'] })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(member) => member.id}
          loading={staff.isFetching}
          error={staff.isError ? staff.error.message : null}
          onRetry={() => staff.refetch()}
          onRowClick={(member) => openStaff(member.id)}
          sort={{ sort: search.sort, order: search.order ?? 'asc' }}
          onSortChange={(next) => setSearch(next as Partial<StaffSearch>)}
          empty={{
            icon: filtered ? CircleOff : UsersRound,
            title: filtered ? 'No staff match these filters' : 'No staff yet',
            description: filtered
              ? 'Try another name or mobile, or clear the filters.'
              : 'Add teachers and support staff so they can use the Staff app.',
            action: !filtered && canManage && (
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add staff
              </Button>
            ),
          }}
          card={(member) => (
            <div className='flex items-start gap-3'>
              <Avatar
                name={member.name}
                src={member.photo_url}
                previewable
                subtitle={member.employee_no ? `Employee No: ${member.employee_no}` : member.designation}
              />
              <div className='grid min-w-0 flex-1 gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='truncate font-bold'>{member.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {member.designation}
                      {member.department ? ` · ${member.department}` : ''}
                    </span>
                  </span>
                  <Badge tone={STAFF_STATUS[member.status].tone}>
                    {STAFF_STATUS[member.status].label}
                  </Badge>
                </div>
                <span className='flex items-center gap-1.5 font-mono text-xs text-muted-foreground'>
                  {member.employee_no}
                  {member.on_app && <Smartphone className='size-3 text-success' />}
                </span>
                {member.staff_type === 'teaching' && (
                  <LoadBar load={member.load_periods} max={member.max_periods_per_week} />
                )}
                {member.class_teacher_of.length > 0 && (
                  <span className='text-xs text-muted-foreground'>
                    Class teacher of{' '}
                    <span className='font-semibold text-foreground'>
                      {member.class_teacher_of.map((section) => section.name).join(', ')}
                    </span>
                  </span>
                )}
                {member.attention.length > 0 && <AttentionBadges reasons={member.attention} />}
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: staff.data?.total ?? 0,
            label: 'staff',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <StaffFormModal open={adding} onOpenChange={setAdding} onSaved={openStaff} />
    </Page>
  )
}
