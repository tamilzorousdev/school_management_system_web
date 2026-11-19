import { useState } from 'react'
import { CircleOff, Download, Plus, UsersRound } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DateRangeInputs } from '@/features/maintenance/components/shared'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { gateApi, useGateStaff, useGateVisits, type Visit, type VisitListParams } from '../api'
import { useDetail } from '../helpers'
import {
  CHECK_METHOD,
  VISIT_PURPOSE,
  VISIT_PURPOSE_OPTIONS,
  VISIT_STATUS_OPTIONS,
  clock,
  photoSrc,
  timeWindow,
} from '../labels'
import type { GateSearch, GateTabProps } from '../search'
import { GateDetail } from './gate-detail'
import { InviteModal } from './invite-modal'
import { VisitBadges, VisitStatusBadge } from './shared'

const LIMIT = 20
const SORTS = ['created_at', 'visit_date', 'checked_in_at'] as const

function VisitorCell({ visit }: { visit: Visit }) {
  return (
    <span className='flex min-w-0 items-center gap-2.5'>
      <Avatar name={visit.name} src={photoSrc(visit.photo)} previewable />
      <span className='grid min-w-0'>
        <span className='truncate font-semibold'>{visit.name}</span>
        <span className='truncate text-xs text-muted-foreground'>
          {[visit.mobile, visit.company].filter(Boolean).join(' · ')}
        </span>
      </span>
    </span>
  )
}

const inOut = (visit: Visit) => {
  if (!visit.checked_in_at) return timeWindow(visit.expected_from, visit.expected_until)
  const came = `${clock(visit.checked_in_at)}${visit.check_in_method ? ` ${CHECK_METHOD[visit.check_in_method].label}` : ''}`
  return visit.checked_out_at ? `${came} → ${clock(visit.checked_out_at)}` : `${came} → inside`
}

export function VisitorsTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  canApprove,
  adding,
  onAddingChange,
}: GateTabProps) {
  const detail = useDetail()
  const [hostQuery, setHostQuery] = useState('')
  const staff = useGateStaff(useDebouncedValue(hostQuery))
  const [downloading, setDownloading] = useState(false)
  const sort = SORTS.find((item) => item === search.sort)
  const filters: Omit<VisitListParams, 'page' | 'limit'> = {
    search: search.search,
    sort,
    order: sort ? search.order : undefined,
    from: search.from,
    to: search.to,
    status: search.visit_status,
    purpose: search.purpose,
    host_user_id: search.host_user_id,
  }
  const visits = useGateVisits({ page: search.page, limit: LIMIT, ...filters })
  const rows = visits.data?.items ?? []
  const [host, setHost] = useState<ComboboxOption | null>(null)
  const loaded: ComboboxOption[] = (staff.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    hint: item.role ?? undefined,
  }))
  const hostOptions =
    host && !loaded.some((option) => option.value === host.value) ? [host, ...loaded] : loaded

  const download = async () => {
    setDownloading(true)
    try {
      await gateApi.downloadVisits(filters)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const columns: Column<Visit>[] = [
    { key: 'name', header: 'Visitor', cell: (visit) => <VisitorCell visit={visit} /> },
    {
      key: 'purpose',
      header: 'Purpose',
      cell: (visit) => (
        <div className='grid min-w-0'>
          <span className='text-sm font-semibold'>{VISIT_PURPOSE[visit.purpose]}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {visit.host ? `To meet ${visit.host.name}` : 'Office decides'}
            {visit.student ? ` · ${visit.student.name}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'visit_date',
      header: 'Date',
      sortKey: 'visit_date',
      cell: (visit) => (
        <div className='grid'>
          <span className='tabular text-sm whitespace-nowrap'>{formatDate(visit.visit_date)}</span>
          <span className='font-mono text-xs text-muted-foreground'>{visit.visit_no}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (visit) => (
        <div className='grid justify-items-start gap-1'>
          <VisitStatusBadge visit={visit} />
          <VisitBadges visit={visit} />
        </div>
      ),
    },
    {
      key: 'checked_in_at',
      header: 'In and out',
      sortKey: 'checked_in_at',
      hideBelow: 'lg',
      cell: (visit) => <span className='tabular text-sm'>{inOut(visit)}</span>,
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.from ||
    search.to ||
    search.visit_status ||
    search.purpose ||
    search.host_user_id
  )

  return (
    <>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            visits.data
              ? `${visits.data.total} ${visits.data.total === 1 ? 'visit' : 'visits'}`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search name, mobile, slip or company'
            label='Search visitors'
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
          <FilterSelect
            id='visit-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.visit_status}
            options={VISIT_STATUS_OPTIONS}
            onChange={(value) => setSearch({ visit_status: value as GateSearch['visit_status'] })}
          />
          <FilterSelect
            id='visit-purpose-filter'
            label='Filter by purpose'
            allLabel='All purposes'
            value={search.purpose}
            options={VISIT_PURPOSE_OPTIONS}
            onChange={(value) => setSearch({ purpose: value as GateSearch['purpose'] })}
          />
          <Combobox
            id='visit-host-filter'
            label='Filter by host'
            allLabel='Anyone to meet'
            placeholder='Anyone to meet'
            searchPlaceholder='Search staff'
            value={search.host_user_id ? String(search.host_user_id) : undefined}
            options={hostOptions}
            onSearch={setHostQuery}
            emptyText={staff.isFetching ? 'Searching…' : 'No staff found'}
            onChange={(value) => {
              setHost(hostOptions.find((option) => option.value === value) ?? null)
              setSearch({ host_user_id: value ? Number(value) : undefined })
            }}
          />
          <Button variant='outline' onClick={download} loading={downloading}>
            <Download />
            Excel
          </Button>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(visit) => visit.id}
          loading={visits.isFetching}
          error={visits.isError ? visits.error.message : null}
          onRetry={() => visits.refetch()}
          onRowClick={(visit) => detail.show({ kind: 'visit', id: visit.id })}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<GateSearch>)}
          empty={{
            icon: filtered ? CircleOff : UsersRound,
            title: filtered ? 'No visitors match these filters' : 'No visitors yet',
            description: filtered
              ? 'Try another date, status or purpose, or clear the filters.'
              : 'The gate registers walk-in visitors. You can invite one ahead so they get a slip by SMS.',
            action: !filtered && canManage && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Invite visitor
              </Button>
            ),
          }}
          card={(visit) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <VisitorCell visit={visit} />
                <VisitStatusBadge visit={visit} />
              </div>
              <span className='text-xs text-muted-foreground'>
                {VISIT_PURPOSE[visit.purpose]}
                {visit.host ? ` · to meet ${visit.host.name}` : ''}
              </span>
              <span className='tabular text-xs text-muted-foreground'>
                <span className='font-mono font-semibold text-foreground'>{visit.visit_no}</span> ·{' '}
                {formatDate(visit.visit_date)} · {inOut(visit)}
              </span>
              <VisitBadges visit={visit} />
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: visits.data?.total ?? 0,
            label: 'visits',
            onPageChange,
          }}
        />
      </Card>
      <InviteModal open={adding} onOpenChange={onAddingChange} />
      <GateDetail
        target={detail.target}
        open={detail.open}
        onOpenChange={detail.setOpen}
        canManage={canManage}
        canApprove={canApprove}
      />
    </>
  )
}
