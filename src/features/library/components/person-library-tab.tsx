import { Link } from '@tanstack/react-router'
import { IndianRupee, Library } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import { usePersonLibrary } from '../api'
import { MEMBER_STATUS, badgeOf } from '../labels'
import { Section, Stat } from './library-parts'
import { LoanTable } from './loan-table'

export function PersonLibraryTab({ kind, id }: { kind: 'student' | 'staff'; id: number }) {
  const library = usePersonLibrary(kind, id)
  const data = library.data

  if (library.isPending) {
    return (
      <div className='grid gap-3'>
        <Skeleton className='h-24' />
        <Skeleton className='h-48' />
      </div>
    )
  }
  if (library.isError || !data) {
    return (
      <ErrorState
        message={library.error?.message ?? 'Not found'}
        onRetry={() => library.refetch()}
      />
    )
  }
  if (!data.member) {
    return (
      <Card>
        <EmptyState
          icon={Library}
          title='Not a library member'
          description='Enrol them from the library members page, or scan their ID card at the issue desk.'
          action={
            <Button variant='outline' asChild>
              <Link to='/library' search={{ tab: 'members' }}>
                Open library members
              </Link>
            </Button>
          }
        />
      </Card>
    )
  }

  const status = badgeOf(MEMBER_STATUS, data.status ?? 'active')

  return (
    <div className='grid gap-4'>
      <Card className='grid gap-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-bold'>Library card</h2>
            <span className='font-mono text-sm'>{data.member.card_no}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <Button variant='outline' size='sm' asChild>
            <Link
              to='/library/members/$memberId'
              params={{ memberId: String(data.member.id) }}
              search={{}}
            >
              Open in library
            </Link>
          </Button>
        </div>
        <dl className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <Stat label='Holding' value={`${data.loans.length} / ${data.max_books}`} />
          <Stat label='Can take' value={data.books_left} />
          <Stat
            label='Unpaid fines'
            value={rupees(data.unpaid_fines)}
            tone={data.unpaid_fines ? 'danger' : undefined}
          />
          <Stat label='Visits this month' value={data.visits_this_month} />
        </dl>
        <span className='text-xs text-muted-foreground'>
          {data.total_loans} books borrowed in all
        </span>
      </Card>

      <Section title='Books held'>
        <LoanTable
          rows={data.loans}
          columns={['book', 'issued', 'due', 'state', 'fine']}
          emptyTitle='No books borrowed now'
        />
      </Section>

      {data.fines.length > 0 && (
        <Section title='Unpaid fines'>
          <ul className='divide-y'>
            {data.fines.map((fine) => (
              <li key={fine.id} className='flex items-center justify-between gap-2 px-4 py-3'>
                <span className='flex min-w-0 items-center gap-2 text-sm'>
                  <IndianRupee className='size-3.5 shrink-0 text-muted-foreground' />
                  <span className='truncate'>{fine.reason}</span>
                  <span className='hidden text-xs text-muted-foreground sm:inline'>
                    {formatDate(fine.created_at)}
                  </span>
                </span>
                <span className='tabular font-bold text-destructive'>{rupees(fine.balance)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title='History' description='Last 20 returned or lost'>
        <LoanTable
          rows={data.history}
          columns={['book', 'issued', 'due', 'state', 'returned']}
          emptyTitle='Nothing returned yet'
        />
      </Section>
    </div>
  )
}
