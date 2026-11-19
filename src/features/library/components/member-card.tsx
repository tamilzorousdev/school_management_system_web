import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Ban, IndianRupee } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import type { MemberSummary } from '../api'
import { MEMBER_STATUS, MEMBER_TYPE, badgeOf, plural } from '../labels'
import { LoanStateBadge, PhoneText } from './library-parts'

export function MemberCard({
  summary,
  actions,
  compact,
}: {
  summary: MemberSummary
  actions?: ReactNode
  compact?: boolean
}) {
  const { member } = summary
  const status = badgeOf(MEMBER_STATUS, member.status)
  const unpaid = summary.fines.reduce((sum, fine) => sum + fine.balance, 0)
  const sub =
    member.member_type === 'student'
      ? [member.student?.class_section, member.student?.admission_no]
      : [member.staff?.designation, member.staff?.employee_no]

  return (
    <Card className='grid gap-4 p-4'>
      <div className='flex flex-wrap items-start gap-3'>
        <Avatar name={member.name} src={member.photo_url} size='lg' previewable />
        <div className='grid min-w-0 flex-1 gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <Link
              to='/library/members/$memberId'
              params={{ memberId: String(member.id) }}
              search={{}}
              className='truncate text-lg font-extrabold hover:underline'
            >
              {member.name}
            </Link>
            <Badge tone={status.tone}>{status.label}</Badge>
            {summary.enrolled_now && <Badge tone='info'>Enrolled now</Badge>}
          </div>
          <span className='text-sm text-muted-foreground'>
            {[MEMBER_TYPE[member.member_type], ...sub].filter(Boolean).join(' · ')}
          </span>
          <span className='font-mono text-xs text-muted-foreground'>Card {member.card_no}</span>
          <span className='text-sm'>
            <PhoneText phone={member.phone} />
          </span>
        </div>
        {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
      </div>

      <dl className='grid grid-cols-3 gap-2'>
        <div className='grid rounded-lg border px-3 py-2'>
          <dt className='text-xs font-semibold text-muted-foreground'>Holding</dt>
          <dd className='tabular text-lg font-extrabold'>
            {summary.loans.length} / {member.max_books}
          </dd>
        </div>
        <div className='grid rounded-lg border px-3 py-2'>
          <dt className='text-xs font-semibold text-muted-foreground'>Can take</dt>
          <dd className='tabular text-lg font-extrabold'>{summary.books_left}</dd>
        </div>
        <div className='grid rounded-lg border px-3 py-2'>
          <dt className='text-xs font-semibold text-muted-foreground'>Unpaid fines</dt>
          <dd className={`tabular text-lg font-extrabold ${unpaid ? 'text-destructive' : ''}`}>
            {rupees(unpaid)}
          </dd>
        </div>
      </dl>

      {!summary.can_borrow && summary.refusal && (
        <p className='flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
          <Ban className='mt-0.5 size-4 shrink-0' />
          {summary.refusal.message}
        </p>
      )}

      {!compact && summary.loans.length > 0 && (
        <div className='grid gap-1.5'>
          <span className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            Books held · {plural(summary.loans.length, 'book')}
          </span>
          <ul className='divide-y rounded-lg border'>
            {summary.loans.map((loan) => (
              <li key={loan.id} className='flex items-center justify-between gap-2 px-3 py-2'>
                <div className='grid min-w-0'>
                  <span className='truncate text-sm font-semibold'>{loan.book.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    {loan.copy.accession_no} · due {formatDate(loan.due_date)}
                  </span>
                </div>
                <LoanStateBadge state={loan.state} days={loan.days_overdue} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && summary.fines.length > 0 && (
        <div className='grid gap-1.5'>
          <span className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            Unpaid fines
          </span>
          <ul className='divide-y rounded-lg border'>
            {summary.fines.map((fine) => (
              <li key={fine.id} className='flex items-center justify-between gap-2 px-3 py-2'>
                <span className='flex min-w-0 items-center gap-2 text-sm'>
                  <IndianRupee className='size-3.5 shrink-0 text-muted-foreground' />
                  <span className='truncate'>{fine.reason}</span>
                </span>
                <span className='tabular shrink-0 text-sm font-bold text-destructive'>
                  {rupees(fine.balance)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
