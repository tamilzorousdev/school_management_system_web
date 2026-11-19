import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BookCopy,
  BookOpen,
  CalendarClock,
  DoorOpen,
  History,
  IndianRupee,
  PhoneCall,
  TriangleAlert,
} from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { wholeRupees } from '@/features/fees/labels'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { libraryApi, useLibraryDashboard, type Copy, type Loan } from '../api'
import type { LibraryTabProps } from '../search'
import { BookLine, CopyStatusBadge, LoanStateBadge, MemberLine, Section } from './library-parts'
import { ScanInput } from './scan-input'

export function DashboardTab({ onGo }: { onGo: LibraryTabProps['onGo'] }) {
  const dashboard = useLibraryDashboard()
  const data = dashboard.data

  if (dashboard.isError && !data) {
    return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
  }

  const cards: Insight[] = [
    {
      key: 'books',
      label: 'Books',
      value: data?.books.titles ?? 0,
      hint: `${data?.books.copies ?? 0} copies · ${data?.books.available ?? 0} on the shelf`,
      icon: BookCopy,
      tone: 'primary',
      onClick: () => onGo('catalogue'),
    },
    {
      key: 'loans',
      label: 'Books out',
      value: data?.loans.on_loan ?? 0,
      hint: `${data?.loans.overdue ?? 0} overdue · ${data?.loans.due_today ?? 0} due today`,
      icon: BookOpen,
      tone: data?.loans.overdue ? 'warning' : 'info',
      onClick: () => onGo('loans', data?.loans.overdue ? { state: 'overdue' } : {}),
    },
    {
      key: 'fines',
      label: 'Fines outstanding',
      value: wholeRupees(data?.fines.outstanding ?? 0),
      hint: `${wholeRupees(data?.fines.collected_today ?? 0)} collected today`,
      icon: IndianRupee,
      tone: data?.fines.outstanding ? 'danger' : 'success',
      onClick: () => onGo('fines', { outstanding: true }),
    },
    {
      key: 'visitors',
      label: 'Visitors today',
      value: data?.visits.visitors_today ?? 0,
      hint: `${data?.visits.inside_now ?? 0} inside now`,
      icon: DoorOpen,
      tone: 'success',
      onClick: () => onGo('attendance'),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards items={cards} loading={dashboard.isPending} />
      <QuickLookup />
      <div className='grid gap-4 lg:grid-cols-2'>
        <LoanList
          title='Due today'
          icon={CalendarClock}
          loans={data?.due_today}
          loading={dashboard.isPending}
          empty='Nothing is due back today.'
          more={() => onGo('loans', { state: 'due_today' })}
        />
        <LoanList
          title='Follow-ups needed'
          icon={PhoneCall}
          loans={data?.follow_ups}
          loading={dashboard.isPending}
          empty='No overdue books waiting for a call.'
          more={() => onGo('follow-ups')}
        />
        <LoanList
          title='Latest transactions'
          icon={History}
          loans={data?.recent}
          loading={dashboard.isPending}
          empty='No books issued or returned yet.'
          more={() => onGo('loans', { sort: 'issued_at', order: 'desc' })}
          showTime
        />
        <Section
          title="Today's library periods"
          description={
            data
              ? `${data.visits.periods_marked} of ${data.visits.periods_today} marked`
              : undefined
          }
          actions={
            <Button variant='ghost' size='sm' onClick={() => onGo('attendance')}>
              Open attendance
            </Button>
          }
        >
          {dashboard.isPending ? (
            <div className='grid gap-2 p-4'>
              <Skeleton className='h-10' />
              <Skeleton className='h-10' />
            </div>
          ) : data?.periods_today.length ? (
            <ul className='divide-y'>
              {data.periods_today.map((period) => (
                <li
                  key={period.slot_id}
                  className='flex items-center justify-between gap-3 px-4 py-3'
                >
                  <div className='grid min-w-0'>
                    <span className='truncate font-semibold'>
                      {period.section.name} · {period.period_name ?? `Period ${period.period_no}`}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {[
                        period.start_time && `${period.start_time}–${period.end_time ?? ''}`,
                        period.teacher,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                  {period.marked ? (
                    <Badge tone='success'>
                      {period.present}/{period.total} present
                    </Badge>
                  ) : (
                    <Badge tone='warning'>Not marked</Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
              No library periods on the timetable today.
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

function LoanList({
  title,
  icon: Icon,
  loans,
  loading,
  empty,
  more,
  showTime,
}: {
  title: string
  icon: typeof BookOpen
  loans?: Loan[]
  loading: boolean
  empty: string
  more: () => void
  showTime?: boolean
}) {
  return (
    <Section
      title={
        <span className='flex items-center gap-2'>
          <Icon className='size-4 text-primary' />
          {title}
        </span>
      }
      actions={
        <Button variant='ghost' size='sm' onClick={more}>
          See all
        </Button>
      }
    >
      {loading ? (
        <div className='grid gap-2 p-4'>
          <Skeleton className='h-10' />
          <Skeleton className='h-10' />
        </div>
      ) : loans?.length ? (
        <ul className='divide-y'>
          {loans.map((loan) => (
            <li key={loan.id} className='grid gap-2 px-4 py-3 sm:grid-cols-2 sm:items-center'>
              <BookLine
                bookId={loan.book.id}
                title={loan.book.title}
                sub={`${loan.copy.accession_no} · due ${formatDate(loan.due_date)}`}
              />
              <div className='flex min-w-0 items-center justify-between gap-2'>
                <MemberLine member={loan.member} size='sm' />
                <div className='grid shrink-0 justify-items-end gap-0.5'>
                  <LoanStateBadge state={loan.state} days={loan.days_overdue} />
                  {showTime && (
                    <span className='text-[11px] text-muted-foreground'>
                      {formatDateTime(loan.returned_at ?? loan.issued_at)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className='px-4 py-8 text-center text-sm text-muted-foreground'>{empty}</p>
      )}
    </Section>
  )
}

function QuickLookup() {
  const navigate = useNavigate()
  const canManage = can(useMe().data, 'library.manage')
  const [busy, setBusy] = useState(false)
  const [copy, setCopy] = useState<Copy | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openMember = async (code: string) => {
    const summary = await libraryApi.lookupMember(code)
    void navigate({
      to: '/library/members/$memberId',
      params: { memberId: String(summary.member.id) },
      search: {},
    })
  }

  const scan = async (code: string) => {
    setBusy(true)
    setError(null)
    setCopy(null)
    try {
      if (code.startsWith('TZS1') && canManage) {
        await openMember(code)
        return
      }
      try {
        setCopy(await libraryApi.lookupCopy(code))
      } catch (caught) {
        const apiError = toApiError(caught)
        if (apiError.code !== 'COPY_NOT_FOUND' || !canManage) throw caught
        await openMember(code)
      }
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  let result: ReactNode = null
  if (error) {
    result = (
      <p className='flex items-center gap-2 text-sm font-medium text-destructive'>
        <TriangleAlert className='size-4' />
        {error}
      </p>
    )
  } else if (copy) {
    result = (
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'>
        <BookLine
          bookId={copy.book_id}
          title={copy.book.title}
          sub={[copy.accession_no, copy.book.authors, copy.location].filter(Boolean).join(' · ')}
        />
        <div className='flex flex-wrap items-center gap-2'>
          <CopyStatusBadge status={copy.status} />
          {copy.current_loan && (
            <>
              <MemberLine member={copy.current_loan.member} size='sm' />
              <LoanStateBadge state={copy.current_loan.state} />
              <span className='text-xs text-muted-foreground'>
                due {formatDate(copy.current_loan.due_date)}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className='grid gap-3 p-4'>
      <div className='grid gap-0.5'>
        <h2 className='font-bold'>Quick look-up</h2>
        <p className='text-xs text-muted-foreground'>
          Scan a book barcode to see where it is
          {canManage ? ', or a library card or ID card to open the member' : ''}.
        </p>
      </div>
      <ScanInput
        id='library-quick-scan'
        label='Scan a book or member'
        onScan={scan}
        busy={busy}
        autoFocus={false}
      />
      {result}
    </Card>
  )
}
