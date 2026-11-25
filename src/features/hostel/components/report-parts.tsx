import type { ComponentProps, ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ErrorState, StatCard } from '@/components/common/display'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import type { HostelStudent, OptionalModule } from '../api'
import { studentLine } from '../labels'
import { ModuleOffState } from './hostel-life-tabs'
import { BAR_TONE, type BarTone } from './report-helpers'

export function ReportFrame<T>({
  query,
  module,
  children,
}: {
  query: UseQueryResult<T, ApiError>
  module?: OptionalModule
  children: (data: T) => ReactNode
}) {
  if (query.data === undefined && query.error) {
    if (module && query.error.code === 'HOSTEL_MODULE_DISABLED')
      return <ModuleOffState module={module} />
    return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
  }
  if (query.data === undefined) {
    return (
      <div className='grid gap-6'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-32 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-64 rounded-xl' />
      </div>
    )
  }
  return (
    <div className={cn('grid gap-6 transition-opacity', query.isFetching && 'opacity-60')}>
      {children(query.data)}
    </div>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 2xl:grid-cols-4', className)}>{children}</div>
  )
}

export function StatLink({
  onOpen,
  ...props
}: ComponentProps<typeof StatCard> & { onOpen: () => void }) {
  return (
    <button
      type='button'
      onClick={onOpen}
      className='grid rounded-xl text-left transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40'
    >
      <StatCard {...props} />
    </button>
  )
}

export function Section({
  title,
  description,
  action,
  flush,
  className,
  children,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  flush?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('min-w-0 overflow-hidden', className)}>
      <CardHeader className='pb-4'>
        <div className='grid gap-0.5'>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <div className={flush ? 'border-t' : 'px-5 pb-5'}>{children}</div>
    </Card>
  )
}

export interface BarItem {
  key: string
  label: ReactNode
  value: number
  display?: ReactNode
  tone?: BarTone
}

export function BarList({
  items,
  tone = 'primary',
  max,
  empty = 'Nothing in this period.',
}: {
  items: BarItem[]
  tone?: BarTone
  max?: number
  empty?: string
}) {
  if (!items.length) return <p className='text-sm text-muted-foreground'>{empty}</p>
  const top = max ?? Math.max(...items.map((item) => item.value), 1)
  return (
    <ul className='grid gap-3'>
      {items.map((item) => (
        <li key={item.key} className='grid gap-1.5'>
          <div className='flex items-baseline justify-between gap-3 text-sm'>
            <span className='min-w-0 truncate font-medium'>{item.label}</span>
            <span className='tabular shrink-0 font-semibold'>{item.display ?? item.value}</span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-muted'>
            <div
              className={cn('h-full rounded-full', BAR_TONE[item.tone ?? tone])}
              style={{ width: `${Math.min(100, (item.value / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export interface ColumnPoint {
  key: string
  label: string
  value: number
  display?: string
}

export function ColumnChart({
  points,
  label,
  tone = 'primary',
  max,
  empty = 'Nothing in this period.',
}: {
  points: ColumnPoint[]
  label: string
  tone?: BarTone
  max?: number
  empty?: string
}) {
  if (!points.length) return <p className='text-sm text-muted-foreground'>{empty}</p>
  const top = max ?? Math.max(...points.map((point) => point.value), 1)
  const first = points[0]
  const middle = points[Math.floor(points.length / 2)]
  const last = points[points.length - 1]
  return (
    <figure className='grid gap-2'>
      <div role='img' aria-label={label} className='flex h-40 items-end gap-px sm:gap-0.5'>
        {points.map((point) => (
          <div
            key={point.key}
            title={`${point.label}: ${point.display ?? point.value}`}
            className='flex h-full min-w-0 flex-1 items-end rounded-t-sm hover:bg-muted'
          >
            <div
              className={cn(
                'w-full rounded-t-sm',
                BAR_TONE[tone],
                point.value === 0 && 'opacity-30'
              )}
              style={{ height: `${Math.max((point.value / top) * 100, point.value > 0 ? 2 : 1)}%` }}
            />
          </div>
        ))}
      </div>
      <figcaption className='tabular flex justify-between gap-2 text-[11px] text-muted-foreground'>
        <span>{first.label}</span>
        {points.length > 2 && <span>{middle.label}</span>}
        {points.length > 1 && <span>{last.label}</span>}
      </figcaption>
    </figure>
  )
}

export interface StackSegment {
  key: string
  label: string
  value: number
  tone: BarTone
}

export function StackBar({ segments }: { segments: StackSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  return (
    <div className='grid gap-3'>
      <div className='flex h-3 overflow-hidden rounded-full bg-muted'>
        {total > 0 &&
          segments.map((segment) => (
            <div
              key={segment.key}
              title={`${segment.label}: ${segment.value}`}
              className={BAR_TONE[segment.tone]}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
        {segments.map((segment) => (
          <li key={segment.key} className='flex items-center gap-1.5'>
            <span className={cn('size-2.5 rounded-full', BAR_TONE[segment.tone])} />
            <span className='text-muted-foreground'>{segment.label}</span>
            <span className='tabular font-semibold'>{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ResidentCell({
  admissionId,
  student,
  hostelName,
}: {
  admissionId: number | null | undefined
  student: HostelStudent
  hostelName?: string
}) {
  const line = [studentLine(student), hostelName].filter(Boolean).join(' · ')
  return (
    <div className='grid min-w-0 gap-0.5'>
      {admissionId ? (
        <Link
          to='/hostel/residents/$admissionId'
          params={{ admissionId: String(admissionId) }}
          search={{ tab: 'overview' }}
          className='truncate font-semibold text-primary hover:underline'
        >
          {student.name}
        </Link>
      ) : (
        <span className='truncate font-semibold'>{student.name}</span>
      )}
      <span className='truncate text-xs text-muted-foreground'>{line}</span>
    </div>
  )
}

export function CardFacts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className='grid grid-cols-3 gap-x-4 gap-y-1.5 text-sm'>
      {items.map((item) => (
        <div key={item.label} className='grid min-w-0'>
          <dt className='text-[11px] font-semibold text-muted-foreground'>{item.label}</dt>
          <dd className='tabular truncate font-medium'>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
