import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileQuestion,
  Plus,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { timeAgo } from '@/lib/format'
import {
  useGrievanceInsights,
  useGrievances,
  type GrievanceCategory,
  type GrievanceListItem,
  type GrievancePriority,
  type GrievanceStatus,
} from '../api'
import { CreateGrievanceModal } from '../components/create-grievance-modal'
import { GrievanceSheet } from '../components/grievance-sheet'
import {
  GrievancePriorityBadge,
  GrievanceStatusBadge,
} from '../components/grievance-status-badge'
import {
  COMPLAINANT_TYPE,
  formatSlaCountdown,
  GRIEVANCE_CATEGORY,
  GRIEVANCE_PRIORITY,
  GRIEVANCE_STATUS,
} from '../labels'
import type { GrievancesSearch } from '../search'

const route = getRouteApi('/_app/grievances')
const LIMIT = 20

export function GrievancesPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/grievances' })
  const [createOpen, setCreateOpen] = useState(false)

  const list = useGrievances({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    status: search.status,
    category: search.category,
    priority: search.priority,
    assigned_to: search.assigned_to,
    sla_breached: search.sla_breached,
    sort: search.sort,
    order: search.order,
  })

  const insights = useGrievanceInsights()

  const setSearch = (patch: Partial<GrievancesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const openTicket = (id: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, grievance: id }), replace: true })

  useShortcut('app.refresh', () => {
    void list.refetch()
    void insights.refetch()
  })

  const data = insights.data
  const cards: Insight[] = [
    {
      key: 'open',
      label: 'Open tickets',
      value: data?.total_open ?? 0,
      hint: 'Awaiting resolution',
      icon: AlertCircle,
      tone: 'info',
      active: !search.status && !search.sla_breached,
      onClick: () => setSearch({ status: undefined, sla_breached: undefined }),
    },
    {
      key: 'sla_breached',
      label: 'SLA Breached / Urgent',
      value: data?.sla_breached ?? 0,
      hint: 'Immediate action needed',
      icon: AlertTriangle,
      tone: 'danger',
      active: Boolean(search.sla_breached),
      onClick: () =>
        setSearch({
          sla_breached: search.sla_breached ? undefined : true,
          status: undefined,
        }),
    },
    {
      key: 'in_progress',
      label: 'Under investigation',
      value: data?.in_progress ?? 0,
      hint: 'Assigned to officers',
      icon: Clock,
      tone: 'warning',
      active: search.status === 'in_progress',
      onClick: () =>
        setSearch({
          status: search.status === 'in_progress' ? undefined : 'in_progress',
          sla_breached: undefined,
        }),
    },
    {
      key: 'resolved',
      label: 'Resolved this month',
      value: data?.resolved_this_month ?? 0,
      hint: data?.avg_resolution_hours ? `Avg ~${data.avg_resolution_hours}h` : 'Closed cases',
      icon: CheckCircle2,
      tone: 'success',
      active: search.status === 'resolved',
      onClick: () =>
        setSearch({
          status: search.status === 'resolved' ? undefined : 'resolved',
          sla_breached: undefined,
        }),
    },
  ]

  const columns: Column<GrievanceListItem>[] = [
    {
      key: 'ticket_no',
      header: 'Ticket No',
      cell: (item: GrievanceListItem) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-xs font-bold text-primary'>{item.ticket_no}</span>
          <span className='text-[11px] text-muted-foreground'>
            {timeAgo(item.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'complainant',
      header: 'Complainant & Student',
      cell: (item: GrievanceListItem) => (
        <div className='grid gap-0.5 max-w-[220px]'>
          {item.is_anonymous ? (
            <div className='flex items-center gap-1.5 text-xs text-warning font-semibold'>
              <ShieldAlert className='size-3.5' />
              <span>Anonymous</span>
            </div>
          ) : (
            <div className='flex items-center gap-1.5 truncate'>
              <span className='truncate text-xs font-bold text-foreground'>
                {item.complainant_name ?? 'Guardian'}
              </span>
              <Badge tone={COMPLAINANT_TYPE[item.complainant_type]?.tone ?? 'neutral'}>
                {COMPLAINANT_TYPE[item.complainant_type]?.label ?? item.complainant_type}
              </Badge>
            </div>
          )}
          {item.student_name && (
            <span className='truncate text-[11px] text-muted-foreground'>
              Child: {item.student_name}
              {item.class_section ? ` (${item.class_section})` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Subject',
      cell: (item: GrievanceListItem) => {
        const cat = GRIEVANCE_CATEGORY[item.category]
        return (
          <div className='grid gap-0.5 max-w-[240px]'>
            <span className='text-xs font-bold text-foreground truncate'>{item.subject}</span>
            <span className='text-[11px] text-muted-foreground truncate'>
              {cat?.label ?? item.category}
              {item.subcategory ? ` • ${item.subcategory}` : ''}
            </span>
          </div>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (item: GrievanceListItem) => <GrievancePriorityBadge priority={item.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: GrievanceListItem) => (
        <GrievanceStatusBadge
          status={item.status}
          priority={item.priority}
          isSlaBreached={item.is_sla_breached}
        />
      ),
    },
    {
      key: 'assigned_to',
      header: 'Assigned Officer',
      cell: (item: GrievanceListItem) => (
        <div className='flex items-center gap-1.5 text-xs'>
          <UserCheck className='size-3.5 text-muted-foreground' />
          <span>{item.assigned_to?.name ?? 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'sla_due_at',
      header: 'Target SLA',
      cell: (item: GrievanceListItem) => {
        const sla = formatSlaCountdown(item.sla_due_at, item.status)
        return (
          <Badge tone={sla.tone} dot={sla.breached}>
            <Clock className='mr-1 size-3' />
            {sla.text}
          </Badge>
        )
      },
    },
  ]

  const statusOptions = Object.entries(GRIEVANCE_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }))

  const categoryOptions = Object.entries(GRIEVANCE_CATEGORY).map(([key, val]) => ({
    value: key,
    label: val.label,
  }))

  const priorityOptions = Object.entries(GRIEVANCE_PRIORITY).map(([key, val]) => ({
    value: key,
    label: val.label,
  }))

  const hasActiveFilters = Boolean(
    search.search ||
      search.status ||
      search.category ||
      search.priority ||
      search.sla_breached ||
      search.assigned_to
  )

  return (
    <Page>
      <PageHeader
        title='Grievances & Complaints'
        description='Formal tracking, assignment, and SLA resolution for parent and staff concerns.'
        actions={
          <Button onClick={() => setCreateOpen(true)} className='gap-2'>
            <Plus className='size-4' />
            Log grievance
          </Button>
        }
      />

      <InsightCards items={cards} />

      <Card className='p-4'>
        <ListToolbar
          onClear={
            hasActiveFilters
              ? () =>
                  setSearch({
                    search: undefined,
                    status: undefined,
                    category: undefined,
                    priority: undefined,
                    sla_breached: undefined,
                    assigned_to: undefined,
                  })
              : undefined
          }
          summary={`${list.data?.total ?? 0} total tickets`}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search by ticket, name, subject...'
            label='Search grievances'
          />
          <FilterSelect
            id='grievance-filter-status'
            label='Status'
            value={search.status ?? ''}
            options={statusOptions}
            onChange={(value) => setSearch({ status: (value as GrievanceStatus) || undefined })}
            allLabel='All statuses'
          />
          <FilterSelect
            id='grievance-filter-category'
            label='Category'
            value={search.category ?? ''}
            options={categoryOptions}
            onChange={(value) =>
              setSearch({ category: (value as GrievanceCategory) || undefined })
            }
            allLabel='All categories'
          />
          <FilterSelect
            id='grievance-filter-priority'
            label='Priority'
            value={search.priority ?? ''}
            options={priorityOptions}
            onChange={(value) =>
              setSearch({ priority: (value as GrievancePriority) || undefined })
            }
            allLabel='All priorities'
          />
        </ListToolbar>

        <div className='mt-4'>
          <DataTable<GrievanceListItem>
            rows={list.data?.items ?? []}
            columns={columns}
            rowKey={(item) => item.id}
            loading={list.isLoading}
            empty={{
              icon: FileQuestion,
              title: 'No grievances found',
              description: 'No complaints or grievances match your search or filter settings.',
              action: (
                <Button onClick={() => setCreateOpen(true)}>
                  Log new grievance
                </Button>
              ),
            }}
            onRowClick={(item) => openTicket(item.id)}
            pagination={{
              page: search.page,
              limit: LIMIT,
              total: list.data?.total ?? 0,
              label: 'grievances',
              onPageChange: (page) => setSearch({ page }),
            }}
            card={(item) => {
              const cat = GRIEVANCE_CATEGORY[item.category]
              const sla = formatSlaCountdown(item.sla_due_at, item.status)
              return (
                <div
                  onClick={() => openTicket(item.id)}
                  className='grid gap-2 p-3 border rounded-lg bg-card hover:bg-muted/30 transition cursor-pointer'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-mono text-xs font-bold text-primary'>
                      {item.ticket_no}
                    </span>
                    <div className='flex items-center gap-1.5'>
                      <GrievancePriorityBadge priority={item.priority} />
                      <GrievanceStatusBadge
                        status={item.status}
                        priority={item.priority}
                        isSlaBreached={item.is_sla_breached}
                      />
                    </div>
                  </div>

                  <div className='grid gap-0.5'>
                    <span className='font-bold text-sm text-foreground'>{item.subject}</span>
                    <span className='text-xs text-muted-foreground'>
                      {cat?.label ?? item.category}
                      {item.student_name ? ` • Child: ${item.student_name}` : ''}
                    </span>
                  </div>

                  <div className='flex items-center justify-between border-t pt-2 text-xs text-muted-foreground'>
                    <span>{item.is_anonymous ? 'Anonymous' : item.complainant_name}</span>
                    <Badge tone={sla.tone} dot={sla.breached}>
                      <Clock className='mr-1 size-3' />
                      {sla.text}
                    </Badge>
                  </div>
                </div>
              )
            }}
          />
        </div>
      </Card>

      <GrievanceSheet
        id={search.grievance ?? null}
        open={Boolean(search.grievance)}
        onOpenChange={(open) => {
          if (!open) openTicket(undefined)
        }}
        onUpdated={() => {
          void list.refetch()
          void insights.refetch()
        }}
      />

      <CreateGrievanceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          void list.refetch()
          void insights.refetch()
        }}
      />
    </Page>
  )
}
