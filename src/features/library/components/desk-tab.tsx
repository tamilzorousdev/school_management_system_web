import { useState } from 'react'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useIssues } from '../api'
import { today } from '../labels'
import { LIST_LIMIT, type LibraryTabProps } from '../search'
import { IssuePanel } from './issue-panel'
import { Section } from './library-parts'
import { LoanDetailSheet } from './loan-detail-sheet'
import { LoanTable } from './loan-table'
import { ReturnPanel } from './return-panel'

export function DeskTab({ search, onChange }: LibraryTabProps) {
  const mode = search.desk ?? 'issue'
  const day = today()
  const [openLoan, setOpenLoan] = useState<number | null>(null)
  const transactions = useIssues({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    on: day,
    sort: 'issued_at',
    order: 'desc',
  })

  return (
    <div className='grid gap-4'>
      <SegmentedControl
        label='Desk mode'
        value={mode}
        onChange={(desk) => onChange({ desk })}
        options={[
          { value: 'issue', label: 'Issue books' },
          { value: 'return', label: 'Return books' },
        ]}
        className='self-start [&_button]:px-4 [&_button]:py-1.5 [&_button]:text-sm'
      />
      {mode === 'issue' ? <IssuePanel /> : <ReturnPanel />}
      <Section
        title="Today's transactions"
        description={transactions.data ? `${transactions.data.total} today` : undefined}
      >
        <LoanTable
          rows={transactions.data?.items ?? []}
          loading={transactions.isFetching}
          error={transactions.isError ? transactions.error.message : null}
          onRetry={() => transactions.refetch()}
          columns={['book', 'member', 'issued', 'due', 'state', 'returned']}
          onRowClick={(loan) => setOpenLoan(loan.id)}
          emptyTitle='Nothing issued or returned today'
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: transactions.data?.total ?? 0,
            label: 'transactions',
            onPageChange: (page) => onChange({ page }),
          }}
        />
      </Section>
      <LoanDetailSheet loanId={openLoan} onClose={() => setOpenLoan(null)} />
    </div>
  )
}
