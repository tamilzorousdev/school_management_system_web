import { CircleOff, ScrollText } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DateRangeInputs } from '@/features/maintenance/components/shared'
import { formatDateTime } from '@/lib/format'
import { useGateEvents, type GateEvent } from '../api'
import { useDetail } from '../helpers'
import { EVENT_KIND_OPTIONS, eventTone } from '../labels'
import type { GateSearch, GateTabProps } from '../search'
import { GateDetail } from './gate-detail'
import { MethodBadge } from './shared'

const LIMIT = 30

export function LogTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  canApprove,
}: GateTabProps) {
  const detail = useDetail()
  const events = useGateEvents({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    kind: search.kind,
    from: search.from,
    to: search.to,
  })
  const rows = events.data?.items ?? []

  const open = (event: GateEvent) => {
    if (event.pass_id) detail.show({ kind: 'pass', id: event.pass_id })
    else if (event.visit_id) detail.show({ kind: 'visit', id: event.visit_id })
  }

  const columns: Column<GateEvent>[] = [
    {
      key: 'at',
      header: 'Time',
      className: 'w-44',
      cell: (event) => (
        <span className='tabular text-sm whitespace-nowrap'>{formatDateTime(event.at)}</span>
      ),
    },
    {
      key: 'label',
      header: 'What happened',
      cell: (event) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='flex flex-wrap items-center gap-1.5'>
            <Badge tone={eventTone(event.kind)} dot>
              {event.label}
            </Badge>
            <MethodBadge method={event.method} />
          </span>
          {event.note && (
            <span className='text-xs break-words text-muted-foreground'>{event.note}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'By',
      hideBelow: 'lg',
      cell: (event) => <span className='text-sm'>{event.actor?.name ?? 'The system'}</span>,
    },
  ]

  const filtered = Boolean(search.search || search.kind || search.from || search.to)

  return (
    <>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            events.data
              ? `${events.data.total} ${events.data.total === 1 ? 'entry' : 'entries'}`
              : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search pass, slip, name or note'
            label='Search the gate log'
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
          <FilterSelect
            id='log-kind-filter'
            label='Filter by what happened'
            allLabel='Everything'
            value={search.kind}
            options={EVENT_KIND_OPTIONS}
            onChange={(value) => setSearch({ kind: value as GateSearch['kind'] })}
          />
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(event) => event.id}
          loading={events.isFetching}
          error={events.isError ? events.error.message : null}
          onRetry={() => events.refetch()}
          onRowClick={open}
          empty={{
            icon: filtered ? CircleOff : ScrollText,
            title: filtered ? 'Nothing matches these filters' : 'The gate log is empty',
            description: filtered
              ? 'Try another date or kind, or clear the filters.'
              : 'Every request, approval, check and release at the gate is logged here.',
          }}
          card={(event) => (
            <div className='grid gap-1.5'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Badge tone={eventTone(event.kind)} dot>
                  {event.label}
                </Badge>
                <MethodBadge method={event.method} />
              </div>
              {event.note && <span className='text-sm break-words'>{event.note}</span>}
              <span className='tabular text-xs text-muted-foreground'>
                {formatDateTime(event.at)} · {event.actor?.name ?? 'The system'}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: events.data?.total ?? 0,
            label: 'entries',
            onPageChange,
          }}
        />
      </Card>
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
