import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Clock,
  Eye,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
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
import { DriverRatingsTab } from '../components/driver-ratings-tab'
import { DUTY_LABELS, DUTY_STATUS, EXPIRY_FILTER_LABELS, ROLE_LABELS } from '../labels'
import type { CrewSearch, CrewTab } from '../search'

const route = getRouteApi('/_app/crew')
const LIMIT = 20

export function CrewPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/crew' })
  const me = useMe().data
  const canManage = can(me, 'fleet.manage')
  const [adding, setAdding] = useState(false)

  const { tab: tabParam, ...listFilters } = search
  const tab: CrewTab = tabParam ?? 'crew'
  const crew = useCrewList({ ...listFilters, limit: LIMIT })
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
      icon: User,
      tone: 'primary',
      active: search.role === 'driver',
      onClick: () => setSearch({ role: search.role === 'driver' ? undefined : 'driver' }),
    },
    {
      key: 'attendants',
      label: 'Attendants',
      value: data?.attendants ?? 0,
      hint: 'Bus attendants',
      icon: Users,
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
      icon: AlertCircle,
      tone: data?.pending ? 'warning' : 'success',
      active: search.duty_status === 'pending',
      onClick: () => toggleDuty('pending'),
    },
    {
      key: 'blocked',
      label: 'Blocked',
      value: data?.blocked ?? 0,
      hint: data?.blocked ? 'Cannot run a bus' : 'Nobody is blocked',
      icon: AlertTriangle,
      tone: data?.blocked ? 'danger' : 'success',
      active: search.duty_status === 'blocked',
      onClick: () => toggleDuty('blocked'),
    },
    {
      key: 'due',
      label: 'Ending in 30 days',
      value: data?.due_soon ?? 0,
      hint: 'Licence, badge, medical or police',
      icon: Clock,
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
      header: 'NAME',
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
            <span className='flex items-center gap-1.5 truncate'>
              <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                {member.name}
              </span>
              {member.status !== 'active' && (
                <Badge tone={STAFF_STATUS[member.status].tone} className='text-[11px] font-medium'>
                  {STAFF_STATUS[member.status].label}
                </Badge>
              )}
            </span>
            <span className='truncate font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
              {member.employee_no}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'ROLE',
      cell: (member) => (
        <Badge tone={ROLE_BADGE[member.role].tone} className='font-medium'>
          {ROLE_BADGE[member.role].label}
        </Badge>
      ),
    },
    {
      key: 'duty',
      header: 'DUTY',
      cell: (member) => (
        <Badge tone={DUTY_STATUS[member.duty_status].tone} dot className='font-medium'>
          {DUTY_STATUS[member.duty_status].label}
        </Badge>
      ),
    },
    {
      key: 'bus',
      header: 'BUS',
      cell: (member) =>
        member.vehicle ? (
          <div className='grid min-w-0'>
            <span className='font-mono text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {member.vehicle.name}
            </span>
            {member.route && (
              <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {member.route.name}
              </span>
            )}
          </div>
        ) : (
          <span className='text-[12px] leading-[16px] text-slate-400 dark:text-slate-500'>
            Not on a bus
          </span>
        ),
    },
    {
      key: 'licence',
      header: 'LICENCE',
      sortKey: 'licence_expiry',
      cell: (member) => {
        const state = licence(member)
        if (!state)
          return (
            <span className='text-[12px] leading-[16px] text-slate-400 dark:text-slate-500'>
              Not needed
            </span>
          )
        return (
          <div className='grid min-w-0 gap-1'>
            <span className='font-mono text-[12px] leading-[16px] font-medium text-slate-700 dark:text-slate-300'>
              {member.licence_no ?? 'No number'}
              {member.licence_type ? ` · ${member.licence_type}` : ''}
            </span>
            <ExpiryBadge item={state} withKind={false} />
          </div>
        )
      },
    },
    {
      key: 'compliance',
      header: 'OTHER DOCUMENTS',
      hideBelow: 'lg',
      cell: (member) => (
        <ExpiryBadges items={member.expiries.filter((item) => item.kind !== 'licence')} />
      ),
    },
    {
      key: 'mobile',
      header: 'MOBILE',
      hideBelow: 'xl',
      cell: (member) => (
        <span className='tabular flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          +91 {member.mobile}
          {member.on_app && (
            <Smartphone className='size-3.5 text-emerald-600 dark:text-emerald-400' />
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right' as const,
      cell: (member) => (
        <div className='flex items-center justify-end gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={`View crew member ${member.name}`}
            title='View crew member'
            className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            onClick={(event) => {
              event.stopPropagation()
              openMember(member.id)
            }}
          >
            <Eye className='size-4 stroke-[1.75]' />
          </Button>
        </div>
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
            <Button
              variant='primary'
              size='md'
              className='h-9 px-4 font-semibold'
              onClick={() => setAdding(true)}
            >
              <Plus className='size-4 stroke-[1.75]' />
              Add driver or attendant
            </Button>
          )
        }
      />

      <PageTabs
        label='Drivers and attendants sections'
        value={tab}
        onChange={(next: CrewTab) => navigate({ search: { page: 1, tab: next }, replace: true })}
        tabs={[
          { value: 'crew', label: 'Crew', icon: Users },
          { value: 'ratings', label: 'Driver ratings', icon: Star },
        ]}
      />

      {tab === 'ratings' && <DriverRatingsTab />}

      {tab === 'crew' && <InsightCards items={cards} loading={insights.isPending} />}

      {tab === 'crew' && (
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
              compact
            />
            <FilterSelect
              id='crew-role-filter'
              label='Filter by role'
              allLabel='Drivers and attendants'
              value={search.role}
              options={toOptions(ROLE_LABELS)}
              onChange={(value) => setSearch({ role: value as CrewSearch['role'] })}
              className='h-8 border-[#9AA49F] text-[13px]'
            />
            <FilterSelect
              id='crew-duty-filter'
              label='Filter by duty status'
              allLabel='Any duty status'
              value={search.duty_status}
              options={toOptions(DUTY_LABELS)}
              onChange={(value) => setSearch({ duty_status: value as CrewSearch['duty_status'] })}
              className='h-8 border-[#9AA49F] text-[13px]'
            />
            <FilterSelect
              id='crew-expiry-filter'
              label='Filter by document dates'
              allLabel='Any document dates'
              value={search.expiry_state}
              options={toOptions(EXPIRY_FILTER_LABELS)}
              onChange={(value) => setSearch({ expiry_state: value as CrewSearch['expiry_state'] })}
              className='h-8 border-[#9AA49F] text-[13px]'
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
              className='h-8 border-[#9AA49F] text-[13px]'
            />
            <FilterSelect
              id='crew-status-filter'
              label='Filter by status'
              allLabel='Any status'
              value={search.status}
              options={toOptions(STAFF_STATUS_LABELS)}
              onChange={(value) => setSearch({ status: value as CrewSearch['status'] })}
              className='h-8 border-[#9AA49F] text-[13px]'
            />
            {reminding && (
              <Button
                variant='secondary'
                size='sm'
                className='border-[#C6CEC9] bg-white font-medium text-[#171B19] hover:bg-[#F9FAFB]'
                onClick={sendReminders}
                loading={remindMany.isPending}
              >
                <Bell className='size-4 stroke-[1.75]' />
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
              icon: filtered ? AlertCircle : Users,
              title: filtered ? 'No crew match these filters' : 'No drivers or attendants yet',
              description: filtered
                ? 'Try another name or number, or clear the filters.'
                : 'Add bus drivers and attendants, upload their documents and approve them for duty.',
              action: !filtered && canManage && (
                <Button
                  variant='primary'
                  size='md'
                  className='h-9 px-4 font-semibold'
                  onClick={() => setAdding(true)}
                >
                  <Plus className='size-4 stroke-[1.75]' />
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
                        <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                          {member.name}
                        </span>
                        <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                          {ROLE_BADGE[member.role].label}
                          {member.vehicle ? ` · ${member.vehicle.name}` : ' · Not on a bus'}
                        </span>
                      </span>
                      <Badge
                        tone={DUTY_STATUS[member.duty_status].tone}
                        dot
                        className='font-medium'
                      >
                        {DUTY_STATUS[member.duty_status].label}
                      </Badge>
                    </div>
                    <span className='flex items-center gap-1.5 font-mono text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                      {member.employee_no}
                      {member.on_app && (
                        <Smartphone className='size-3 text-emerald-600 dark:text-emerald-400' />
                      )}
                    </span>
                    {state && member.licence_no && (
                      <span className='font-mono text-[12px] leading-[16px] text-slate-600 dark:text-slate-300'>
                        {member.licence_no}
                      </span>
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
      )}

      <CrewFormModal open={adding} onOpenChange={setAdding} onSaved={openMember} />
    </Page>
  )
}
