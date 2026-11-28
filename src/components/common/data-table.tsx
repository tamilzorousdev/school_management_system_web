import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Pagination } from '@/components/common/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  sortKey?: string
  className?: string
  hideBelow?: 'lg' | 'xl'
  align?: 'left' | 'right'
}

export interface SortState {
  sort?: string
  order: 'asc' | 'desc'
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  card: (row: T) => React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description?: string
    action?: React.ReactNode
  }
  onRowClick?: (row: T) => void
  isSelected?: (row: T) => boolean
  rowClassName?: (row: T) => string | undefined
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  pagination?: {
    page: number
    limit: number
    total: number
    label: string
    onPageChange: (page: number) => void
    onLimitChange?: (limit: number) => void
    limitOptions?: number[]
  }
}

const hidden = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }

function SortButton({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: React.ReactNode
  sortKey: string
  sort?: SortState
  onSortChange?: (sort: SortState) => void
}) {
  const active = sort?.sort === sortKey
  const Icon = !active ? ArrowUpDown : sort?.order === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type='button'
      onClick={() =>
        onSortChange?.({ sort: sortKey, order: active && sort?.order === 'desc' ? 'asc' : 'desc' })
      }
      className={cn(
        '-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
        active && 'text-foreground'
      )}
      aria-label={`Sort by ${typeof label === 'string' ? label : sortKey}`}
    >
      {label}
      <Icon className={cn('size-3', !active && 'opacity-50')} />
    </button>
  )
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  card,
  loading,
  error,
  onRetry,
  empty,
  onRowClick,
  isSelected,
  rowClassName,
  sort,
  onSortChange,
  pagination,
}: DataTableProps<T>) {
  if (error && !rows.length) return <ErrorState message={error} onRetry={onRetry} />

  if (loading && !rows.length) {
    return (
      <div className='grid gap-2 p-4'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-14' />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    )
  }

  return (
    <div className={cn('transition-opacity', loading && 'opacity-60')}>
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.hideBelow && hidden[column.hideBelow],
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                >
                  {column.sortKey ? (
                    <SortButton
                      label={column.header}
                      sortKey={column.sortKey}
                      sort={sort}
                      onSortChange={onSortChange}
                    />
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const selected = isSelected ? isSelected(row) : false
              return (
                <TableRow
                  key={rowKey(row)}
                  data-state={selected ? 'selected' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={(event) => {
                    if (!onRowClick || event.target !== event.currentTarget) return
                    if (event.key === 'Enter') onRowClick(row)
                    if (event.key === 'ArrowDown' || event.key === 'j') {
                      event.preventDefault()
                      ;(event.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
                    }
                    if (event.key === 'ArrowUp' || event.key === 'k') {
                      event.preventDefault()
                      ;(event.currentTarget.previousElementSibling as HTMLElement | null)?.focus()
                    }
                  }}
                  className={cn(
                    'h-[52px]',
                    selected &&
                      'bg-[#EAF7F0] hover:bg-[#EAF7F0] dark:bg-emerald-950/40 dark:hover:bg-emerald-950/50',
                    onRowClick && 'cursor-pointer outline-none focus-visible:bg-accent/60',
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        'h-[52px]',
                        column.hideBelow && hidden[column.hideBelow],
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className='grid divide-y md:hidden'>
        {rows.map((row) => (
          <li key={rowKey(row)} className={rowClassName?.(row)}>
            {onRowClick ? (
              <div
                role='button'
                tabIndex={0}
                onClick={() => onRowClick(row)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onRowClick(row)
                  }
                }}
                className='w-full cursor-pointer p-4 text-left outline-none focus-visible:bg-accent/60 active:bg-muted'
              >
                {card(row)}
              </div>
            ) : (
              <div className='p-4'>{card(row)}</div>
            )}
          </li>
        ))}
      </ul>

      {pagination && (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
          limitOptions={pagination.limitOptions}
          label={pagination.label}
        />
      )}
    </div>
  )
}
