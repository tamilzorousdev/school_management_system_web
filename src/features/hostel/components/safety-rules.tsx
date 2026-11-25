import { Link } from '@tanstack/react-router'
import { CircleOff, Clock, Pencil, ScrollText, UsersRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import {
  useHostelRules,
  useRuleAcks,
  useRuleAckSummary,
  type HostelRules,
  type RuleAckRow,
} from '../api-safety'
import type { SafetySearch } from '../search'
import { StudentCell } from './leave-form-parts'
import { timeLabel } from './leave-helpers'
import { HostelSelect } from './pickers'
import { percentOf } from './safety-helpers'

const LIMIT = 20

const ACK_OPTIONS = [
  { value: 'true', label: 'Agreed' },
  { value: 'false', label: 'Not agreed yet' },
]

type TimingKey = Exclude<
  { [K in keyof HostelRules]: HostelRules[K] extends string ? K : never }[keyof HostelRules],
  'version'
>

const TIMINGS: { key: TimingKey; label: string }[] = [
  { key: 'wake_up_time', label: 'Wake up' },
  { key: 'study_start_time', label: 'Study starts' },
  { key: 'study_end_time', label: 'Study ends' },
  { key: 'in_time', label: 'Back in by' },
  { key: 'lights_out_time', label: 'Lights out' },
  { key: 'outing_from_time', label: 'Outings from' },
  { key: 'outing_until_time', label: 'Outings until' },
]

export function SafetyRulesPanel({
  search,
  canEdit,
  onSearch,
  onClear,
  onPage,
}: {
  search: SafetySearch
  canEdit: boolean
  onSearch: (patch: Partial<SafetySearch>) => void
  onClear: () => void
  onPage: (page: number) => void
}) {
  const rules = useHostelRules()
  const summary = useRuleAckSummary(search.hostel_id)
  const acks = useRuleAcks({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    hostel_id: search.hostel_id,
    acknowledged: search.acknowledged,
  })
  const filtered = Boolean(search.search || search.hostel_id || search.acknowledged !== undefined)

  const residents = summary.data?.residents ?? 0
  const agreed = summary.data?.acknowledged ?? 0
  const percent = percentOf(agreed, residents)

  const columns: Column<RuleAckRow>[] = [
    {
      key: 'student',
      header: 'Resident',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'lg',
      cell: (row) => row.hostel_name,
    },
    {
      key: 'status',
      header: 'Rules',
      cell: (row) => <AckBadge row={row} />,
    },
    {
      key: 'by',
      header: 'Agreed by',
      cell: (row) =>
        row.acknowledged ? (
          <div className='grid gap-0.5 text-sm'>
            <span>{row.acknowledged_by ?? 'Parent'}</span>
            <span className='text-xs text-muted-foreground'>
              {formatDateTime(row.acknowledged_at)}
            </span>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground'>—</span>
        ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='grid content-start gap-4 p-5'>
          <div className='flex items-center gap-2'>
            <UsersRound className='size-5 text-primary' />
            <h2 className='text-sm font-semibold'>Parents who agreed</h2>
          </div>
          {summary.isPending ? (
            <Skeleton className='h-20' />
          ) : (
            <>
              <div className='flex items-end gap-2'>
                <span className='tabular text-4xl font-extrabold'>{percent}%</span>
                <span className='tabular pb-1 text-sm text-muted-foreground'>
                  {agreed} of {residents} residents
                </span>
              </div>
              <div
                role='progressbar'
                aria-label='Residents whose parents agreed to the rules'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className='h-2 overflow-hidden rounded-full bg-muted'
              >
                <div className='h-full rounded-full bg-primary' style={{ width: `${percent}%` }} />
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant={search.acknowledged === false ? 'default' : 'outline'}
                  disabled={residents - agreed === 0}
                  onClick={() =>
                    onSearch({ acknowledged: search.acknowledged === false ? undefined : false })
                  }
                >
                  {residents - agreed} still to agree
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                Parents read and agree to the rules in the Parent app. Changing the rules or any
                timing asks every parent to agree again.
              </p>
            </>
          )}
        </Card>

        <Card className='grid content-start gap-4 p-5 lg:col-span-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <ScrollText className='size-5 text-primary' />
            <h2 className='text-sm font-semibold'>Current rules and timings</h2>
            {canEdit && (
              <Button asChild size='sm' variant='outline' className='ml-auto'>
                <Link to='/hostel/setup' search={{ tab: 'settings' }}>
                  <Pencil />
                  Edit in settings
                </Link>
              </Button>
            )}
          </div>
          {rules.isError && !rules.data ? (
            <ErrorState message={rules.error.message} onRetry={() => rules.refetch()} />
          ) : !rules.data ? (
            <Skeleton className='h-32' />
          ) : (
            <>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                {TIMINGS.map((item) => (
                  <div key={item.key} className='grid gap-0.5 rounded-md border bg-muted/40 p-2'>
                    <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock className='size-3' />
                      {item.label}
                    </span>
                    <span className='tabular text-sm font-semibold'>
                      {timeLabel(rules.data[item.key]) ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
              {rules.data.rules ? (
                <p className='max-h-72 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm break-words whitespace-pre-wrap'>
                  {rules.data.rules}
                </p>
              ) : (
                <p className='rounded-md border border-dashed p-3 text-sm text-muted-foreground'>
                  No written rules yet. Parents only see the timings.
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={acks.data ? `${acks.data.total} residents` : ''}
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onSearch({ search: value || undefined })}
            placeholder='Search name or admission number'
            label='Search residents'
          />
          <HostelSelect
            id='rules-hostel'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) => onSearch({ hostel_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='rules-acknowledged'
            label='Filter by agreement'
            allLabel='Everyone'
            value={search.acknowledged === undefined ? undefined : String(search.acknowledged)}
            options={ACK_OPTIONS}
            onChange={(value) =>
              onSearch({ acknowledged: value === undefined ? undefined : value === 'true' })
            }
          />
        </ListToolbar>
        <DataTable
          rows={acks.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.admission_id}
          loading={acks.isFetching}
          error={acks.isError ? acks.error.message : null}
          onRetry={() => acks.refetch()}
          empty={{
            icon: filtered ? CircleOff : UsersRound,
            title: filtered ? 'No residents match these filters' : 'No residents yet',
            description: filtered
              ? 'Try another name or clear the filters.'
              : 'Residents appear here once they are admitted to a hostel.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                <AckBadge row={row} />
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.hostel_name}
                {row.acknowledged
                  ? ` · ${row.acknowledged_by ?? 'Parent'} · ${formatDateTime(row.acknowledged_at)}`
                  : ''}
              </span>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: acks.data?.total ?? 0,
            label: 'residents',
            onPageChange: onPage,
          }}
        />
      </Card>
    </div>
  )
}

function AckBadge({ row }: { row: RuleAckRow }) {
  return row.acknowledged ? (
    <Badge tone='success' dot>
      Agreed
    </Badge>
  ) : (
    <Badge tone='warning' dot>
      Not yet
    </Badge>
  )
}
