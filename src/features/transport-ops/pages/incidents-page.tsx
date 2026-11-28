import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  CalendarRange,
  CircleOff,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import {
  useIncidentInsights,
  useIncidents,
  type Incident,
  type IncidentStatus,
  type IncidentType,
} from '../api'
import { IncidentSheet } from '../components/incident-sheet'
import {
  INCIDENT_STATUS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_TYPE,
  INCIDENT_TYPE_OPTIONS,
} from '../labels'
import type { IncidentsSearch } from '../search'

const route = getRouteApi('/_app/transport/incidents')
const LIMIT = 20

function TypeCell({ incident }: { incident: Incident }) {
  const type = INCIDENT_TYPE[incident.type]
  return (
    <div className='flex min-w-0 items-start gap-2.5'>
      <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning'>
        <type.icon className='size-4' />
      </span>
      <div className='grid max-w-md min-w-0 gap-0.5'>
        <span className='text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
          {type.label}
        </span>
        <span className='line-clamp-2 text-[12px] leading-[16px] break-words text-slate-500 dark:text-slate-400'>
          {incident.description}
        </span>
      </div>
    </div>
  )
}

function StatusCell({ incident }: { incident: Incident }) {
  const status = INCIDENT_STATUS[incident.status]
  return (
    <div className='grid max-w-64 justify-items-start gap-1'>
      <Badge tone={status.tone} dot pulse={incident.status === 'open'} className='font-medium'>
        {status.label}
      </Badge>
      {incident.status === 'resolved' && incident.resolved_by && (
        <span className='line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400'>
          by {incident.resolved_by.name}
          {incident.resolution_note ? `: ${incident.resolution_note}` : ''}
        </span>
      )}
    </div>
  )
}

const studentsText = (incident: Incident) =>
  incident.students.length ? incident.students.map((student) => student.name).join(', ') : '—'

export function IncidentsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/transport/incidents' })
  const { id, limit: searchLimit, ...filters } = search
  const limit = searchLimit ?? LIMIT
  const list = useIncidents({ ...filters, limit })
  const insights = useIncidentInsights()
  const rows = list.data?.items ?? []
  const data = insights.data

  const setSearch = (patch: Partial<IncidentsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  const view = (next: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, id: next }), replace: true })

  useShortcut('app.refresh', () => {
    void list.refetch()
    void insights.refetch()
  })

  const isOpen = search.status === 'open' && !search.type
  const isBreakdown = search.type === 'breakdown' && !search.status

  const cards: Insight[] = [
    {
      key: 'open',
      label: 'Open',
      value: data?.open ?? 0,
      hint: 'Waiting for the office',
      icon: ShieldAlert,
      tone: 'danger',
      active: isOpen,
      onClick: () => setSearch({ status: isOpen ? undefined : 'open', type: undefined }),
    },
    {
      key: 'today',
      label: 'Today',
      value: data?.today ?? 0,
      hint: 'Reported today',
      icon: CalendarDays,
      tone: 'warning',
    },
    {
      key: 'month',
      label: 'This month',
      value: data?.this_month ?? 0,
      hint: 'All types',
      icon: CalendarRange,
      tone: 'info',
    },
    {
      key: 'breakdowns',
      label: 'Breakdowns',
      value: data?.breakdowns ?? 0,
      hint: 'This month',
      icon: Wrench,
      tone: 'neutral',
      active: isBreakdown,
      onClick: () => setSearch({ type: isBreakdown ? undefined : 'breakdown', status: undefined }),
    },
  ]

  const columns: Column<Incident>[] = [
    { key: 'type', header: 'INCIDENT', cell: (incident) => <TypeCell incident={incident} /> },
    {
      key: 'bus',
      header: 'BUS',
      cell: (incident) => (
        <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          {incident.vehicle?.name ?? 'No bus'}
        </span>
      ),
    },
    {
      key: 'reported_by',
      header: 'REPORTED BY',
      cell: (incident) => (
        <span className='text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
          {incident.reported_by.name}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'STUDENTS',
      hideBelow: 'lg',
      cell: (incident) => (
        <span className='line-clamp-2 max-w-56 text-[13px] leading-[18px] text-slate-700 dark:text-slate-300'>
          {studentsText(incident)}
        </span>
      ),
    },
    {
      key: 'occurred_at',
      header: 'OCCURRED',
      sortKey: 'occurred_at',
      cell: (incident) => (
        <span className='text-[13px] leading-[18px] text-slate-700 tabular-nums dark:text-slate-300'>
          {formatDateTime(incident.occurred_at)}
        </span>
      ),
    },
    { key: 'status', header: 'STATUS', cell: (incident) => <StatusCell incident={incident} /> },
  ]

  const filtered = Boolean(search.search || search.status || search.type)

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Incidents'
        description='Breakdowns, accidents, injuries and other incidents drivers report from the bus, with photos and the students involved. Resolve each one with what was done; the driver is told.'
      />

      <InsightCards items={cards} loading={insights.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} incidents` : ''}
          onClear={
            filtered ? () => navigate({ search: { page: 1, id }, replace: true }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search the description'
            label='Search incidents'
            compact
            showShortcut={false}
          />
          <FilterSelect
            id='incident-type'
            label='Filter by type'
            allLabel='All types'
            value={search.type}
            options={INCIDENT_TYPE_OPTIONS}
            onChange={(type) => setSearch({ type: type as IncidentType | undefined })}
          />
          <FilterSelect
            id='incident-status'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={INCIDENT_STATUS_OPTIONS}
            onChange={(status) => setSearch({ status: status as IncidentStatus | undefined })}
          />
        </ListToolbar>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(incident) => incident.id}
          loading={list.isFetching && !list.data}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          onRowClick={(incident) => void view(incident.id)}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<IncidentsSearch>)}
          empty={{
            icon: filtered ? CircleOff : ShieldCheck,
            title: filtered ? 'No incidents match these filters' : 'No incidents yet',
            description: filtered
              ? 'Try another search or clear the filters.'
              : 'Incidents and breakdowns reported from the Driver app appear here.',
          }}
          card={(incident) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-3'>
                <TypeCell incident={incident} />
                <StatusCell incident={incident} />
              </div>
              <span className='text-xs text-muted-foreground'>
                {incident.vehicle?.name ?? 'No bus'} · {incident.reported_by.name} ·{' '}
                {formatDateTime(incident.occurred_at)}
              </span>
              {incident.students.length > 0 && (
                <span className='text-xs text-muted-foreground'>{studentsText(incident)}</span>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit,
            total: list.data?.total ?? 0,
            label: 'incidents',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
            onLimitChange: (next) =>
              navigate({ search: (prev) => ({ ...prev, limit: next, page: 1 }), replace: true }),
          }}
        />
      </Card>

      <IncidentSheet
        incidentId={id ?? null}
        onOpenChange={(open) => !open && void view(undefined)}
      />
    </Page>
  )
}
