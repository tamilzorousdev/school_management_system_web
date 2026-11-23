import { ClipboardCheck, Send } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { appraisalsApi, useAppraisalMutation, useAppraisals, useCycles, type AppraisalItem, type Stage } from '../api'
import { pct, RATING, STAGE, STAGE_OPTIONS } from '../labels'
import type { AppraisalsSearch } from '../search'

const LIMIT = 20

export function ReviewsTab({
  search,
  setSearch,
  canFinalize,
  onOpen,
}: {
  search: AppraisalsSearch
  setSearch: (patch: Partial<AppraisalsSearch>) => void
  canFinalize: boolean
  onOpen: (id: number) => void
}) {
  const cycles = useCycles()
  const list = useAppraisals({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    cycle_id: search.cycle_id,
    stage: search.stage,
    sort: 'name',
    order: 'asc',
  })
  const publishMany = useAppraisalMutation(appraisalsApi.publishMany)
  const ready = (list.data?.items ?? []).filter((row) => row.stage === 'principal_pending').map((row) => row.id)

  const columns: Column<AppraisalItem>[] = [
    {
      key: 'name',
      header: 'Staff',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.staff.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.staff.designation}
            {row.staff.department ? ` · ${row.staff.department}` : ''} · {row.group.name}
          </span>
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'Step',
      cell: (row) => (
        <span className='flex flex-wrap items-center gap-1'>
          <Badge tone={STAGE[row.stage].tone} dot>
            {STAGE[row.stage].label}
          </Badge>
          {row.self_missed && <Badge tone='danger'>Self missed</Badge>}
        </span>
      ),
    },
    {
      key: 'scores',
      header: 'Self · HOD · Final',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular text-sm'>
          {pct(row.self_percent)} · {row.hod ? pct(row.hod_percent) : '—'} · <b>{pct(row.final_percent)}</b>
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (row) =>
        row.rating ? <Badge tone={RATING[row.rating].tone}>{RATING[row.rating].label}</Badge> : <span className='text-muted-foreground'>—</span>,
    },
    {
      key: 'due',
      header: 'Due',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.due_at ? formatDateTime(row.due_at) : '—'}</span>,
    },
  ]

  return (
    <>
      <ListToolbar
        summary={list.data ? `${list.data.total} appraisals` : ''}
        onClear={
          search.search || search.cycle_id || search.stage
            ? () => setSearch({ search: undefined, cycle_id: undefined, stage: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => setSearch({ search: value || undefined })}
          placeholder='Name, employee no, department'
          label='Search appraisals'
        />
        <FilterSelect
          id='appraisal-cycle'
          label='Cycle'
          allLabel='All cycles'
          value={search.cycle_id ? String(search.cycle_id) : undefined}
          options={(cycles.data?.items ?? []).map((cycle) => ({ value: String(cycle.id), label: cycle.title }))}
          onChange={(value) => setSearch({ cycle_id: value ? Number(value) : undefined })}
        />
        <FilterSelect
          id='appraisal-stage'
          label='Step'
          allLabel='Every step'
          value={search.stage}
          options={STAGE_OPTIONS}
          onChange={(value) => setSearch({ stage: (value as Stage | undefined) ?? undefined })}
        />
        {canFinalize && ready.length > 0 && (
          <Button
            size='sm'
            disabled={publishMany.isPending}
            onClick={async () => {
              try {
                const done = await publishMany.mutateAsync(ready)
                alerts.success(
                  `${done.data.published} published${done.data.skipped.length ? `, ${done.data.skipped.length} not ready` : ''}`,
                )
              } catch (error) {
                alerts.error(toApiError(error).message)
              }
            }}
          >
            <Send />
            Publish {ready.length} ready
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={list.isPending}
        error={list.error?.message}
        onRetry={() => void list.refetch()}
        onRowClick={(row) => onOpen(row.id)}
        empty={{
          icon: ClipboardCheck,
          title: 'No appraisals here',
          description: 'Open a cycle to create appraisals for its groups.',
        }}
        card={(row) => (
          <div className='grid gap-1'>
            <div className='flex items-center justify-between gap-2'>
              <span className='min-w-0 truncate font-semibold'>{row.staff.name}</span>
              <Badge tone={STAGE[row.stage].tone} dot>
                {STAGE[row.stage].label}
              </Badge>
            </div>
            <span className='text-xs text-muted-foreground'>
              {row.group.name} · final {pct(row.final_percent)}
            </span>
          </div>
        )}
        pagination={
          list.data
            ? {
                page: search.page,
                limit: list.data.limit,
                total: list.data.total,
                label: 'appraisals',
                onPageChange: (page) => setSearch({ page }),
              }
            : undefined
        }
      />
    </>
  )
}
