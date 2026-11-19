import { useState } from 'react'
import {
  BookDown,
  MoreHorizontal,
  PhoneCall,
  RefreshCw,
  SearchCheck,
  TriangleAlert,
} from 'lucide-react'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { formatDate, formatDateTime } from '@/lib/format'
import { useLoan, type Loan, type MemberFine } from '../api'
import {
  COPY_CONDITION,
  FINE_STATUS,
  FOLLOW_UP_ACTION,
  ISSUE_PURPOSE,
  badgeOf,
  labelOf,
  loanActions,
  type LoanAction,
} from '../labels'
import { CollectFineModal, WaiveFineModal, type FineTarget } from './fine-modals'
import { BookLine, LoanStateBadge, MemberLine, PhoneText } from './library-parts'
import { LoanActionModal } from './loan-modals'

const ACTION_LABEL: Record<LoanAction, { label: string; icon: typeof RefreshCw }> = {
  return: { label: 'Return', icon: BookDown },
  renew: { label: 'Renew', icon: RefreshCw },
  'follow-up': { label: 'Log follow-up', icon: PhoneCall },
  lost: { label: 'Mark lost', icon: TriangleAlert },
  found: { label: 'Mark found', icon: SearchCheck },
}

export function LoanActionsMenu({ loan }: { loan: Loan }) {
  const canManage = can(useMe().data, 'library.manage')
  const [action, setAction] = useState<LoanAction | null>(null)
  const actions = canManage ? loanActions(loan) : []
  if (!actions.length) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon-sm' aria-label={`Actions for ${loan.book.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {actions.map((key) => {
            const item = ACTION_LABEL[key]
            return (
              <DropdownMenuItem
                key={key}
                destructive={key === 'lost'}
                onSelect={() => setAction(key)}
              >
                <item.icon />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <LoanActionModal action={action} loan={loan} onClose={() => setAction(null)} />
    </>
  )
}

export function LoanDetailSheet({
  loanId,
  onClose,
}: {
  loanId: number | null
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(loanId)
  if (loanId && loanId !== shownId) setShownId(loanId)
  const loan = useLoan(shownId ?? undefined)
  const data = loan.data

  return (
    <Sheet open={Boolean(loanId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.book.title ?? 'Loan'}</SheetTitle>
          <SheetDescription>
            {data ? `${data.copy.accession_no} · issued ${formatDate(data.issued_at)}` : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {loan.isError && !data ? (
            <ErrorState message={loan.error.message} onRetry={() => loan.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <LoanDetailBody loan={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function LoanDetailBody({ loan }: { loan: NonNullable<ReturnType<typeof useLoan>['data']> }) {
  const me = useMe().data
  const canManage = can(me, 'library.manage')
  const [action, setAction] = useState<LoanAction | null>(null)
  const [collecting, setCollecting] = useState<FineTarget | null>(null)
  const [waiving, setWaiving] = useState<FineTarget | null>(null)
  const target = (fine: MemberFine): FineTarget => ({
    id: fine.id,
    balance: fine.balance,
    reason: fine.reason,
    member_name: loan.member.name,
  })

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <LoanStateBadge state={loan.state} days={loan.days_overdue} />
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            {loanActions(loan).map((key) => {
              const item = ACTION_LABEL[key]
              return (
                <Button
                  key={key}
                  size='sm'
                  variant={key === 'return' ? 'default' : 'outline'}
                  onClick={() => setAction(key)}
                >
                  <item.icon />
                  {item.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      <div className='grid gap-3 rounded-lg border p-3'>
        <BookLine bookId={loan.book.id} title={loan.book.title} sub={loan.book.authors} />
        <MemberLine member={loan.member} />
        <PhoneText phone={loan.member.phone} />
      </div>

      <DetailList
        items={[
          { label: 'Issued', value: formatDateTime(loan.issued_at) },
          { label: 'Issued by', value: loan.issued_by ?? '—' },
          { label: 'Due', value: formatDate(loan.due_date) },
          { label: 'Renewed', value: `${loan.renew_count} times` },
          {
            label: 'Purpose',
            value: `${ISSUE_PURPOSE[loan.purpose]}${loan.section ? ` · ${loan.section.name}` : ''}`,
          },
          {
            label: 'Running fine',
            value: loan.running_fine ? rupees(loan.running_fine) : '—',
          },
          { label: 'Returned', value: loan.returned_at ? formatDateTime(loan.returned_at) : '—' },
          {
            label: 'Returned condition',
            value: loan.return_condition ? COPY_CONDITION[loan.return_condition] : '—',
          },
          ...(loan.remarks ? [{ label: 'Remarks', value: loan.remarks }] : []),
        ]}
      />

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Fines</h3>
        {loan.fines.length ? (
          <ul className='divide-y rounded-lg border'>
            {loan.fines.map((fine) => {
              const status = badgeOf(FINE_STATUS, fine.status)
              return (
                <li key={fine.id} className='grid gap-2 px-3 py-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='text-sm'>{fine.reason}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='tabular text-xs text-muted-foreground'>
                      {rupees(fine.amount)} · balance {rupees(fine.balance)}
                    </span>
                    {fine.balance > 0 && (
                      <span className='flex gap-1'>
                        {can(me, 'library.fines') && (
                          <Button size='sm' onClick={() => setCollecting(target(fine))}>
                            Collect
                          </Button>
                        )}
                        {can(me, 'library.waive') && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setWaiving(target(fine))}
                          >
                            Waive
                          </Button>
                        )}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>No fines on this loan.</p>
        )}
      </div>

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Follow-ups and reminders</h3>
        {loan.follow_ups.length || loan.reminders.length ? (
          <ol className='grid gap-3 border-l pl-4'>
            {loan.follow_ups.map((item) => (
              <li key={`f${item.id}`} className='grid gap-0.5'>
                <span className='text-sm font-semibold'>
                  {labelOf(FOLLOW_UP_ACTION, item.action)}
                </span>
                {item.note && <span className='text-sm'>{item.note}</span>}
                <span className='text-xs text-muted-foreground'>
                  {[
                    formatDateTime(item.created_at),
                    item.by && `by ${item.by}`,
                    item.promised_on && `promised ${formatDate(item.promised_on)}`,
                    item.next_follow_up_on && `check ${formatDate(item.next_follow_up_on)}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
            {loan.reminders.map((item, index) => (
              <li key={`r${index}`} className='grid gap-0.5'>
                <span className='text-sm font-semibold capitalize'>
                  {item.kind.replace(/_/g, ' ')} reminder sent
                </span>
                <span className='text-xs text-muted-foreground'>
                  {formatDateTime(item.sent_at)} · {item.recipients} recipients
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className='text-sm text-muted-foreground'>Nothing logged yet.</p>
        )}
      </div>

      <LoanActionModal action={action} loan={loan} onClose={() => setAction(null)} />
      {collecting && <CollectFineModal fine={collecting} onClose={() => setCollecting(null)} />}
      {waiving && <WaiveFineModal fine={waiving} onClose={() => setWaiving(null)} />}
    </div>
  )
}
