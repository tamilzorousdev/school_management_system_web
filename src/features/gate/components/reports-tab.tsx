import { BarChart3, DoorOpen, Hand, LogOut, Siren, UsersRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Card } from '@/components/ui/card'
import { DateRangeInputs } from '@/features/maintenance/components/shared'
import { formatDate, formatNumber } from '@/lib/format'
import { useGateReport, type GateCountRow, type GateDayRow } from '../api'
import type { GateTabProps } from '../search'
import { ListSkeleton, Quiet, Section } from './shared'

type DayKey = Exclude<keyof GateDayRow, 'date'>

const DAY_COLUMNS: { key: DayKey; header: string; hideBelow?: 'lg' | 'xl' }[] = [
  { key: 'requested', header: 'Requested' },
  { key: 'released', header: 'Released' },
  { key: 'emergencies', header: 'Emergencies', hideBelow: 'lg' },
  { key: 'manual', header: 'By hand', hideBelow: 'lg' },
  { key: 'rejected', header: 'Rejected', hideBelow: 'xl' },
  { key: 'expired', header: 'Expired', hideBelow: 'xl' },
  { key: 'visitors', header: 'Visitors' },
]

const sum = (rows: GateDayRow[], key: DayKey) => rows.reduce((total, row) => total + row[key], 0)

function BarList({
  title,
  rows,
  empty,
  loading,
}: {
  title: string
  rows: GateCountRow[]
  empty: string
  loading: boolean
}) {
  const most = Math.max(1, ...rows.map((row) => row.count))
  return (
    <Section title={title}>
      {loading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <Quiet>{empty}</Quiet>
      ) : (
        <ul className='grid gap-2.5 p-4'>
          {rows.map((row) => (
            <li key={row.key} className='flex items-center gap-3 text-sm'>
              <span className='w-28 shrink-0 truncate sm:w-36' title={row.label}>
                {row.label}
              </span>
              <span className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                <span
                  className='block h-full rounded-full bg-primary'
                  style={{ width: `${(row.count / most) * 100}%` }}
                />
              </span>
              <span className='tabular w-8 shrink-0 text-right font-semibold'>
                {formatNumber(row.count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export function ReportsTab({ search, setSearch }: GateTabProps) {
  const report = useGateReport({ from: search.from, to: search.to })
  const data = report.data
  const days = data?.by_day ?? []
  const active = days.filter((row) => DAY_COLUMNS.some(({ key }) => row[key] > 0))

  const cards: Insight[] = [
    {
      key: 'requested',
      label: 'Passes requested',
      value: formatNumber(sum(days, 'requested')),
      hint: `${sum(days, 'rejected')} rejected · ${sum(days, 'expired')} expired`,
      icon: DoorOpen,
      tone: 'primary',
    },
    {
      key: 'released',
      label: 'Students released',
      value: formatNumber(sum(days, 'released')),
      hint: 'Left with their pickup',
      icon: LogOut,
      tone: 'success',
    },
    {
      key: 'manual',
      label: 'Released by hand',
      value: formatNumber(sum(days, 'manual')),
      hint: `${sum(days, 'emergencies')} emergencies`,
      icon: sum(days, 'manual') ? Hand : Siren,
      tone: 'warning',
    },
    {
      key: 'visitors',
      label: 'Visitors',
      value: formatNumber(sum(days, 'visitors')),
      hint: 'Came in',
      icon: UsersRound,
      tone: 'info',
    },
  ]

  const columns: Column<GateDayRow>[] = [
    {
      key: 'date',
      header: 'Day',
      cell: (row) => <span className='tabular font-semibold'>{formatDate(row.date)}</span>,
    },
    ...DAY_COLUMNS.map(({ key, header, hideBelow }) => ({
      key,
      header,
      hideBelow,
      align: 'right' as const,
      cell: (row: GateDayRow) => (
        <span className={row[key] ? 'tabular font-semibold' : 'tabular text-muted-foreground'}>
          {formatNumber(row[key])}
        </span>
      ),
    })),
  ]

  if (report.isError)
    return <ErrorState message={report.error.message} onRetry={() => report.refetch()} />

  return (
    <>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={data ? `${formatDate(data.from)} – ${formatDate(data.to)}` : ''}
          onClear={
            search.from || search.to
              ? () => setSearch({ from: undefined, to: undefined })
              : undefined
          }
        >
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
          <span className='text-xs text-muted-foreground'>Default: the last 30 days</span>
        </ListToolbar>
      </Card>
      <InsightCards items={cards} loading={report.isPending} />
      <Card className='overflow-hidden'>
        <div className='border-b px-4 py-3'>
          <span className='font-semibold'>By day</span>
          <p className='text-xs text-muted-foreground'>Days with no gate activity are left out.</p>
        </div>
        <DataTable
          rows={active}
          columns={columns}
          rowKey={(row) => row.date}
          loading={report.isFetching}
          empty={{
            icon: BarChart3,
            title: 'No gate activity in these dates',
            description: 'Choose a wider date range.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <span className='font-semibold'>{formatDate(row.date)}</span>
              <span className='tabular text-xs text-muted-foreground'>
                {DAY_COLUMNS.map(({ key, header }) => `${header} ${row[key]}`).join(' · ')}
              </span>
            </div>
          )}
        />
      </Card>
      <div className='grid items-start gap-4 lg:grid-cols-2'>
        <BarList
          title='Released by class'
          rows={data?.by_class ?? []}
          empty='No students released in these dates.'
          loading={report.isPending}
        />
        <BarList
          title='How passes were checked'
          rows={data?.by_method ?? []}
          empty='No passes checked in these dates.'
          loading={report.isPending}
        />
        <BarList
          title='Visits by purpose'
          rows={data?.by_purpose ?? []}
          empty='No visitors in these dates.'
          loading={report.isPending}
        />
        <BarList
          title='Visitors by hour'
          rows={data?.by_hour ?? []}
          empty='No visitors in these dates.'
          loading={report.isPending}
        />
      </div>
    </>
  )
}
