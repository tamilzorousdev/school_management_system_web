import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
  label?: string
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total]
  }

  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 25, 50],
  label = 'items',
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const visiblePages = getVisiblePages(page, pages)

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] px-4 py-3 text-[13px] leading-[18px] text-slate-500 table-typography dark:border-slate-800'>
      <span className='tabular-nums'>
        Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()} {label}
      </span>

      <div className='flex items-center gap-4'>
        {onLimitChange && (
          <div className='flex items-center gap-2 text-slate-500'>
            <span>Rows per page</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label='Rows per page'
              className='h-7 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] font-medium text-slate-700 shadow-xs outline-none transition-colors hover:border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className='flex items-center gap-1.5'>
          {/* Previous page chevron */}
          <button
            type='button'
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label='Previous page'
            className='flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          >
            <ChevronLeft className='size-4' />
          </button>

          {/* Page buttons */}
          {visiblePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className='px-1 text-slate-400 select-none'>
                  …
                </span>
              )
            }

            const isActive = p === page
            return (
              <button
                key={p}
                type='button'
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[12.5px] font-medium transition-colors',
                  isActive
                    ? 'border border-emerald-600 bg-[#ECFDF5]/60 text-emerald-700 font-bold dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                )}
              >
                {p}
              </button>
            )
          })}

          {/* Next page chevron */}
          <button
            type='button'
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            aria-label='Next page'
            className='flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          >
            <ChevronRight className='size-4' />
          </button>
        </div>
      </div>
    </div>
  )
}
