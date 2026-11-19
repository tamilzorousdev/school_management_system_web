import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, DoorOpen, IndianRupee, Settings2 } from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { Page } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { formatDate, formatTime } from '@/lib/format'
import { useIssues, useMember, useVisits, type MemberFine } from '../api'
import { CollectFineModal, WaiveFineModal, type FineTarget } from '../components/fine-modals'
import { Section } from '../components/library-parts'
import { LoanActionsMenu, LoanDetailSheet } from '../components/loan-detail-sheet'
import { LoanTable } from '../components/loan-table'
import { MemberCard } from '../components/member-card'
import { MemberEditModal } from '../components/member-edit-modal'
import { FINE_KIND, VISIT_KIND, VISIT_PURPOSE, labelOf } from '../labels'
import { LIST_LIMIT } from '../search'

const route = getRouteApi('/_app/library/members/$memberId')

export function MemberPage() {
  const { memberId } = route.useParams()
  const search = route.useSearch()
  const id = Number(memberId)
  const navigate = useNavigate()
  const me = useMe().data
  const summary = useMember(id)
  const data = summary.data
  const studentId = data?.member.student?.id
  const history = useIssues({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    member_id: id,
    sort: 'issued_at',
    order: 'desc',
  })
  const visits = useVisits(
    { page: 1, limit: 20, student_id: studentId, sort: 'in_at', order: 'desc' },
    Boolean(studentId)
  )
  const [editing, setEditing] = useState(false)
  const [openLoan, setOpenLoan] = useState<number | null>(null)
  const [collecting, setCollecting] = useState<FineTarget | null>(null)
  const [waiving, setWaiving] = useState<FineTarget | null>(null)

  if (summary.isError && !data) {
    return (
      <Page>
        <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
      </Page>
    )
  }

  if (!data) {
    return (
      <Page>
        <Skeleton className='h-48' />
        <Skeleton className='h-64' />
      </Page>
    )
  }

  const target = (fine: MemberFine): FineTarget => ({
    id: fine.id,
    balance: fine.balance,
    reason: fine.reason,
    member_name: data.member.name,
  })

  return (
    <Page>
      <Link
        to='/library'
        search={{ tab: 'members' }}
        className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Members
      </Link>

      <MemberCard
        summary={data}
        compact
        actions={
          <>
            {data.member.student && can(me, 'students.view') && (
              <Button variant='outline' asChild>
                <Link
                  to='/students/$studentId'
                  params={{ studentId: String(data.member.student.id) }}
                  search={{ tab: 'profile' }}
                >
                  Student profile
                </Link>
              </Button>
            )}
            {can(me, 'library.manage') && (
              <Button variant='outline' onClick={() => setEditing(true)}>
                <Settings2 />
                {data.member.status === 'suspended' ? 'Reactivate or limits' : 'Suspend or limits'}
              </Button>
            )}
          </>
        }
      />

      <Section
        title='Books held'
        description={`${data.loans.length} now · ${data.books_left} more allowed`}
      >
        <LoanTable
          rows={data.loans}
          columns={['book', 'issued', 'due', 'state', 'fine']}
          actions={(loan) => <LoanActionsMenu loan={loan} />}
          onRowClick={(loan) => setOpenLoan(loan.id)}
          emptyTitle='No books with this member'
        />
      </Section>

      <Section
        title='Unpaid fines'
        description={
          data.fines.length
            ? `${rupees(data.fines.reduce((sum, fine) => sum + fine.balance, 0))} to collect`
            : undefined
        }
      >
        {data.fines.length ? (
          <ul className='divide-y'>
            {data.fines.map((fine) => (
              <li
                key={fine.id}
                className='flex flex-wrap items-center justify-between gap-2 px-4 py-3'
              >
                <div className='grid min-w-0'>
                  <span className='text-sm font-semibold'>{fine.reason}</span>
                  <span className='text-xs text-muted-foreground'>
                    {labelOf(FINE_KIND, fine.kind)} · {formatDate(fine.created_at)} · of{' '}
                    {rupees(fine.amount)}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='tabular font-bold text-destructive'>{rupees(fine.balance)}</span>
                  {can(me, 'library.fines') && (
                    <Button size='sm' onClick={() => setCollecting(target(fine))}>
                      <IndianRupee />
                      Collect
                    </Button>
                  )}
                  {can(me, 'library.waive') && (
                    <Button size='sm' variant='outline' onClick={() => setWaiving(target(fine))}>
                      Waive
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className='px-4 py-6 text-center text-sm text-muted-foreground'>No unpaid fines.</p>
        )}
      </Section>

      <Section
        title='Loan history'
        description={history.data ? `${history.data.total} loans` : undefined}
      >
        <LoanTable
          rows={history.data?.items ?? []}
          loading={history.isFetching}
          error={history.isError ? history.error.message : null}
          onRetry={() => history.refetch()}
          columns={['book', 'issued', 'due', 'state', 'returned']}
          onRowClick={(loan) => setOpenLoan(loan.id)}
          emptyTitle='Nothing borrowed yet'
          pagination={{
            page: search.page ?? 1,
            limit: LIST_LIMIT,
            total: history.data?.total ?? 0,
            label: 'loans',
            onPageChange: (page) =>
              navigate({
                to: '/library/members/$memberId',
                params: { memberId },
                search: { page },
                replace: true,
              }),
          }}
        />
      </Section>

      {studentId && (
        <Section
          title={
            <span className='flex items-center gap-2'>
              <DoorOpen className='size-4 text-primary' />
              Library visits
            </span>
          }
          description={
            visits.data ? `Latest ${visits.data.items.length} of ${visits.data.total}` : undefined
          }
        >
          {visits.isPending ? (
            <div className='p-4'>
              <Skeleton className='h-16' />
            </div>
          ) : visits.data?.items.length ? (
            <ul className='divide-y'>
              {visits.data.items.map((visit) => (
                <li
                  key={visit.id}
                  className='flex items-center justify-between gap-2 px-4 py-2.5 text-sm'
                >
                  <span>
                    {formatDate(visit.visit_date)} ·{' '}
                    {visit.kind === 'period' ? VISIT_KIND.period : VISIT_PURPOSE[visit.purpose]}
                  </span>
                  <span className='flex items-center gap-2 text-xs text-muted-foreground'>
                    {visit.in_at ? formatTime(visit.in_at).slice(0, 5) : ''}
                    {visit.out_at ? `–${formatTime(visit.out_at).slice(0, 5)}` : ''}
                    {visit.present ? (
                      <Badge tone='success'>Present</Badge>
                    ) : (
                      <Badge tone='danger'>Absent</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='px-4 py-6 text-center text-sm text-muted-foreground'>No visits yet.</p>
          )}
        </Section>
      )}

      {editing && <MemberEditModal member={data.member} onClose={() => setEditing(false)} />}
      {collecting && <CollectFineModal fine={collecting} onClose={() => setCollecting(null)} />}
      {waiving && <WaiveFineModal fine={waiving} onClose={() => setWaiving(null)} />}
      <LoanDetailSheet loanId={openLoan} onClose={() => setOpenLoan(null)} />
    </Page>
  )
}
