import { useState } from 'react'
import { MessageSquareText, Star, UserRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useDriverRatingSummary,
  useDriverRatings,
  type DriverRating,
  type DriverRatingSummary,
} from '../api'

const LIMIT = 20

const RATING_OPTIONS = [
  { value: 'low', label: 'Low (1 and 2 stars)' },
  ...[5, 4, 3, 2, 1].map((star) => ({
    value: String(star),
    label: `${star} star${star === 1 ? '' : 's'}`,
  })),
]

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'size-3.5',
            star <= Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  )
}

function DriverCard({
  item,
  active,
  onSelect,
}: {
  item: DriverRatingSummary
  active: boolean
  onSelect: () => void
}) {
  const most = Math.max(1, ...item.distribution)
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'grid gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40',
        active && 'border-primary ring-1 ring-primary'
      )}
    >
      <span className='flex items-center gap-3'>
        {item.driver.photo_url ? (
          <img src={item.driver.photo_url} alt='' className='size-10 rounded-full object-cover' />
        ) : (
          <span className='grid size-10 place-items-center rounded-full bg-muted'>
            <UserRound className='size-5 text-muted-foreground' />
          </span>
        )}
        <span className='grid min-w-0'>
          <span className='truncate font-bold'>{item.driver.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {item.vehicle ? `${item.vehicle.name} · ${item.vehicle.registration_no}` : 'No bus now'}
          </span>
        </span>
      </span>
      {item.count === 0 ? (
        <span className='text-sm text-muted-foreground'>No ratings yet</span>
      ) : (
        <>
          <span className='flex flex-wrap items-center gap-2'>
            <span className='tabular text-2xl font-bold'>{item.average?.toFixed(1)}</span>
            <Stars value={item.average ?? 0} />
            <span className='text-xs text-muted-foreground'>
              {item.count} {item.count === 1 ? 'rating' : 'ratings'}
            </span>
          </span>
          <span className='grid gap-1'>
            {[5, 4, 3, 2, 1].map((star) => (
              <span key={star} className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span className='tabular w-3'>{star}</span>
                <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted'>
                  <span
                    className={cn(
                      'block h-full rounded-full',
                      star <= 2 ? 'bg-destructive' : 'bg-warning'
                    )}
                    style={{ width: `${(item.distribution[star - 1]! / most) * 100}%` }}
                  />
                </span>
                <span className='tabular w-5 text-right'>{item.distribution[star - 1]}</span>
              </span>
            ))}
          </span>
          <span className='flex flex-wrap gap-1'>
            <Badge tone='neutral'>
              This month {item.month_average?.toFixed(1) ?? '–'} ({item.month_count})
            </Badge>
            {item.low_count > 0 && <Badge tone='danger'>{item.low_count} low</Badge>}
            {item.top_tags.map((tag) => (
              <Badge key={tag.code} tone={tag.positive ? 'success' : 'warning'}>
                {tag.label} · {tag.count}
              </Badge>
            ))}
          </span>
        </>
      )}
    </button>
  )
}

export function DriverRatingsTab() {
  const summary = useDriverRatingSummary()
  const [driver, setDriver] = useState<number>()
  const [rating, setRating] = useState<string>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const ratings = useDriverRatings({
    page,
    limit: LIMIT,
    search: search || undefined,
    driver_user_id: driver,
    rating: rating && rating !== 'low' ? Number(rating) : undefined,
    low: rating === 'low' ? true : undefined,
  })
  const drivers = summary.data ?? []
  const filtered = Boolean(driver || rating || search)

  const columns: Column<DriverRating>[] = [
    {
      key: 'rating',
      header: 'Rating',
      cell: (row) => (
        <span className='grid gap-1'>
          <Stars value={row.rating} />
          <span className='text-xs text-muted-foreground'>{formatDate(row.updated_at)}</span>
        </span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.driver.name}</span>
          {row.vehicle && <span className='text-xs text-muted-foreground'>{row.vehicle.name}</span>}
        </span>
      ),
    },
    {
      key: 'feedback',
      header: 'Feedback',
      cell: (row) => (
        <span className='grid gap-1'>
          {row.tags.length > 0 && (
            <span className='flex flex-wrap gap-1'>
              {row.tags.map((tag) => (
                <Badge key={tag.code} tone={tag.positive ? 'success' : 'warning'}>
                  {tag.label}
                </Badge>
              ))}
            </span>
          )}
          {row.comment && <span className='text-sm'>{row.comment}</span>}
          {!row.tags.length && !row.comment && (
            <span className='text-xs text-muted-foreground'>Stars only</span>
          )}
        </span>
      ),
    },
    {
      key: 'parent',
      header: 'From',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.parent.name}</span>
          <span className='text-xs text-muted-foreground'>
            Parent of {row.student.full_name}
            {row.student.class_section ? ` · ${row.student.class_section}` : ''}
          </span>
        </span>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <div className='grid gap-0.5 border-b px-4 py-3 sm:px-5'>
          <h2 className='font-bold'>Drivers</h2>
          <p className='text-xs text-muted-foreground'>
            Parents rate their child’s bus driver once a month. Lowest average first. Pick a driver
            to see their ratings.
          </p>
        </div>
        <div className='p-4 sm:p-5'>
          {summary.isPending ? (
            <Skeleton className='h-40' />
          ) : summary.isError ? (
            <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
          ) : !drivers.length ? (
            <EmptyState
              icon={UserRound}
              title='No drivers yet'
              description='Give a bus a driver first.'
              className='py-6'
            />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {drivers.map((item) => (
                <DriverCard
                  key={item.driver.id}
                  item={item}
                  active={driver === item.driver.id}
                  onSelect={() => {
                    setDriver(driver === item.driver.id ? undefined : item.driver.id)
                    setPage(1)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            ratings.data
              ? `${ratings.data.total} ${ratings.data.total === 1 ? 'rating' : 'ratings'}`
              : ''
          }
          onClear={
            filtered
              ? () => {
                  setDriver(undefined)
                  setRating(undefined)
                  setSearch('')
                  setPage(1)
                }
              : undefined
          }
        >
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder='Driver, parent, student or comment'
            label='Search ratings'
          />
          <FilterSelect
            id='rating-driver'
            label='Filter by driver'
            allLabel='All drivers'
            value={driver ? String(driver) : undefined}
            options={drivers.map((item) => ({
              value: String(item.driver.id),
              label: item.driver.name,
              hint: item.vehicle?.name,
            }))}
            onChange={(value) => {
              setDriver(value ? Number(value) : undefined)
              setPage(1)
            }}
          />
          <FilterSelect
            id='rating-stars'
            label='Filter by stars'
            allLabel='All stars'
            value={rating}
            options={RATING_OPTIONS}
            onChange={(value) => {
              setRating(value)
              setPage(1)
            }}
          />
        </ListToolbar>
        <DataTable
          rows={ratings.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={ratings.isFetching}
          error={ratings.isError ? ratings.error.message : null}
          onRetry={() => ratings.refetch()}
          empty={{
            icon: MessageSquareText,
            title: filtered ? 'No ratings match these filters' : 'No ratings yet',
            description: filtered
              ? 'Try another driver or star filter, or clear the filters.'
              : 'Ratings appear here when parents rate the driver in the app.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <span className='flex items-center justify-between gap-2'>
                <Stars value={row.rating} />
                <span className='text-xs text-muted-foreground'>{formatDate(row.updated_at)}</span>
              </span>
              <span className='font-semibold'>{row.driver.name}</span>
              {row.tags.length > 0 && (
                <span className='flex flex-wrap gap-1'>
                  {row.tags.map((tag) => (
                    <Badge key={tag.code} tone={tag.positive ? 'success' : 'warning'}>
                      {tag.label}
                    </Badge>
                  ))}
                </span>
              )}
              {row.comment && <span className='text-sm'>{row.comment}</span>}
              <span className='text-xs text-muted-foreground'>
                {row.parent.name} · parent of {row.student.full_name}
              </span>
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: ratings.data?.total ?? 0,
            label: 'ratings',
            onPageChange: setPage,
          }}
        />
      </Card>
    </div>
  )
}
