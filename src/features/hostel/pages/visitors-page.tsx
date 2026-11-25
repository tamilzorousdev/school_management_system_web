import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  CircleOff,
  DoorOpen,
  LogOut,
  Plus,
  ShieldBan,
  UserRoundCheck,
  UsersRound,
  UserX,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { PageTabs } from '@/components/common/page-tabs'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  hostelApi,
  useBlocklist,
  useHostelMutation,
  useVisits,
  type HostelStudent,
  type Visit,
  type VisitListParams,
} from '../api'
import { HostelTabs } from '../components/hostel-tabs'
import { StudentCell } from '../components/leave-form-parts'
import { todayIso } from '../components/leave-helpers'
import { HostelSelect } from '../components/pickers'
import { ApprovedVisitorsSheet } from '../components/visit-approved-sheet'
import { VisitBlocklistPanel } from '../components/visit-blocklist'
import { VisitCheckInModal } from '../components/visit-checkin-modal'
import { ID_PROOF, toneOptions, VISIT_STATUS } from '../labels'
import type { VisitorsSearch } from '../search'

const route = getRouteApi('/_app/hostel/visitors')
const LIMIT = 20

type Tab = VisitorsSearch['tab']

export function VisitorsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/visitors' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canVisitor = can(me, 'hostel.visitor')
  const [checkingIn, setCheckingIn] = useState(false)
  const [approvedFor, setApprovedFor] = useState<HostelStudent | null>(null)
  const tab: Tab = search.tab
  const today = todayIso()

  const params: VisitListParams = {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    hostel_id: search.hostel_id,
    status: search.status,
    date: search.date,
    sort: search.sort,
    order: search.order,
  }
  const visits = useVisits(params, canView && tab === 'visits')
  const countOf = (extra: Partial<VisitListParams>) => ({
    page: 1,
    limit: 1,
    hostel_id: search.hostel_id,
    ...extra,
  })
  const inside = useVisits(countOf({ status: 'inside' }), canView)
  const todayVisits = useVisits(countOf({ date: today }), canView)
  const deniedToday = useVisits(countOf({ date: today, status: 'denied' }), canView)
  const blocklist = useBlocklist(canView)
  const checkOut = useHostelMutation((id: number) => hostelApi.checkOut(id))

  const setSearch = (patch: Partial<VisitorsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: Tab, patch: Partial<VisitorsSearch> = {}) =>
    navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id, ...patch } })

  useShortcut('hostel.create', () => setCheckingIn(true), { enabled: canVisitor })
  useShortcut('app.refresh', () => {
    void visits.refetch()
    void inside.refetch()
    void todayVisits.refetch()
    void deniedToday.refetch()
    void blocklist.refetch()
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Visitors'
      description='Who came to see a resident, who is inside now, and numbers that are not allowed in.'
      actions={
        canVisitor ? (
          <Button onClick={() => setCheckingIn(true)}>
            <Plus />
            Check in visitor
            <Kbd id='hostel.create' inverted />
          </Button>
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={DoorOpen}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const doCheckOut = (visit: Visit) =>
    checkOut.mutate(visit.id, {
      onSuccess: () => alerts.success(`${visit.visitor_name} checked out`),
      onError: (error) => alerts.error(toApiError(error).message),
    })

  const onlyInside = tab === 'visits' && search.status === 'inside' && !search.date
  const onlyToday = tab === 'visits' && search.date === today && !search.status
  const onlyDenied = tab === 'visits' && search.date === today && search.status === 'denied'
  const cards: Insight[] = [
    {
      key: 'inside',
      label: 'Inside now',
      value: inside.data?.total ?? 0,
      hint: 'Not checked out yet',
      icon: UsersRound,
      tone: 'primary',
      active: onlyInside,
      onClick: () =>
        tab !== 'visits'
          ? switchTab('visits', { status: 'inside' })
          : setSearch({ status: onlyInside ? undefined : 'inside', date: undefined }),
    },
    {
      key: 'today',
      label: 'Visits today',
      value: todayVisits.data?.total ?? 0,
      hint: 'Checked in today',
      icon: CalendarDays,
      tone: 'info',
      active: onlyToday,
      onClick: () =>
        tab !== 'visits'
          ? switchTab('visits', { date: today })
          : setSearch({ date: onlyToday ? undefined : today, status: undefined }),
    },
    {
      key: 'denied',
      label: 'Turned away today',
      value: deniedToday.data?.total ?? 0,
      hint: 'Blocked or refused',
      icon: UserX,
      tone: (deniedToday.data?.total ?? 0) > 0 ? 'warning' : 'neutral',
      active: onlyDenied,
      onClick: () =>
        tab !== 'visits'
          ? switchTab('visits', { date: today, status: 'denied' })
          : setSearch(
              onlyDenied
                ? { date: undefined, status: undefined }
                : { date: today, status: 'denied' }
            ),
    },
    {
      key: 'blocked',
      label: 'Blocked numbers',
      value: blocklist.data?.length ?? 0,
      hint: 'Cannot be checked in',
      icon: ShieldBan,
      tone: 'danger',
      active: tab === 'blocklist',
      onClick: () => switchTab(tab === 'blocklist' ? 'visits' : 'blocklist'),
    },
  ]

  const columns: Column<Visit>[] = [
    {
      key: 'visitor',
      header: 'Visitor',
      cell: (row) => <VisitorCell visit={row} />,
    },
    {
      key: 'people',
      header: 'People',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{row.people_count}</span>,
    },
    {
      key: 'student',
      header: 'Visiting',
      cell: (row) => (
        <div className='grid gap-1'>
          <StudentCell student={row.student} />
          <button
            type='button'
            className='justify-self-start text-xs font-semibold text-primary hover:underline'
            onClick={(event) => {
              event.stopPropagation()
              setApprovedFor(row.student)
            }}
          >
            Approved visitors
          </button>
        </div>
      ),
    },
    {
      key: 'in',
      header: 'In',
      sortKey: 'in_at',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.in_at)}</span>
      ),
    },
    {
      key: 'out',
      header: 'Out',
      sortKey: 'out_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.out_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <VisitBadges visit={row} />,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (row) =>
        canVisitor && row.status === 'inside' ? (
          <Button
            size='sm'
            variant='outline'
            loading={checkOut.isPending && checkOut.variables === row.id}
            onClick={() => doCheckOut(row)}
          >
            <LogOut />
            Check out
          </Button>
        ) : null,
    },
  ]

  const filtered = Boolean(search.search || search.hostel_id || search.status || search.date)

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/visitors' />

      <InsightCards items={cards} loading={inside.isPending || todayVisits.isPending} />

      <PageTabs
        label='Visitor sections'
        value={tab}
        onChange={(next) => switchTab(next)}
        tabs={[
          { value: 'visits', label: 'Visits', icon: DoorOpen },
          {
            value: 'blocklist',
            label: 'Blocked numbers',
            icon: ShieldBan,
            count: blocklist.data?.length || undefined,
          },
        ]}
      />

      {tab === 'blocklist' ? (
        <VisitBlocklistPanel />
      ) : (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={visits.data ? `${visits.data.total} visits` : ''}
            onClear={
              filtered
                ? () => navigate({ search: { tab: 'visits', page: 1 }, replace: true })
                : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search visitor, mobile, student or visit number'
              label='Search visits'
            />
            <HostelSelect
              id='visits-hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <FilterSelect
              id='visits-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.status}
              options={toneOptions(VISIT_STATUS)}
              onChange={(value) => setSearch({ status: value as VisitorsSearch['status'] })}
            />
            <DatePicker
              id='visits-date'
              value={search.date ?? ''}
              max={today}
              placeholder='Any date'
              className='sm:w-44'
              onChange={(value: string) => setSearch({ date: value || undefined })}
            />
          </ListToolbar>
          <DataTable
            rows={visits.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={visits.isFetching}
            error={visits.isError ? visits.error.message : null}
            onRetry={() => visits.refetch()}
            sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<VisitorsSearch>)}
            empty={{
              icon: filtered ? CircleOff : DoorOpen,
              title: filtered ? 'No visits match these filters' : 'No visitors yet',
              description: filtered
                ? 'Try another name or date, or clear the filters.'
                : 'Check in a visitor at the hostel gate. Parents get a message when someone visits.',
              action:
                canVisitor && !filtered ? (
                  <Button onClick={() => setCheckingIn(true)}>
                    <Plus />
                    Check in visitor
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <VisitorCell visit={row} />
                  <VisitBadges visit={row} />
                </div>
                <span className='text-xs text-muted-foreground'>
                  Visiting {row.student.name} · {row.people_count}{' '}
                  {row.people_count === 1 ? 'person' : 'people'}
                </span>
                <span className='text-xs text-muted-foreground'>
                  In {formatDateTime(row.in_at)}
                  {row.out_at ? ` · out ${formatDateTime(row.out_at)}` : ''}
                </span>
                <div className='flex flex-wrap gap-2'>
                  {canVisitor && row.status === 'inside' && (
                    <Button
                      size='sm'
                      variant='outline'
                      loading={checkOut.isPending && checkOut.variables === row.id}
                      onClick={() => doCheckOut(row)}
                    >
                      <LogOut />
                      Check out
                    </Button>
                  )}
                  <Button size='sm' variant='ghost' onClick={() => setApprovedFor(row.student)}>
                    <UserRoundCheck />
                    Approved visitors
                  </Button>
                </div>
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: visits.data?.total ?? 0,
              label: 'visits',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      {checkingIn && <VisitCheckInModal onClose={() => setCheckingIn(false)} />}
      <ApprovedVisitorsSheet student={approvedFor} onClose={() => setApprovedFor(null)} />
    </Page>
  )
}

function VisitorCell({ visit }: { visit: Visit }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='truncate font-semibold'>
        {visit.visitor_name}{' '}
        <span className='font-normal text-muted-foreground'>({visit.relation})</span>
      </span>
      <span className='tabular truncate text-xs text-muted-foreground'>
        +91 {visit.mobile} · <span className='font-mono'>{visit.visit_no}</span>
        {visit.id_proof_type
          ? ` · ${ID_PROOF[visit.id_proof_type]}${visit.id_proof_last4 ? ` ••${visit.id_proof_last4}` : ''}`
          : ''}
      </span>
      {visit.purpose && (
        <span className='truncate text-xs text-muted-foreground'>{visit.purpose}</span>
      )}
    </div>
  )
}

function VisitBadges({ visit }: { visit: Visit }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      <Badge tone={VISIT_STATUS[visit.status].tone} dot>
        {VISIT_STATUS[visit.status].label}
      </Badge>
      {visit.is_known ? <Badge tone='success'>Known</Badge> : <Badge tone='warning'>New</Badge>}
    </div>
  )
}
