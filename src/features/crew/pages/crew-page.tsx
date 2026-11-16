import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  BellRing,
  CalendarClock,
  CircleOff,
  IdCard,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
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
import { STAFF_STATUS, STAFF_STATUS_LABELS, toOptions } from '@/features/staff/labels'
import { useBusOptions } from '@/features/transport/api'
import { ExpiryBadge, ExpiryBadges } from '@/features/transport/components/expiry-badges'
import { ROLE_BADGE } from '@/features/transport/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { crewApi, useCrewInsights, useCrewList, useCrewMutation, type CrewListItem } from '../api'
import { CrewFormModal } from '../components/crew-form-modal'
import { DUTY_LABELS, DUTY_STATUS, EXPIRY_FILTER_LABELS, ROLE_LABELS } from '../labels'
import type { CrewSearch } from '../search'

const route = getRouteApi('/_app/crew')
const LIMIT = 20

export function CrewPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/crew' })
  const me = useMe().data
  const canManage = can(me, 'fleet.manage')
  const [adding, setAdding] = useState(false)

  const crew = useCrewList({ ...search, limit: LIMIT })
  const insights = useCrewInsights()
  const busOptions = useBusOptions()
  const remindMany = useCrewMutation((ids: number[]) => crewApi.remindMany(ids))
  const rows = crew.data?.items ?? []

  const setSearch = (patch: Partial<CrewSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openMember = (id: number) =>
    navigate({
      to: '/crew/$staffId',
      params: { staffId: String(id) },
      search: { tab: 'clearance' },
    })

  useShortcut('app.refresh', () => {
    void crew.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const toggleDuty = (value: CrewSearch['duty_status']) =>
    setSearch({ duty_status: search.duty_status === value ? undefined : value })
  const cards: Insight[] = [
    {
      key: 'drivers',
      label: 'Drivers',
      value: data?.drivers ?? 0,
      hint: data?.unassigned
        ? `${data.unassigned} crew not on a bus`
        : 'Every crew member has a bus',
      icon: IdCard,
      tone: 'primary',
      active: search.role === 'driver',
      onClick: () => setSearch({ role: search.role === 'driver' ? undefined : 'driver' }),
    },
    {
      key: 'attendants',
      label: 'Attendants',
      value: data?.attendants ?? 0,
      hint: 'Bus attendants',
      icon: UsersRound,
      tone: 'info',
      active: search.role === 'attendant',
      onClick: () => setSearch({ role: search.role === 'attendant' ? undefined : 'attendant' }),
    },
    {
      key: 'approved',
      label: 'On duty',
      value: data?.approved ?? 0,
      hint: 'Cleared and approved',
      icon: ShieldCheck,
      tone: 'success',
      active: search.duty_status === 'approved',
      onClick: () => toggleDuty('approved'),
    },
    {
      key: 'pending',
      label: 'Not approved',
      value: data?.pending ?? 0,
      hint: 'Waiting for checks or approval',
      icon: ShieldQuestion,
      tone: data?.pending ? 'warning' : 'success',
      active: search.duty_status === 'pending',
      onClick: () => toggleDuty('pending'),
    },
    {
      key: 'blocked',
      label: 'Blocked',
      value: data?.blocked ?? 0,
      hint: data?.blocked ? 'Cannot run a bus' : 'Nobody is blocked',
      icon: ShieldAlert,
      tone: data?.blocked ? 'danger' : 'success',
      active: search.duty_status === 'blocked',
      onClick: () => toggleDuty('blocked'),
    },
    {
      key: 'due',
      label: 'Ending in 30 days',
      value: data?.due_soon ?? 0,
      hint: 'Licence, badge, medical or police',
      icon: CalendarClock,
      tone: data?.due_soon ? 'warning' : 'success',
      active: search.expiry_state === 'due_soon',
      onClick: () =>
        setSearch({ expiry_state: search.expiry_state === 'due_soon' ? undefined : 'due_soon' }),
    },
  ]

  const reminding =
    canManage &&
    rows.length > 0 &&
    (search.expiry_state === 'due_soon' ||
      search.expiry_state === 'expired' ||
      search.duty_status === 'blocked')

  const sendReminders = async () => {
    try {
      const result = await remindMany.mutateAsync(rows.map((row) => row.id))
      alerts.success(
        result.sent
          ? `${result.sent} ${result.sent === 1 ? 'reminder' : 'reminders'} sent${result.skipped ? `, ${result.skipped} skipped` : ''}`
          : 'Nobody needed a reminder right now'
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const licence = (member: CrewListItem) => member.expiries.find((item) => item.kind === 'licence')

  const columns: Column<CrewListItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      cell: (member) => (
        <div className='flex items-center gap-3'>
          <Avatar
            name={member.name}
            src={member.photo_url}
            previewable
            subtitle={`Employee No: ${member.employee_no}`}
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
      key: 'role',
      header: 'Role',
      cell: (member) => (
        <Badge tone={ROLE_BADGE[member.role].tone}>{ROLE_BADGE[member.role].label}</Badge>
      ),
    },
    {
      key: 'duty',
      header: 'Duty',
      cell: (member) => (
        <Badge tone={DUTY_STATUS[member.duty_status].tone} dot>
          {DUTY_STATUS[member.duty_status].label}
        </Badge>
      ),
    },
    {
      key: 'bus',
      header: 'Bus',
      cell: (member) =>
        member.vehicle ? (
          <span className='grid'>
            <span className='font-mono font-semibold'>{member.vehicle.name}</span>
            {member.route && (
              <span className='text-xs text-muted-foreground'>{member.route.name}</span>
            )}
          </span>
        ) : (
          <span className='text-muted-foreground'>Not on a bus</span>
        ),
    },
    {
      key: 'licence',
      header: 'Licence',
      sortKey: 'licence_expiry',
      cell: (member) => {
        const state = licence(member)
        if (!state) return <span className='text-muted-foreground'>Not needed</span>
        return (
          <span className='grid gap-1'>
            <span className='font-mono text-xs'>
              {member.licence_no ?? 'No number'}
              {member.licence_type ? ` · ${member.licence_type}` : ''}
            </span>
            <ExpiryBadge item={state} withKind={false} />
          </span>
        )
      },
    },
    {
      key: 'compliance',
      header: 'Other documents',
      hideBelow: 'lg',
      cell: (member) => (
        <ExpiryBadges items={member.expiries.filter((item) => item.kind !== 'licence')} />
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      hideBelow: 'xl',
      cell: (member) => (
        <span className='flex items-center gap-1.5 text-sm'>
          +91 {member.mobile}
          {member.on_app && <Smartphone className='size-3 text-success' />}
        </span>
      ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.role ||
    search.duty_status ||
    search.expiry_state ||
    search.vehicle_id ||
    search.unassigned ||
    search.status
  )

  return (
    <Page>
      <PageHeader
        eyebrow='People'
        title='Drivers & attendants'
        description='Bus crew with their licence, badge, medical and police checks. Approve each person for duty once every document is verified and in date.'
        actions={
          canManage && (
            <Button onClick={() => setAdding(true)}>
              <Plus />
              Add driver or attendant
            </Button>
          )
        }
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={crew.data ? `${crew.data.total} crew` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Name, mobile, employee, licence or badge no.'
            label='Search drivers and attendants'
          />
          <FilterSelect
            id='crew-role-filter'
            label='Filter by role'
            allLabel='Drivers and attendants'
            value={search.role}
            options={toOptions(ROLE_LABELS)}
            onChange={(value) => setSearch({ role: value as CrewSearch['role'] })}
          />
          <FilterSelect
            id='crew-duty-filter'
            label='Filter by duty status'
            allLabel='Any duty status'
            value={search.duty_status}
            options={toOptions(DUTY_LABELS)}
            onChange={(value) => setSearch({ duty_status: value as CrewSearch['duty_status'] })}
          />
          <FilterSelect
            id='crew-expiry-filter'
            label='Filter by document dates'
            allLabel='Any document dates'
            value={search.expiry_state}
            options={toOptions(EXPIRY_FILTER_LABELS)}
            onChange={(value) => setSearch({ expiry_state: value as CrewSearch['expiry_state'] })}
          />
          <FilterSelect
            id='crew-bus-filter'
            label='Filter by bus'
            allLabel='Any bus'
            value={search.vehicle_id ? String(search.vehicle_id) : undefined}
            options={busOptions}
            onChange={(value) =>
              setSearch({ vehicle_id: value ? Number(value) : undefined, unassigned: undefined })
            }
          />
          <FilterSelect
            id='crew-status-filter'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toOptions(STAFF_STATUS_LABELS)}
            onChange={(value) => setSearch({ status: value as CrewSearch['status'] })}
          />
          {reminding && (
            <Button variant='outline' onClick={sendReminders} loading={remindMany.isPending}>
              <BellRing />
              Remind these crew
            </Button>
          )}
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(member) => member.id}
          loading={crew.isFetching}
          error={crew.isError ? crew.error.message : null}
          onRetry={() => crew.refetch()}
          onRowClick={(member) => openMember(member.id)}
          sort={{ sort: search.sort, order: search.order ?? 'asc' }}
          onSortChange={(next) => setSearch(next as Partial<CrewSearch>)}
          empty={{
            icon: filtered ? CircleOff : IdCard,
            title: filtered ? 'No crew match these filters' : 'No drivers or attendants yet',
            description: filtered
              ? 'Try another name or number, or clear the filters.'
              : 'Add bus drivers and attendants, upload their documents and approve them for duty.',
            action: !filtered && canManage && (
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add driver or attendant
              </Button>
            ),
          }}
          card={(member) => {
            const state = licence(member)
            return (
              <div className='flex items-start gap-3'>
                <Avatar
                  name={member.name}
                  src={member.photo_url}
                  previewable
                  subtitle={`Employee No: ${member.employee_no}`}
                />
                <div className='grid min-w-0 flex-1 gap-1.5'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='grid min-w-0'>
                      <span className='truncate font-bold'>{member.name}</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {ROLE_BADGE[member.role].label}
                        {member.vehicle ? ` · ${member.vehicle.name}` : ' · Not on a bus'}
                      </span>
                    </span>
                    <Badge tone={DUTY_STATUS[member.duty_status].tone} dot>
                      {DUTY_STATUS[member.duty_status].label}
                    </Badge>
                  </div>
                  <span className='flex items-center gap-1.5 font-mono text-xs text-muted-foreground'>
                    {member.employee_no}
                    {member.on_app && <Smartphone className='size-3 text-success' />}
                  </span>
                  {state && member.licence_no && (
                    <span className='font-mono text-xs'>{member.licence_no}</span>
                  )}
                  <ExpiryBadges items={member.expiries} />
                </div>
              </div>
            )
          }}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: crew.data?.total ?? 0,
            label: 'crew',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <CrewFormModal open={adding} onOpenChange={setAdding} onSaved={openMember} />
    </Page>
  )
}
