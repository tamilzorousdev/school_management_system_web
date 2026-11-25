import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, Gavel, Plus, ShieldAlert, Siren, UserRoundCheck } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDateTime } from '@/lib/format'
import { useCases, type CaseListParams, type DisciplineCase } from '../api'
import { CaseDetailSheet } from '../components/case-detail-sheet'
import { CaseFormModal } from '../components/case-form-modal'
import { HostelTabs } from '../components/hostel-tabs'
import { StudentCell } from '../components/leave-form-parts'
import { HostelSelect } from '../components/pickers'
import {
  CASE_STATUS,
  DISCIPLINE_ACTION,
  DISCIPLINE_CATEGORY,
  labelOptions,
  SEVERITY,
  toneOptions,
} from '../labels'
import type { DisciplineSearch } from '../search'

const route = getRouteApi('/_app/hostel/discipline')
const LIMIT = 20

export function DisciplinePage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/discipline' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canRecord = can(me, 'hostel.discipline')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<DisciplineCase | null>(null)

  const cases = useCases(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      status: search.status,
      category: search.category,
      severity: search.severity,
      sort: search.sort,
      order: search.order,
    },
    canView
  )
  const countOf = (extra: Partial<CaseListParams>) => ({
    page: 1,
    limit: 1,
    hostel_id: search.hostel_id,
    ...extra,
  })
  const open = useCases(countOf({ status: 'open' }), canView)
  const actionTaken = useCases(countOf({ status: 'action_taken' }), canView)
  const critical = useCases(countOf({ severity: 'critical' }), canView)

  const setSearch = (patch: Partial<DisciplineSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('hostel.create', () => setCreating(true), { enabled: canRecord })
  useShortcut('app.refresh', () => {
    void cases.refetch()
    void open.refetch()
    void actionTaken.refetch()
    void critical.refetch()
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Discipline'
      description='Record incidents, decide the action and keep parents informed. Fines go to fee approval.'
      actions={
        canRecord ? (
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Record case
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
          icon={Gavel}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const cards: Insight[] = [
    {
      key: 'open',
      label: 'Open cases',
      value: open.data?.total ?? 0,
      hint: 'Waiting for a decision',
      icon: ShieldAlert,
      tone: (open.data?.total ?? 0) > 0 ? 'warning' : 'neutral',
      active: search.status === 'open' && !search.severity,
      onClick: () =>
        setSearch({
          status: search.status === 'open' && !search.severity ? undefined : 'open',
          severity: undefined,
        }),
    },
    {
      key: 'action_taken',
      label: 'Action taken',
      value: actionTaken.data?.total ?? 0,
      hint: 'Decided, not closed',
      icon: UserRoundCheck,
      tone: 'info',
      active: search.status === 'action_taken' && !search.severity,
      onClick: () =>
        setSearch({
          status: search.status === 'action_taken' && !search.severity ? undefined : 'action_taken',
          severity: undefined,
        }),
    },
    {
      key: 'critical',
      label: 'Critical',
      value: critical.data?.total ?? 0,
      hint: 'Ragging, fights and the like',
      icon: Siren,
      tone: (critical.data?.total ?? 0) > 0 ? 'danger' : 'neutral',
      active: search.severity === 'critical' && !search.status,
      onClick: () =>
        setSearch({
          severity: search.severity === 'critical' && !search.status ? undefined : 'critical',
          status: undefined,
        }),
    },
  ]

  const columns: Column<DisciplineCase>[] = [
    {
      key: 'case_no',
      header: 'Case',
      sortKey: 'created_at',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-xs font-semibold'>{row.case_no}</span>
          <span className='text-xs text-muted-foreground'>{DISCIPLINE_CATEGORY[row.category]}</span>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortKey: 'severity',
      cell: (row) => (
        <Badge tone={SEVERITY[row.severity].tone}>{SEVERITY[row.severity].label}</Badge>
      ),
    },
    {
      key: 'incident_at',
      header: 'When',
      sortKey: 'incident_at',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.incident_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='grid gap-1'>
          <Badge tone={CASE_STATUS[row.status].tone} dot className='justify-self-start'>
            {CASE_STATUS[row.status].label}
          </Badge>
          {row.action && (
            <span className='text-xs text-muted-foreground'>{DISCIPLINE_ACTION[row.action]}</span>
          )}
        </div>
      ),
    },
    {
      key: 'strikes',
      header: 'Cases this year',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <Strikes count={row.strikes} />,
    },
  ]

  const filtered = Boolean(
    search.search || search.hostel_id || search.status || search.category || search.severity
  )

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/discipline' />

      <InsightCards items={cards} loading={open.isPending || actionTaken.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={cases.data ? `${cases.data.total} cases` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search name, admission or case number'
            label='Search cases'
          />
          <HostelSelect
            id='cases-hostel'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='cases-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toneOptions(CASE_STATUS)}
            onChange={(value) => setSearch({ status: value as DisciplineSearch['status'] })}
          />
          <FilterSelect
            id='cases-category'
            label='Filter by category'
            allLabel='All categories'
            value={search.category}
            options={labelOptions(DISCIPLINE_CATEGORY)}
            onChange={(value) => setSearch({ category: value as DisciplineSearch['category'] })}
          />
          <FilterSelect
            id='cases-severity'
            label='Filter by severity'
            allLabel='Any severity'
            value={search.severity}
            options={toneOptions(SEVERITY)}
            onChange={(value) => setSearch({ severity: value as DisciplineSearch['severity'] })}
          />
        </ListToolbar>
        <DataTable
          rows={cases.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={cases.isFetching}
          error={cases.isError ? cases.error.message : null}
          onRetry={() => cases.refetch()}
          onRowClick={setSelected}
          sort={{ sort: search.sort ?? 'created_at', order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<DisciplineSearch>)}
          empty={{
            icon: filtered ? CircleOff : Gavel,
            title: filtered ? 'No cases match these filters' : 'No discipline cases',
            description: filtered
              ? 'Try another name or clear the filters.'
              : 'Record a case when a resident breaks a hostel rule.',
            action:
              canRecord && !filtered ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  Record case
                </Button>
              ) : undefined,
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                <Badge tone={CASE_STATUS[row.status].tone} dot className='shrink-0'>
                  {CASE_STATUS[row.status].label}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-1'>
                <Badge tone={SEVERITY[row.severity].tone}>{SEVERITY[row.severity].label}</Badge>
                <Strikes count={row.strikes} />
              </div>
              <span className='text-xs text-muted-foreground'>
                <span className='font-mono'>{row.case_no}</span> ·{' '}
                {DISCIPLINE_CATEGORY[row.category]} · {formatDateTime(row.incident_at)}
                {row.action ? ` · ${DISCIPLINE_ACTION[row.action]}` : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: cases.data?.total ?? 0,
            label: 'cases',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <CaseDetailSheet
        caseItem={selected}
        onClose={() => setSelected(null)}
        onChanged={setSelected}
      />
      {creating && <CaseFormModal onClose={() => setCreating(false)} onCreated={setSelected} />}
    </Page>
  )
}

function Strikes({ count }: { count: number }) {
  return count >= 3 ? (
    <Badge tone='warning'>{count} cases</Badge>
  ) : (
    <span className='tabular text-xs text-muted-foreground'>
      {count} {count === 1 ? 'case' : 'cases'}
    </span>
  )
}
