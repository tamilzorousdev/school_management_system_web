import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
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

export interface ReportColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  total?: ReactNode
  numeric?: boolean
}

export function ReportTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  error,
  onRetry,
  emptyText,
  showTotals,
}: {
  rows: T[]
  columns: ReportColumn<T>[]
  rowKey: (row: T, index: number) => string | number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyText: string
  showTotals?: boolean
}) {
  if (error && !rows.length) return <ErrorState message={error} onRetry={onRetry} />
  if (loading && !rows.length) {
    return (
      <div className='grid gap-2 p-4'>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-10' />
        ))}
      </div>
    )
  }
  if (!rows.length) {
    return <EmptyState icon={BarChart3} title='Nothing to show' description={emptyText} />
  }
  return (
    <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn('whitespace-nowrap', column.numeric && 'text-right')}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={rowKey(row, index)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.numeric && 'tabular text-right whitespace-nowrap')}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {showTotals && (
            <TableRow className='bg-muted/50 font-bold hover:bg-muted/50'>
              {columns.map((column, index) => (
                <TableCell
                  key={column.key}
                  className={cn(column.numeric && 'tabular text-right whitespace-nowrap')}
                >
                  {index === 0 ? 'Total' : column.total}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
