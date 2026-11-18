import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bus,
  ChevronDown,
  ChevronRight,
  CircleOff,
  IndianRupee,
  ListOrdered,
  Wallet,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRANSPORT_FEE_STATUS, rupees, wholeRupees } from '../labels'
import type { FeesSearch } from '../search'
import {
  useTransportFeeSummary,
  useTransportFees,
  type TransportFeeFigures,
  type TransportFeeRow,
  type TransportFeeStatus,
} from '../transport-api'

const LIMIT = 20

const STATUS_OPTIONS = (Object.keys(TRANSPORT_FEE_STATUS) as TransportFeeStatus[]).map((value) => ({
  value,
  label: TRANSPORT_FEE_STATUS[value].label,
}))

export function TransportFeesTab({
  search,
  onChange,
}: {
  search: FeesSearch
  onChange: (patch: Partial<FeesSearch>) => void
}) {
  const summary = useTransportFeeSummary()
  const list = useTransportFees({
    page: search.page ?? 1,
    limit: LIMIT,
    search: search.search,
    route_id: search.route_id,
    stop_id: search.stop_id,
    status: search.bus_status,
    sort: search.sort === 'pending' || search.sort === 'billed' ? search.sort : undefined,
    order: search.order,
  })
  const [open, setOpen] = useState<number[]>([])

  useShortcut('app.refresh', () => {
    void summary.refetch()
    void list.refetch()
  })

  const totals = summary.data?.totals
  const routes = summary.data?.routes ?? []
  const toggleStatus = (status: TransportFeeStatus) =>
    onChange({ bus_status: search.bus_status === status ? undefined : status })
  const cards: Insight[] = [
    {
      key: 'billed',
      label: 'Bus fee billed',
      value: wholeRupees(totals?.billed ?? 0),
      hint: `${totals?.students ?? 0} students this year`,
      icon: IndianRupee,
      tone: 'primary',
    },
    {
      key: 'collected',
      label: 'Collected',
      value: wholeRupees(totals?.collected ?? 0),
      hint: 'Bus share of payments received',
      icon: Wallet,
      tone: 'success',
      active: search.bus_status === 'paid',
      onClick: () => toggleStatus('paid'),
    },
    {
      key: 'pending',
      label: 'Pending',
      value: wholeRupees(totals?.pending ?? 0),
      hint: 'Billed but not paid yet',
      icon: Bus,
      tone: totals?.pending ? 'warning' : 'success',
      active: search.bus_status === 'pending',
      onClick: () => toggleStatus('pending'),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: wholeRupees(totals?.overdue ?? 0),
      hint: 'Past the due date',
      icon: AlertTriangle,
      tone: totals?.overdue ? 'danger' : 'success',
      active: search.bus_status === 'overdue',
      onClick: () => toggleStatus('overdue'),
    },
  ]

  const selectedRoute = routes.find((route) => route.id === search.route_id)
  const filtered = Boolean(search.search || search.route_id || search.stop_id || search.bus_status)

  const columns: Column<TransportFeeRow>[] = [
    {
      key: 'student',
      header: 'Student',
      sortKey: 'name',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{row.student.full_name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            <span className='font-mono'>{row.student.admission_no}</span>
            {row.student.class_section ? ` · ${row.student.class_section}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'stop',
      header: 'Route and stop',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.stop.name}</span>
          <span className='text-xs text-muted-foreground'>
            {row.route.name}
            {row.drop_stop ? ` · drop ${row.drop_stop.name}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'A month',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.monthly_fee)}</span>,
    },
    {
      key: 'billed',
      header: 'Billed',
      sortKey: 'billed',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{rupees(row.billed)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{rupees(row.paid)}</span>,
    },
    {
      key: 'pending',
      header: 'Pending',
      sortKey: 'pending',
      align: 'right',
      cell: (row) => (
        <span className={cn('tabular font-semibold', row.overdue > 0 && 'text-destructive')}>
          {rupees(row.pending)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className='grid gap-0.5'>
          <Badge tone={TRANSPORT_FEE_STATUS[row.status].tone}>
            {TRANSPORT_FEE_STATUS[row.status].label}
          </Badge>
          {row.next_due_date && (
            <span className='text-xs text-muted-foreground'>
              Due {formatDate(row.next_due_date)}
            </span>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className='grid gap-6'>
      <InsightCards items={cards} loading={summary.isPending} />

      <Card className='overflow-hidden'>
        <div className='border-b px-4 py-3 sm:px-5'>
          <h2 className='font-bold'>Route-wise and stop-wise</h2>
          <p className='text-xs text-muted-foreground'>
            This year’s bus fee per route. Open a route to see each stop. Pick a route or stop to
            list its students below.
          </p>
        </div>
        {summary.isError ? (
          <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
        ) : summary.isPending ? (
          <div className='grid gap-2 p-4'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-12' />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <EmptyState
            icon={Bus}
            title='No routes yet'
            description='Set up routes and stops in Buses and routes first.'
          />
        ) : (
          <ul className='grid divide-y'>
            {routes.map((route) => {
              const expanded = open.includes(route.id)
              return (
                <li key={route.id}>
                  <div className='flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5'>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={
                        expanded ? `Hide stops of ${route.code}` : `Show stops of ${route.code}`
                      }
                      aria-expanded={expanded}
                      onClick={() =>
                        setOpen((prev) =>
                          prev.includes(route.id)
                            ? prev.filter((id) => id !== route.id)
                            : [...prev, route.id]
                        )
                      }
                    >
                      {expanded ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                    <button
                      type='button'
                      className='grid min-w-0 flex-1 text-left'
                      onClick={() => onChange({ route_id: route.id, stop_id: undefined })}
                    >
                      <span className='truncate font-semibold'>
                        {route.code} · {route.name}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {route.riders} on the bus · route fee {rupees(route.monthly_fee)} a month
                      </span>
                    </button>
                    <Figures figures={route} />
                    <Button size='sm' variant='ghost' asChild>
                      <Link
                        to='/transport/routes/$routeId/students'
                        params={{ routeId: route.id }}
                        aria-label={`Student list of ${route.code}`}
                      >
                        <ListOrdered />
                      </Link>
                    </Button>
                  </div>
                  {expanded && (
                    <ul className='grid divide-y border-t bg-muted/30'>
                      {route.stops.map((stop) => (
                        <li key={stop.id}>
                          <button
                            type='button'
                            onClick={() => onChange({ route_id: route.id, stop_id: stop.id })}
                            className={cn(
                              'flex w-full flex-wrap items-center gap-3 py-2.5 pr-4 pl-14 text-left hover:bg-muted sm:pr-5',
                              search.stop_id === stop.id && 'bg-accent'
                            )}
                          >
                            <span className='grid min-w-0 flex-1'>
                              <span className='truncate text-sm font-medium'>
                                {stop.sequence}. {stop.name}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                {rupees(stop.monthly_fee)} a month
                              </span>
                            </span>
                            <Figures figures={stop} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} students` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({
                    search: undefined,
                    route_id: undefined,
                    stop_id: undefined,
                    bus_status: undefined,
                  })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Student name or admission no.'
            label='Search students on the bus'
          />
          <FilterSelect
            id='bus-fee-route'
            label='Filter by route'
            allLabel='All routes'
            value={search.route_id ? String(search.route_id) : undefined}
            options={routes.map((route) => ({
              value: String(route.id),
              label: `${route.code} · ${route.name}`,
            }))}
            onChange={(value) =>
              onChange({ route_id: value ? Number(value) : undefined, stop_id: undefined })
            }
          />
          {selectedRoute && (
            <FilterSelect
              id='bus-fee-stop'
              label='Filter by stop'
              allLabel='All stops'
              value={search.stop_id ? String(search.stop_id) : undefined}
              options={selectedRoute.stops.map((stop) => ({
                value: String(stop.id),
                label: `${stop.sequence}. ${stop.name}`,
              }))}
              onChange={(value) => onChange({ stop_id: value ? Number(value) : undefined })}
            />
          )}
          <FilterSelect
            id='bus-fee-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.bus_status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              onChange({ bus_status: (value || undefined) as TransportFeeStatus | undefined })
            }
          />
        </ListToolbar>
        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.student.id}
          loading={list.isFetching}
          error={list.isError ? list.error.message : null}
          onRetry={() => list.refetch()}
          sort={{ sort: search.sort, order: search.order ?? 'asc' }}
          onSortChange={(next) => onChange(next as Partial<FeesSearch>)}
          empty={{
            icon: filtered ? CircleOff : Bus,
            title: filtered ? 'No students match these filters' : 'No students on the bus yet',
            description: filtered
              ? 'Try another name, or clear the filters.'
              : 'Assign students to a route and stop in Buses and routes.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='truncate font-bold'>{row.student.full_name}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {row.stop.name} · {row.route.name}
                  </span>
                </span>
                <Badge tone={TRANSPORT_FEE_STATUS[row.status].tone}>
                  {TRANSPORT_FEE_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='tabular text-xs text-muted-foreground'>
                {rupees(row.monthly_fee)} a month · billed {rupees(row.billed)} · paid{' '}
                {rupees(row.paid)}
              </span>
              <span className='tabular text-sm font-semibold'>
                Pending {rupees(row.pending)}
                {row.next_due_date ? ` · due ${formatDate(row.next_due_date)}` : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page ?? 1,
            limit: LIMIT,
            total: list.data?.total ?? 0,
            label: 'students',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Card>
    </div>
  )
}

function Figures({ figures }: { figures: TransportFeeFigures }) {
  return (
    <span className='tabular grid grid-cols-3 gap-x-4 text-right text-xs sm:w-80'>
      <span className='grid'>
        <span className='text-muted-foreground'>Billed</span>
        <span className='font-semibold'>{wholeRupees(figures.billed)}</span>
      </span>
      <span className='grid'>
        <span className='text-muted-foreground'>Collected</span>
        <span className='font-semibold text-success'>{wholeRupees(figures.collected)}</span>
      </span>
      <span className='grid'>
        <span className='text-muted-foreground'>Pending</span>
        <span className={cn('font-semibold', figures.overdue > 0 && 'text-destructive')}>
          {wholeRupees(figures.pending)}
        </span>
      </span>
    </span>
  )
}
