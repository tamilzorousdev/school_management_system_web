import type { ReactNode } from 'react'
import { BookOpen, CircleOff } from 'lucide-react'
import { DataTable, type Column, type SortState } from '@/components/common/data-table'
import { rupees } from '@/features/fees/labels'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Loan } from '../api'
import { ISSUE_PURPOSE } from '../labels'
import { BookLine, LoanStateBadge, MemberLine, PhoneText } from './library-parts'

type LoanColumn =
  'book' | 'member' | 'phone' | 'issued' | 'due' | 'state' | 'returned' | 'fine' | 'follow_up'

export function LoanTable({
  rows,
  loading,
  error,
  onRetry,
  columns = ['book', 'member', 'issued', 'due', 'state', 'fine'],
  actions,
  onRowClick,
  sort,
  onSortChange,
  filtered,
  emptyTitle = 'No loans yet',
  emptyDescription,
  pagination,
}: {
  rows: Loan[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  columns?: LoanColumn[]
  actions?: (loan: Loan) => ReactNode
  onRowClick?: (loan: Loan) => void
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  filtered?: boolean
  emptyTitle?: string
  emptyDescription?: string
  pagination?: {
    page: number
    limit: number
    total: number
    label: string
    onPageChange: (page: number) => void
  }
}) {
  const all: Record<LoanColumn, Column<Loan>> = {
    book: {
      key: 'book',
      header: 'BOOK',
      cell: (loan) => (
        <BookLine
          bookId={loan.book.id}
          title={loan.book.title}
          sub={[
            loan.copy.accession_no,
            loan.purpose === 'class_set'
              ? `${ISSUE_PURPOSE.class_set}${loan.section ? ` · ${loan.section.name}` : ''}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      ),
    },
    member: {
      key: 'member',
      header: 'MEMBER',
      cell: (loan) => <MemberLine member={loan.member} size='sm' />,
    },
    phone: {
      key: 'phone',
      header: 'PHONE',
      cell: (loan) => <PhoneText phone={loan.member.phone} />,
    },
    issued: {
      key: 'issued_at',
      header: 'ISSUED',
      sortKey: 'issued_at',
      hideBelow: 'lg',
      cell: (loan) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
            {formatDateTime(loan.issued_at)}
          </span>
          {loan.issued_by && (
            <span className='text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
              by {loan.issued_by}
            </span>
          )}
        </div>
      ),
    },
    due: {
      key: 'due_date',
      header: 'DUE',
      sortKey: 'due_date',
      cell: (loan) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
            {formatDate(loan.due_date)}
          </span>
          {loan.renew_count > 0 && (
            <span className='text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
              Renewed {loan.renew_count}×
            </span>
          )}
        </div>
      ),
    },
    state: {
      key: 'state',
      header: 'STATUS',
      cell: (loan) => <LoanStateBadge state={loan.state} days={loan.days_overdue} />,
    },
    returned: {
      key: 'returned_at',
      header: 'RETURNED',
      sortKey: 'returned_at',
      hideBelow: 'xl',
      cell: (loan) => (loan.returned_at ? formatDateTime(loan.returned_at) : '—'),
    },
    fine: {
      key: 'fine',
      header: 'RUNNING FINE',
      align: 'right',
      cell: (loan) =>
        loan.running_fine > 0 ? (
          <span className='tabular font-bold text-destructive'>{rupees(loan.running_fine)}</span>
        ) : (
          <span className='text-slate-400'>—</span>
        ),
    },
    follow_up: {
      key: 'follow_up',
      header: 'LAST FOLLOW-UP',
      hideBelow: 'lg',
      cell: (loan) =>
        loan.last_follow_up ? (
          <div className='grid max-w-56'>
            <span className='truncate text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
              {loan.last_follow_up.note ?? loan.last_follow_up.action.replace(/_/g, ' ')}
            </span>
            <span className='text-[11.5px] leading-[16px] text-slate-400 dark:text-slate-500'>
              {formatDate(loan.last_follow_up.created_at)}
              {loan.last_follow_up.next_follow_up_on
                ? ` · next ${formatDate(loan.last_follow_up.next_follow_up_on)}`
                : ''}
            </span>
          </div>
        ) : (
          <span className='text-slate-400'>None yet</span>
        ),
    },
  }

  const table: Column<Loan>[] = columns.map((key) => all[key])
  if (actions) {
    table.push({
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      className: 'w-24',
      cell: (loan) => (
        <div className='inline-flex' onClick={(event) => event.stopPropagation()}>
          {actions(loan)}
        </div>
      ),
    })
  }

  return (
    <DataTable
      rows={rows}
      columns={table}
      rowKey={(loan) => loan.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onRowClick={onRowClick}
      sort={sort}
      onSortChange={onSortChange}
      empty={{
        icon: filtered ? CircleOff : BookOpen,
        title: filtered ? 'No loans match these filters' : emptyTitle,
        description: filtered ? 'Clear the filters to see more.' : emptyDescription,
      }}
      card={(loan) => (
        <div className='grid gap-1.5'>
          <div className='flex items-start justify-between gap-2'>
            <div className='grid min-w-0'>
              <span className='truncate font-bold'>{loan.book.title}</span>
              <span className='font-mono text-xs text-muted-foreground'>
                {loan.copy.accession_no}
              </span>
            </div>
            <LoanStateBadge state={loan.state} days={loan.days_overdue} />
          </div>
          <span className='truncate text-sm'>
            {loan.member.name}
            {loan.member.detail ? ` · ${loan.member.detail}` : ''}
          </span>
          {columns.includes('phone') && (
            <span className='text-sm'>
              <PhoneText phone={loan.member.phone} link={!onRowClick} />
            </span>
          )}
          <span className='text-xs text-muted-foreground'>
            Issued {formatDate(loan.issued_at)} · due {formatDate(loan.due_date)}
            {loan.running_fine > 0 ? ` · fine ${rupees(loan.running_fine)}` : ''}
          </span>
        </div>
      )}
      pagination={pagination}
    />
  )
}
