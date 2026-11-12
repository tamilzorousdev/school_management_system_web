import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  Bus,
  CalendarCheck,
  ChartNoAxesColumn,
  IndianRupee,
  Minus,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { wholeRupees } from '@/features/fees/labels'
import { useViewingYear } from '@/lib/auth/year-context'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useYearPerformance, type YearFeeHead, type YearPerformance } from '../api'

type Tone = 'primary' | 'info' | 'warning' | 'success'

interface Detail {
  label: string
  value: (year: YearPerformance) => string | null
}

interface Tile {
  key: string
  title: string
  icon: LucideIcon
  tone: Tone
  caption: string
  shown: (year: YearPerformance) => boolean
  value: (year: YearPerformance) => number | null | undefined
  percent?: boolean
  details: Detail[]
}

const TONES: Record<Tone, { chip: string; bar: string; soft: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', bar: 'bg-primary', soft: 'bg-primary/20' },
  info: { chip: 'bg-info/10 text-info', bar: 'bg-info', soft: 'bg-info/20' },
  warning: { chip: 'bg-warning/10 text-warning', bar: 'bg-warning', soft: 'bg-warning/25' },
  success: { chip: 'bg-success/10 text-success', bar: 'bg-success', soft: 'bg-success/20' },
}

const LEVELS: Record<string, string> = {
  class: 'Class',
  school: 'School',
  zone: 'Zone',
  district: 'District',
  state: 'State',
  national: 'National',
  international: 'International',
}

const count = (value: number | null | undefined) =>
  value === null || value === undefined ? null : formatNumber(value)
const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? null : formatNumber(value, 1, '%')

const TILES: Tile[] = [
  {
    key: 'studies',
    title: 'Studies',
    icon: BookOpenCheck,
    tone: 'primary',
    caption: 'Average result',
    percent: true,
    shown: (year) => year.studies !== null,
    value: (year) => year.studies?.average_percent,
    details: [
      { label: 'Pass rate', value: (year) => percent(year.studies?.pass_percent) },
      { label: 'Fail rate', value: (year) => percent(year.studies?.fail_percent) },
      { label: 'Absent in exams', value: (year) => percent(year.studies?.absent_percent) },
      { label: 'Exams published', value: (year) => count(year.studies?.exams) },
    ],
  },
  {
    key: 'attendance',
    title: 'Attendance',
    icon: CalendarCheck,
    tone: 'info',
    caption: 'Student attendance',
    percent: true,
    shown: (year) => year.attendance !== null,
    value: (year) => year.attendance?.percent,
    details: [
      { label: 'Below 75%', value: (year) => count(year.attendance?.below_75) },
      { label: 'Staff attendance', value: (year) => percent(year.attendance?.staff_percent) },
      { label: 'Days marked', value: (year) => count(year.attendance?.days_marked) },
    ],
  },
  {
    key: 'activities',
    title: 'Sports and activities',
    icon: Trophy,
    tone: 'warning',
    caption: 'Achievements',
    shown: (year) => year.activities !== null,
    value: (year) => year.activities?.total,
    details: [
      { label: 'Sports', value: (year) => count(year.activities?.sports) },
      { label: 'Podium finishes', value: (year) => count(year.activities?.podium) },
      {
        label: 'Highest level',
        value: (year) => {
          const level = year.activities?.top_level
          return level ? (LEVELS[level] ?? level) : null
        },
      },
    ],
  },
  {
    key: 'fees',
    title: 'Fees',
    icon: IndianRupee,
    tone: 'success',
    caption: 'Collection rate',
    percent: true,
    shown: (year) => year.fees !== null,
    value: (year) => year.fees?.collection_percent,
    details: [
      {
        label: 'Collected',
        value: (year) => (year.fees ? wholeRupees(year.fees.collected) : null),
      },
      { label: 'Billed', value: (year) => (year.fees ? wholeRupees(year.fees.billed) : null) },
    ],
  },
]

export function YearPerformanceCard() {
  const performance = useYearPerformance()
  const viewing = useViewingYear()
  const [picked, setPicked] = useState<number | null>(null)
  const years = performance.data ?? []
  const tiles = TILES.filter((tile) => years.some(tile.shown))
  const selected =
    years.find((year) => year.academic_year.id === picked) ??
    years.find((year) => year.academic_year.id === viewing) ??
    years.find((year) => year.academic_year.is_current) ??
    years[0]
  const previous = selected ? years[years.indexOf(selected) + 1] : undefined

  return (
    <Card className='overflow-hidden' role='region' aria-label='Performance by academic year'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5'>
        <div className='grid'>
          <h2 className='flex items-center gap-2 font-bold'>
            <ChartNoAxesColumn className='size-4 text-primary' />
            Year by year
          </h2>
          <p className='text-xs text-muted-foreground'>
            How each academic year went
            {previous ? `, compared with ${previous.academic_year.name}` : ''}
          </p>
        </div>
        {years.length > 1 && (
          <div
            className='flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1'
            aria-label='Choose a year to look at'
          >
            {years.map((year) => {
              const active = year.academic_year.id === selected?.academic_year.id
              return (
                <button
                  key={year.academic_year.id}
                  type='button'
                  aria-pressed={active}
                  onClick={() => setPicked(year.academic_year.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground',
                    active && 'bg-card text-foreground shadow-sm'
                  )}
                >
                  {year.academic_year.name}
                  {year.academic_year.is_current && (
                    <span className='rounded-full bg-success/10 px-1.5 py-px text-[10px] text-success'>
                      Current
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {performance.isError ? (
        <ErrorState message={performance.error.message} onRetry={() => performance.refetch()} />
      ) : performance.isPending ? (
        <div className='grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-64 rounded-xl' />
          ))}
        </div>
      ) : !selected || !tiles.length ? (
        <EmptyState
          icon={ChartNoAxesColumn}
          title='Nothing to compare yet'
          description='Year figures appear once an academic year has attendance, results or achievements.'
        />
      ) : (
        <>
          <div className='grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4'>
            {tiles.map((tile) => (
              <PerformanceTile
                key={tile.key}
                tile={tile}
                years={years}
                selected={selected}
                previous={previous}
                onPick={setPicked}
              />
            ))}
          </div>
          {selected.fees && selected.fees.heads.length > 0 && (
            <FeeHeads heads={selected.fees.heads} year={selected.academic_year.name} />
          )}
          {selected.students && (
            <div className='flex flex-wrap gap-x-6 gap-y-1 border-t bg-muted/30 px-4 py-3 text-sm sm:px-5'>
              <span className='font-semibold'>Students in {selected.academic_year.name}</span>
              <span className='text-muted-foreground'>
                Enrolled{' '}
                <strong className='text-foreground'>
                  {formatNumber(selected.students.enrolled)}
                </strong>
              </span>
              <span className='text-muted-foreground'>
                Promoted{' '}
                <strong className='text-foreground'>
                  {formatNumber(selected.students.promoted)}
                </strong>
              </span>
              <span className='text-muted-foreground'>
                Left{' '}
                <strong className='text-foreground'>{formatNumber(selected.students.left)}</strong>
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function PerformanceTile({
  tile,
  years,
  selected,
  previous,
  onPick,
}: {
  tile: Tile
  years: YearPerformance[]
  selected: YearPerformance
  previous?: YearPerformance
  onPick: (id: number) => void
}) {
  const tone = TONES[tile.tone]
  const Icon = tile.icon
  const value = tile.value(selected)
  const before = previous ? tile.value(previous) : null

  return (
    <section
      aria-label={tile.title}
      className='flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4'
    >
      <div className='flex items-center gap-2.5'>
        <span className={cn('grid size-9 place-items-center rounded-lg', tone.chip)}>
          <Icon className='size-4.5' />
        </span>
        <h3 className='text-sm font-bold'>{tile.title}</h3>
      </div>

      <div className='grid gap-1'>
        <span className='text-xs text-muted-foreground'>{tile.caption}</span>
        <div className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
          <span className='text-3xl font-bold tracking-tight tabular-nums'>
            {value === null || value === undefined
              ? '—'
              : tile.percent
                ? formatNumber(value, 1, '%')
                : formatNumber(value)}
          </span>
          <Change now={value} before={before} percent={tile.percent} />
        </div>
      </div>

      <TrendBars tile={tile} years={years} selected={selected} onPick={onPick} />

      <dl className='mt-auto grid gap-1.5 border-t pt-3 text-sm'>
        {tile.details.map((detail) => (
          <div key={detail.label} className='flex items-center justify-between gap-3'>
            <dt className='text-muted-foreground'>{detail.label}</dt>
            <dd className='font-semibold tabular-nums'>{detail.value(selected) ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Change({
  now,
  before,
  percent: isPercent,
}: {
  now: number | null | undefined
  before: number | null | undefined
  percent?: boolean
}) {
  if (now === null || now === undefined || before === null || before === undefined) return null
  if (!isPercent && before === 0) return null
  const difference = Math.round((now - before) * 10) / 10
  const Icon = difference > 0 ? ArrowUpRight : difference < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        difference > 0 && 'bg-success/10 text-success',
        difference < 0 && 'bg-destructive/10 text-destructive',
        difference === 0 && 'bg-muted text-muted-foreground'
      )}
    >
      <Icon className='size-3.5' aria-hidden='true' />
      {difference === 0
        ? 'No change'
        : `${formatNumber(Math.abs(difference), isPercent ? 1 : 0)}${isPercent ? ' pts' : ''}`}
    </span>
  )
}

function TrendBars({
  tile,
  years,
  selected,
  onPick,
}: {
  tile: Tile
  years: YearPerformance[]
  selected: YearPerformance
  onPick: (id: number) => void
}) {
  const tone = TONES[tile.tone]
  const oldestFirst = [...years].reverse().slice(-5)
  const values = oldestFirst.map((year) => tile.value(year) ?? 0)
  const top = tile.percent ? 100 : Math.max(1, ...values)

  return (
    <div className='grid gap-1.5' aria-hidden='true'>
      <div className='flex h-20 items-end gap-2'>
        {oldestFirst.map((year, index) => {
          const active = year.academic_year.id === selected.academic_year.id
          const height = Math.max(4, (values[index] / top) * 100)
          const raw = tile.value(year)
          return (
            <button
              key={year.academic_year.id}
              type='button'
              tabIndex={-1}
              onClick={() => onPick(year.academic_year.id)}
              title={`${year.academic_year.name}: ${
                raw === null || raw === undefined
                  ? 'no data'
                  : tile.percent
                    ? formatNumber(raw, 1, '%')
                    : formatNumber(raw)
              }`}
              className='flex h-full flex-1 items-end justify-center'
            >
              <span
                className={cn(
                  'block w-full max-w-12 rounded-t-md transition-all',
                  active ? tone.bar : tone.soft
                )}
                style={{ height: `${height}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className='flex gap-2'>
        {oldestFirst.map((year) => (
          <span
            key={year.academic_year.id}
            className={cn(
              'flex-1 truncate text-center text-[10px] text-muted-foreground',
              year.academic_year.id === selected.academic_year.id && 'font-bold text-foreground'
            )}
          >
            {year.academic_year.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function FeeHeads({ heads, year }: { heads: YearFeeHead[]; year: string }) {
  return (
    <section aria-label='Fees by head' className='grid gap-3 border-t px-4 py-4 sm:px-5'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='flex items-center gap-2 text-sm font-bold'>
          <IndianRupee className='size-4 text-success' />
          Fees by head in {year}
        </h3>
        <span className='text-xs text-muted-foreground'>Collected of billed, after discounts</span>
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {heads.map((head) => {
          const HeadIcon = head.is_transport ? Bus : IndianRupee
          const rate = head.collection_percent ?? 0
          return (
            <div key={head.name} className='grid gap-2 rounded-lg border bg-muted/20 p-3'>
              <div className='flex items-center justify-between gap-2'>
                <span className='flex min-w-0 items-center gap-2 text-sm font-semibold'>
                  <span className='grid size-7 shrink-0 place-items-center rounded-md bg-success/10 text-success'>
                    <HeadIcon className='size-3.5' />
                  </span>
                  <span className='truncate'>{head.name}</span>
                </span>
                <span
                  className={cn(
                    'text-xs font-bold tabular-nums',
                    rate >= 90 ? 'text-success' : rate >= 60 ? 'text-warning' : 'text-destructive'
                  )}
                >
                  {head.collection_percent === null ? '—' : formatNumber(rate, 1, '%')}
                </span>
              </div>
              <span className='h-1.5 overflow-hidden rounded-full bg-muted' aria-hidden='true'>
                <span
                  className='block h-full rounded-full bg-success'
                  style={{ width: `${Math.min(100, rate)}%` }}
                />
              </span>
              <span className='text-xs text-muted-foreground tabular-nums'>
                <strong className='text-foreground'>{wholeRupees(head.collected)}</strong> of{' '}
                {wholeRupees(head.billed)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
