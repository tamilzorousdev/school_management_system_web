import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlarmClock,
  CircleOff,
  ClipboardCheck,
  DoorOpen,
  Hourglass,
  LogOut,
  Plus,
  ScanLine,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
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
import { formatDate, formatDateTime } from '@/lib/format'
import { useLeaves, type Leave, type LeaveListParams } from '../api'
import { HostelTabs } from '../components/hostel-tabs'
import { LeaveDetailSheet } from '../components/leave-detail-sheet'
import { LeaveFormModal } from '../components/leave-form-modal'
import { StudentCell, ToggleFilter } from '../components/leave-form-parts'
import { LeaveGatePanel } from '../components/leave-gate'
import { timeLabel } from '../components/leave-helpers'
import { HostelSelect } from '../components/pickers'
import { LEAVE_KIND, LEAVE_SOURCE, LEAVE_STATUS, labelOptions, toneOptions } from '../labels'
import type { LeavesSearch } from '../search'

const route = getRouteApi('/_app/hostel/leaves')
const LIMIT = 20

type Tab = LeavesSearch['tab']

export function LeavesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/leaves' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canOperate = can(me, 'hostel.pass_operate')
  const canApprove = can(me, 'hostel.leave_approve')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Leave | null>(null)
  const tab: Tab = search.tab

  const params: LeaveListParams = {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    hostel_id: search.hostel_id,
    status: search.status,
    kind: search.kind,
    overdue: search.overdue,
    sort: search.sort,
    order: search.order,
  }
  const leaves = useLeaves(params, canView && tab === 'leaves')
  const countOf = (extra: Partial<LeaveListParams>) => ({
    page: 1,
    limit: 1,
    hostel_id: search.hostel_id,
    ...extra,
  })
  const toApprove = useLeaves(countOf({ status: 'pending' }), canView)
  const waiting = useLeaves(countOf({ status: 'awaiting_parent' }), canView)
  const outNow = useLeaves(countOf({ status: 'out' }), canView)
  const overdue = useLeaves(countOf({ overdue: true }), canView)

  const setSearch = (patch: Partial<LeavesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const switchTab = (next: Tab, patch: Partial<LeavesSearch> = {}) =>
    navigate({ search: { tab: next, page: 1, hostel_id: search.hostel_id, ...patch } })

  useShortcut('hostel.create', () => setCreating(true), { enabled: canOperate })
  useShortcut('app.refresh', () => {
    void leaves.refetch()
    void toApprove.refetch()
    void waiting.refetch()
    void outNow.refetch()
    void overdue.refetch()
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Leave & passes'
      description='Home leave and outings, parent consent, approvals and the hostel gate.'
      actions={
        canOperate ? (
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Record leave
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
          icon={LogOut}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const toggleStatus = (status: LeavesSearch['status']) => {
    const on = tab === 'leaves' && search.status === status && !search.overdue
    if (tab !== 'leaves') switchTab('leaves', { status })
    else setSearch({ status: on ? undefined : status, overdue: undefined })
  }

  const cards: Insight[] = [
    {
      key: 'pending',
      label: 'To approve',
      value: toApprove.data?.total ?? 0,
      hint: 'Waiting for a warden',
      icon: ClipboardCheck,
      tone: (toApprove.data?.total ?? 0) > 0 ? 'warning' : 'neutral',
      active: tab === 'leaves' && search.status === 'pending' && !search.overdue,
      onClick: () => toggleStatus('pending'),
    },
    {
      key: 'awaiting_parent',
      label: 'Waiting for parent',
      value: waiting.data?.total ?? 0,
      hint: 'Consent asked in the app',
      icon: Hourglass,
      tone: 'info',
      active: tab === 'leaves' && search.status === 'awaiting_parent' && !search.overdue,
      onClick: () => toggleStatus('awaiting_parent'),
    },
    {
      key: 'out',
      label: 'Out now',
      value: outNow.data?.total ?? 0,
      hint: 'Marked out at the gate',
      icon: DoorOpen,
      tone: 'primary',
      active: tab === 'leaves' && search.status === 'out' && !search.overdue,
      onClick: () => toggleStatus('out'),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: overdue.data?.total ?? 0,
      hint: 'Not back on time',
      icon: AlarmClock,
      tone: (overdue.data?.total ?? 0) > 0 ? 'danger' : 'neutral',
      active: tab === 'leaves' && Boolean(search.overdue),
      onClick: () => {
        if (tab !== 'leaves') switchTab('leaves', { overdue: true })
        else setSearch({ overdue: search.overdue ? undefined : true, status: undefined })
      },
    },
  ]

  const columns: Column<Leave>[] = [
    {
      key: 'leave_no',
      header: 'Leave',
      sortKey: 'created_at',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-xs font-semibold'>{row.leave_no}</span>
          <span className='text-xs text-muted-foreground'>By {LEAVE_SOURCE[row.source]}</span>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'kind',
      header: 'Kind',
      hideBelow: 'xl',
      cell: (row) => LEAVE_KIND[row.kind],
    },
    {
      key: 'dates',
      header: 'Dates',
      sortKey: 'from_date',
      cell: (row) => <LeaveDates leave={row} />,
    },
    {
      key: 'back',
      header: 'Due back',
      sortKey: 'expected_return_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>
          {formatDateTime(row.expected_return_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <LeaveStatusBadges leave={row} />,
    },
  ]

  const filtered = Boolean(
    search.search || search.hostel_id || search.status || search.kind || search.overdue
  )

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/leaves' />

      <InsightCards
        items={cards}
        loading={toApprove.isPending || waiting.isPending || outNow.isPending}
      />

      <PageTabs
        label='Leave sections'
        value={tab}
        onChange={(next) => switchTab(next)}
        tabs={[
          { value: 'leaves', label: 'Leaves', icon: LogOut },
          {
            value: 'gate',
            label: 'Gate',
            icon: ScanLine,
            count: outNow.data?.total || undefined,
          },
        ]}
      />

      {tab === 'gate' ? (
        <LeaveGatePanel
          hostelId={search.hostel_id}
          page={search.page}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
          onOpen={setSelected}
        />
      ) : (
        <Card className='overflow-hidden'>
          <ListToolbar
            summary={leaves.data ? `${leaves.data.total} leaves` : ''}
            onClear={
              filtered
                ? () => navigate({ search: { tab: 'leaves', page: 1 }, replace: true })
                : undefined
            }
          >
            <SearchBox
              value={search.search ?? ''}
              onChange={(value) => setSearch({ search: value || undefined })}
              placeholder='Search name, admission or leave number'
              label='Search leaves'
            />
            <HostelSelect
              id='leaves-hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
            />
            <FilterSelect
              id='leaves-status'
              label='Filter by status'
              allLabel='Any status'
              value={search.status}
              options={toneOptions(LEAVE_STATUS)}
              onChange={(value) => setSearch({ status: value as LeavesSearch['status'] })}
            />
            <FilterSelect
              id='leaves-kind'
              label='Filter by kind'
              allLabel='All kinds'
              value={search.kind}
              options={labelOptions(LEAVE_KIND)}
              onChange={(value) => setSearch({ kind: value as LeavesSearch['kind'] })}
            />
            <ToggleFilter
              id='leaves-overdue'
              label='Overdue only'
              checked={Boolean(search.overdue)}
              onChange={(overdue) => setSearch({ overdue })}
            />
          </ListToolbar>
          <DataTable
            rows={leaves.data?.items ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={leaves.isFetching}
            error={leaves.isError ? leaves.error.message : null}
            onRetry={() => leaves.refetch()}
            onRowClick={setSelected}
            sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
            onSortChange={(next) => setSearch(next as Partial<LeavesSearch>)}
            empty={{
              icon: filtered ? CircleOff : LogOut,
              title: filtered ? 'No leaves match these filters' : 'No leaves yet',
              description: filtered
                ? 'Try another name or clear the filters.'
                : 'Parents ask for leave in the Parent app; wardens and the office can record one here.',
              action:
                canOperate && !filtered ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus />
                    Record leave
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <StudentCell student={row.student} />
                  <LeaveStatusBadges leave={row} />
                </div>
                <span className='text-xs text-muted-foreground'>
                  <span className='font-mono'>{row.leave_no}</span> · {LEAVE_KIND[row.kind]} · by{' '}
                  {LEAVE_SOURCE[row.source].toLowerCase()}
                </span>
                <LeaveDates leave={row} />
              </div>
            )}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: leaves.data?.total ?? 0,
              label: 'leaves',
              onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            }}
          />
        </Card>
      )}

      <LeaveDetailSheet
        leave={selected}
        onClose={() => setSelected(null)}
        onChanged={setSelected}
      />
      {creating && (
        <LeaveFormModal
          canApprove={canApprove}
          onClose={() => setCreating(false)}
          onCreated={setSelected}
        />
      )}
    </Page>
  )
}

function LeaveDates({ leave }: { leave: Leave }) {
  const times = [timeLabel(leave.depart_time), timeLabel(leave.return_time)]
    .filter(Boolean)
    .join(' – ')
  return (
    <div className='grid gap-0.5 text-sm'>
      <span>
        {leave.kind === 'outing' || leave.from_date === leave.to_date
          ? formatDate(leave.from_date)
          : `${formatDate(leave.from_date)} – ${formatDate(leave.to_date)}`}
      </span>
      {times && <span className='text-xs text-muted-foreground'>{times}</span>}
    </div>
  )
}

function LeaveStatusBadges({ leave }: { leave: Leave }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      <Badge tone={LEAVE_STATUS[leave.status].tone} dot>
        {LEAVE_STATUS[leave.status].label}
      </Badge>
      {leave.overdue && <Badge tone='danger'>Overdue</Badge>}
      {leave.late_minutes ? <Badge tone='warning'>{leave.late_minutes} min late</Badge> : null}
    </div>
  )
}
