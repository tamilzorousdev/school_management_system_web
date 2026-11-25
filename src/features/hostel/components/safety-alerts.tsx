import { CircleOff, ClipboardList, ShieldCheck, Siren } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNow } from '@/hooks/use-now'
import { formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useActiveSos, useSosList, type Sos, type SosCounts } from '../api-safety'
import { toneOptions } from '../labels'
import type { SafetySearch } from '../search'
import { HostelSelect } from './pickers'
import { SOS_COUNT_KEYS, SOS_KIND, SOS_STATUS } from './safety-helpers'

const LIMIT = 20

export function SafetyActiveAlerts({
  hostelId,
  onOpen,
}: {
  hostelId?: number
  onOpen: (id: number) => void
}) {
  const active = useActiveSos(hostelId)
  const items = active.data ?? []
  if (!items.length) return null
  return (
    <section role='alert' aria-live='assertive' aria-label='Open alerts' className='grid gap-3'>
      {items.map((sos) => (
        <ActiveAlertCard key={sos.id} sos={sos} onOpen={() => onOpen(sos.id)} />
      ))}
    </section>
  )
}

function ActiveAlertCard({ sos, onOpen }: { sos: Sos; onOpen: () => void }) {
  const now = useNow(15_000)
  const real = !sos.is_drill
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border-2 p-4 shadow-lg lg:flex-row lg:items-center',
        real
          ? 'border-destructive bg-destructive text-destructive-foreground ring-4 ring-destructive/25'
          : 'border-destructive/50 bg-destructive/10 text-foreground'
      )}
    >
      <span
        className={cn(
          'relative grid size-11 shrink-0 place-items-center rounded-full',
          real ? 'bg-destructive-foreground/20' : 'bg-destructive/15 text-destructive'
        )}
      >
        {real && (
          <span className='absolute inset-0 animate-ping rounded-full bg-destructive-foreground/30 motion-reduce:hidden' />
        )}
        <Siren className='relative size-6' />
      </span>
      <div className='grid min-w-0 flex-1 gap-1'>
        <p className='text-base font-extrabold tracking-wide uppercase'>
          {real ? SOS_KIND[sos.kind] : `Drill · ${SOS_KIND[sos.kind]}`} · {sos.hostel_name}
        </p>
        <p className='font-semibold break-words'>{sos.message}</p>
        <p className={cn('text-sm break-words', real ? 'opacity-90' : 'text-muted-foreground')}>
          {sos.sos_no}
          {sos.student ? ` · about ${sos.student.name}` : ''}
          {sos.raised_by_name ? ` · raised by ${sos.raised_by_name}` : ''} ·{' '}
          <span title={formatDateTime(sos.created_at)}>{timeAgo(sos.created_at, now)}</span>
        </p>
        <CountChips counts={sos.counts} inverted={real} />
      </div>
      <Button
        size='lg'
        variant={real ? 'secondary' : 'destructive'}
        className='w-full lg:w-auto'
        onClick={onOpen}
      >
        <ClipboardList />
        Open headcount
      </Button>
    </div>
  )
}

function CountChips({ counts, inverted }: { counts: SosCounts; inverted: boolean }) {
  return (
    <div className='mt-1 flex flex-wrap items-center gap-1.5'>
      {SOS_COUNT_KEYS.map((item) =>
        inverted ? (
          <span
            key={item.key}
            className='inline-flex items-center gap-1.5 rounded-full bg-destructive-foreground/15 px-2.5 py-0.5 text-xs font-semibold'
          >
            {item.label}
            <span className='tabular font-extrabold'>{counts[item.key]}</span>
          </span>
        ) : (
          <Badge key={item.key} tone={item.tone}>
            {item.label}
            <span className='tabular font-extrabold'>{counts[item.key]}</span>
          </Badge>
        )
      )}
      <span className={cn('tabular text-xs', inverted ? 'opacity-90' : 'text-muted-foreground')}>
        of {counts.total}
      </span>
    </div>
  )
}

export function SafetyHistory({
  search,
  onSearch,
  onClear,
  onPage,
  onOpen,
}: {
  search: SafetySearch
  onSearch: (patch: Partial<SafetySearch>) => void
  onClear: () => void
  onPage: (page: number) => void
  onOpen: (id: number) => void
}) {
  const list = useSosList({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    hostel_id: search.hostel_id,
    status: search.status,
  })
  const filtered = Boolean(search.search || search.hostel_id || search.status)

  const columns: Column<Sos>[] = [
    {
      key: 'alert',
      header: 'Alert',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{SOS_KIND[row.kind]}</span>
          <span className='font-mono text-xs text-muted-foreground'>{row.sos_no}</span>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid max-w-md gap-0.5'>
          <span className='line-clamp-2 text-sm'>{row.message}</span>
          <span className='text-xs text-muted-foreground'>{row.hostel_name}</span>
        </div>
      ),
    },
    {
      key: 'headcount',
      header: 'Headcount',
      hideBelow: 'xl',
      cell: (row) => <HeadcountLine counts={row.counts} />,
    },
    {
      key: 'raised',
      header: 'Raised',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{formatDateTime(row.created_at)}</span>
          {row.raised_by_name && (
            <span className='text-xs text-muted-foreground'>{row.raised_by_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadges sos={row} />,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={list.data ? `${list.data.total} alerts` : ''}
        onClear={filtered ? onClear : undefined}
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onSearch({ search: value || undefined })}
          placeholder='Search alert number or message'
          label='Search alerts'
        />
        <HostelSelect
          id='safety-hostel'
          allLabel='All hostels'
          value={search.hostel_id ? String(search.hostel_id) : undefined}
          onChange={(value) => onSearch({ hostel_id: value ? Number(value) : undefined })}
        />
        <FilterSelect
          id='safety-status'
          label='Filter by status'
          allLabel='Any status'
          value={search.status}
          options={toneOptions(SOS_STATUS)}
          onChange={(value) => onSearch({ status: value as SafetySearch['status'] })}
        />
      </ListToolbar>
      <DataTable
        rows={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={list.isFetching}
        error={list.isError ? list.error.message : null}
        onRetry={() => list.refetch()}
        onRowClick={(row) => onOpen(row.id)}
        empty={{
          icon: filtered ? CircleOff : ShieldCheck,
          title: filtered ? 'No alerts match these filters' : 'No alerts or drills yet',
          description: filtered
            ? 'Try another word or clear the filters.'
            : 'Alerts raised here or from the Staff app, and practice drills, are kept here.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid min-w-0 gap-0.5'>
                <span className='font-semibold'>{SOS_KIND[row.kind]}</span>
                <span className='text-xs text-muted-foreground'>
                  <span className='font-mono'>{row.sos_no}</span> · {row.hostel_name}
                </span>
              </div>
              <StatusBadges sos={row} />
            </div>
            <p className='line-clamp-2 text-sm'>{row.message}</p>
            <HeadcountLine counts={row.counts} />
            <span className='text-xs text-muted-foreground'>
              {formatDateTime(row.created_at)}
              {row.raised_by_name ? ` · ${row.raised_by_name}` : ''}
            </span>
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: list.data?.total ?? 0,
          label: 'alerts',
          onPageChange: onPage,
        }}
      />
    </Card>
  )
}

function StatusBadges({ sos }: { sos: Sos }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      <Badge tone={SOS_STATUS[sos.status].tone} dot pulse={sos.status === 'open'}>
        {SOS_STATUS[sos.status].label}
      </Badge>
      {sos.is_drill && <Badge tone='info'>Drill</Badge>}
    </div>
  )
}

function HeadcountLine({ counts }: { counts: SosCounts }) {
  return (
    <span className='tabular text-xs text-muted-foreground'>
      <span className='font-semibold text-success'>{counts.safe} safe</span>
      {counts.missing > 0 && (
        <span className='font-semibold text-destructive'> · {counts.missing} missing</span>
      )}
      {counts.injured > 0 && (
        <span className='font-semibold text-warning'> · {counts.injured} injured</span>
      )}
      {counts.away > 0 && <> · {counts.away} away</>}
      {counts.unmarked > 0 && <> · {counts.unmarked} not marked</>} · of {counts.total}
    </span>
  )
}
