import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CalendarCheck,
  Gavel,
  IndianRupee,
  ListChecks,
  LogOut,
  Receipt,
  Wallet,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState, StatCard } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import type { InvoiceStatus } from '@/features/fees/api'
import { INVOICE_STATUS, rupees } from '@/features/fees/labels'
import { Block, Facts } from '@/features/students/components/student-parts'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  useCases,
  useLeaves,
  useResidentFees,
  useRollHistory,
  type AdmissionDetail,
  type Charge,
  type DisciplineCase,
  type Leave,
  type MarkMethod,
  type RollHistoryItem,
} from '../api'
import {
  CASE_STATUS,
  DIET,
  DISCIPLINE_ACTION,
  DISCIPLINE_CATEGORY,
  LEAVE_KIND,
  LEAVE_STATUS,
  REFUND_MODE,
  ROLL_SLOT,
  ROLL_STATUS,
  SEVERITY,
} from '../labels'
import { BillNowButton, SettleDepositModal } from './fee-modals'
import { Muted, Section } from './resident-form-parts'

const METHOD: Record<MarkMethod, string> = {
  manual: 'Marked by staff',
  qr: 'QR scan',
  auto: 'Automatic',
}

const END_REASON: Record<string, string> = {
  transfer: 'Transferred',
  swap: 'Swapped',
  vacate: 'Vacated',
  checkout: 'Checked out',
}

const invoiceBadge = (status: string) =>
  INVOICE_STATUS[status as InvoiceStatus] ?? { label: status, tone: 'neutral' as const }

export function ResidentOverview({ admission }: { admission: AdmissionDetail }) {
  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <Card className='grid content-start gap-6 p-4 sm:p-5'>
        <Block title='Stay'>
          <Facts
            items={[
              ['Hostel admission', admission.admission_no],
              ['Hostel', admission.hostel_name],
              [
                'Bed',
                admission.bed
                  ? `${admission.bed.room_no} / ${admission.bed.bed_no} · ${admission.bed.block_name}, ${admission.bed.floor_name}`
                  : 'No bed yet',
              ],
              ['In this bed since', formatDate(admission.bed?.from_date)],
              ['Admitted on', formatDate(admission.admitted_on)],
              ['Checked out on', formatDate(admission.checked_out_on)],
              ['Diet', DIET[admission.diet]],
            ]}
          />
        </Block>
        <Block title='Local guardian'>
          <Facts
            items={[
              ['Name', admission.local_guardian_name ?? '—'],
              ['Relation', admission.local_guardian_relation ?? '—'],
              [
                'Mobile',
                admission.local_guardian_mobile ? `+91 ${admission.local_guardian_mobile}` : '—',
              ],
              ['Address', admission.local_guardian_address ?? '—'],
            ]}
          />
        </Block>
        <Block title='Notes'>
          <Facts
            items={[
              ['Medical notes', admission.medical_notes ?? '—'],
              ['Other notes', admission.notes ?? '—'],
            ]}
          />
        </Block>
      </Card>

      <Card className='grid content-start gap-6 p-4 sm:p-5'>
        <Block title='Bed history'>
          {admission.allocations.length === 0 ? (
            <Muted>No bed allocated yet.</Muted>
          ) : (
            <ul className='grid overflow-hidden rounded-lg border'>
              {admission.allocations.map((row) => (
                <li
                  key={row.id}
                  className='grid gap-1 border-b px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3'
                >
                  <div className='grid gap-0.5'>
                    <span className='tabular font-semibold'>
                      {row.room_no} / {row.bed_no}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {row.hostel_name} · {formatDate(row.from_date)} to{' '}
                      {row.to_date ? formatDate(row.to_date) : 'now'}
                    </span>
                  </div>
                  {row.to_date ? (
                    <Badge tone='neutral'>
                      {row.end_reason ? (END_REASON[row.end_reason] ?? row.end_reason) : 'Ended'}
                    </Badge>
                  ) : (
                    <Badge tone='success' dot>
                      Current
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title='Moves'>
          {admission.transfers.length === 0 ? (
            <Muted>No transfers or swaps.</Muted>
          ) : (
            <ol className='grid'>
              {admission.transfers.map((move) => (
                <li key={move.id} className='relative grid gap-1 border-l pb-5 pl-5 last:pb-0'>
                  <span className='absolute top-1 -left-[7px] size-3.5 rounded-full border-2 border-card bg-primary' />
                  <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                    <span className='text-sm font-semibold'>
                      {move.kind === 'swap' ? 'Swapped' : 'Transferred'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {formatDate(move.transfer_date)}
                    </span>
                  </div>
                  <span className='tabular flex items-center gap-1.5 text-sm'>
                    {move.from_bed ?? 'No bed'}
                    <ArrowRight className='size-3 text-muted-foreground' />
                    <span className='font-semibold'>{move.to_bed}</span>
                  </span>
                  {move.reason && <p className='text-xs text-muted-foreground'>{move.reason}</p>}
                </li>
              ))}
            </ol>
          )}
        </Block>
      </Card>
    </div>
  )
}

export function ResidentFeesTab({ admission }: { admission: AdmissionDetail }) {
  const me = useMe().data
  const canFees = can(me, 'hostel.fees')
  const fees = useResidentFees(admission.id)
  const [settling, setSettling] = useState(false)
  const data = fees.data

  if (fees.isError && !data) {
    return <ErrorState message={fees.error.message} onRetry={() => fees.refetch()} />
  }

  const deposit = data?.charges.find((charge) => charge.kind === 'deposit') ?? null
  const canSettle = Boolean(canFees && deposit && !deposit.settled_at && deposit.paid > 0)
  const closed = admission.status === 'checked_out'

  const columns: Column<Charge>[] = [
    {
      key: 'label',
      header: 'Charge',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{row.label}</span>
          {row.kind === 'deposit' && <DepositLine charge={row} />}
        </div>
      ),
    },
    {
      key: 'invoice',
      header: 'Invoice',
      hideBelow: 'lg',
      cell: (row) => (
        <Link
          to='/fees'
          search={{ tab: 'dues', invoice_id: row.invoice_id }}
          className='font-mono text-xs text-primary hover:underline'
        >
          {row.invoice_no}
        </Link>
      ),
    },
    {
      key: 'due_date',
      header: 'Due',
      cell: (row) => <span className='text-muted-foreground'>{formatDate(row.due_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={invoiceBadge(row.invoice_status).tone} dot>
          {invoiceBadge(row.invoice_status).label}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className='tabular'>{rupees(row.amount)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.paid)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (row) => (
        <span className={row.balance > 0 ? 'tabular font-semibold text-warning' : 'tabular'}>
          {rupees(row.balance)}
        </span>
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard
          label='Billed'
          value={rupees(data?.billed ?? 0)}
          hint={
            data?.room_type
              ? `${data.room_type}${data.annual_fee !== null ? ` · ${rupees(data.annual_fee)} a year` : ''}`
              : 'No room type yet'
          }
          icon={Receipt}
          loading={fees.isPending}
        />
        <StatCard
          label='Paid'
          value={rupees(data?.paid ?? 0)}
          icon={Wallet}
          tone='success'
          loading={fees.isPending}
        />
        <StatCard
          label='Balance'
          value={rupees(data?.balance ?? 0)}
          hint={data && data.dues > 0 ? `${rupees(data.dues)} due now` : 'Nothing overdue'}
          icon={IndianRupee}
          tone={(data?.balance ?? 0) > 0 ? 'warning' : 'success'}
          loading={fees.isPending}
        />
      </div>

      <Section
        title='Charges'
        action={
          <div className='flex flex-wrap gap-2'>
            {canSettle && (
              <Button variant='outline' size='sm' onClick={() => setSettling(true)}>
                Settle deposit
              </Button>
            )}
            {canFees && !closed && <BillNowButton admissionId={admission.id} />}
            <Button variant='outline' size='sm' asChild>
              <Link to='/fees' search={{ tab: 'dues', search: admission.student.admission_no }}>
                <IndianRupee />
                Collect in Fees
              </Link>
            </Button>
          </div>
        }
      >
        {fees.isPending ? (
          <Skeleton className='h-40' />
        ) : (
          <div className='-mx-4 -mb-4 border-t sm:-mx-5 sm:-mb-5'>
            <DataTable
              rows={data?.charges ?? []}
              columns={columns}
              rowKey={(row) => row.id}
              empty={{
                icon: Receipt,
                title: 'Nothing billed yet',
                description: admission.bed
                  ? 'Hostel fee instalments are billed as they fall due.'
                  : 'Allocate a bed first. Residents without a bed are not billed.',
              }}
              card={(row) => (
                <div className='grid gap-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='font-semibold'>{row.label}</span>
                    <Badge tone={invoiceBadge(row.invoice_status).tone} dot className='shrink-0'>
                      {invoiceBadge(row.invoice_status).label}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    <span className='font-mono'>{row.invoice_no}</span> · due{' '}
                    {formatDate(row.due_date)}
                  </span>
                  <span className='tabular text-sm'>
                    {rupees(row.amount)} · paid {rupees(row.paid)} ·{' '}
                    <span className={row.balance > 0 ? 'font-semibold text-warning' : ''}>
                      {rupees(row.balance)} left
                    </span>
                  </span>
                  {row.kind === 'deposit' && <DepositLine charge={row} />}
                </div>
              )}
            />
          </div>
        )}
      </Section>

      {deposit && (
        <SettleDepositModal
          open={settling}
          onOpenChange={setSettling}
          admissionId={admission.id}
          studentName={admission.student.name}
          held={deposit.paid}
        />
      )}
    </div>
  )
}

function DepositLine({ charge }: { charge: Charge }) {
  if (!charge.settled_at) {
    return (
      <span className='text-xs text-muted-foreground'>
        Caution deposit · {charge.paid > 0 ? 'held, not settled' : 'not paid yet'}
      </span>
    )
  }
  return (
    <span className='text-xs text-muted-foreground'>
      Settled {formatDateTime(charge.settled_at)}
      {charge.deduction_amount ? ` · kept ${rupees(charge.deduction_amount)}` : ''}
      {charge.deduction_reason ? ` (${charge.deduction_reason})` : ''}
      {charge.refund_amount !== null ? ` · refunded ${rupees(charge.refund_amount)}` : ''}
      {charge.refund_mode ? ` by ${REFUND_MODE[charge.refund_mode]}` : ''}
      {charge.refund_reference ? ` · ${charge.refund_reference}` : ''}
    </span>
  )
}

export function ResidentRollTab({ admissionId }: { admissionId: number }) {
  const history = useRollHistory(admissionId)
  const rows = history.data ?? []
  const count = (status: RollHistoryItem['status']) =>
    rows.filter((row) => row.status === status).length

  const columns: Column<RollHistoryItem>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => <span className='font-semibold'>{formatDate(row.date)}</span>,
    },
    { key: 'slot', header: 'Roll call', cell: (row) => ROLL_SLOT[row.slot] },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={ROLL_STATUS[row.status].tone} dot>
          {ROLL_STATUS[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'method',
      header: 'How',
      hideBelow: 'lg',
      cell: (row) => <span className='text-muted-foreground'>{METHOD[row.method]}</span>,
    },
    {
      key: 'note',
      header: 'Note',
      hideBelow: 'xl',
      cell: (row) => <span className='text-muted-foreground'>{row.note ?? '—'}</span>,
    },
    {
      key: 'marked_at',
      header: 'Marked',
      hideBelow: 'lg',
      cell: (row) => <span className='text-muted-foreground'>{formatDateTime(row.marked_at)}</span>,
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          label='Present'
          value={count('present')}
          icon={CalendarCheck}
          tone='success'
          loading={history.isPending}
        />
        <StatCard
          label='Absent'
          value={count('absent')}
          icon={ListChecks}
          tone={count('absent') > 0 ? 'danger' : 'neutral'}
          loading={history.isPending}
        />
        <StatCard
          label='Late'
          value={count('late')}
          icon={ListChecks}
          tone={count('late') > 0 ? 'warning' : 'neutral'}
          loading={history.isPending}
        />
        <StatCard
          label='Away'
          value={count('on_leave') + count('outing')}
          hint='On leave or outing'
          icon={LogOut}
          tone='neutral'
          loading={history.isPending}
        />
      </div>
      <Card className='overflow-hidden'>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => `${row.date}-${row.slot}`}
          loading={history.isFetching}
          error={history.isError ? history.error.message : null}
          onRetry={() => history.refetch()}
          empty={{
            icon: ListChecks,
            title: 'No roll calls yet',
            description: 'Morning, evening and night roll calls appear here once marked.',
          }}
          card={(row) => (
            <div className='flex items-start justify-between gap-2'>
              <div className='grid gap-0.5'>
                <span className='font-semibold'>
                  {formatDate(row.date)} · {ROLL_SLOT[row.slot]}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {METHOD[row.method]}
                  {row.note ? ` · ${row.note}` : ''}
                </span>
              </div>
              <Badge tone={ROLL_STATUS[row.status].tone} dot className='shrink-0'>
                {ROLL_STATUS[row.status].label}
              </Badge>
            </div>
          )}
        />
      </Card>
    </div>
  )
}

export function ResidentLeavesTab({ admission }: { admission: AdmissionDetail }) {
  const [page, setPage] = useState(1)
  const leaves = useLeaves({ page, limit: 20, admission_id: admission.id })

  const columns: Column<Leave>[] = [
    {
      key: 'leave',
      header: 'Leave',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{LEAVE_KIND[row.kind]}</span>
          <span className='font-mono text-xs text-muted-foreground'>{row.leave_no}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (row) => (
        <span className='text-muted-foreground'>
          {formatDate(row.from_date)}
          {row.to_date !== row.from_date ? ` to ${formatDate(row.to_date)}` : ''}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      cell: (row) => <span className='line-clamp-2 text-sm'>{row.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex flex-wrap gap-1'>
          <Badge tone={LEAVE_STATUS[row.status].tone} dot>
            {LEAVE_STATUS[row.status].label}
          </Badge>
          {row.overdue && <Badge tone='danger'>Overdue</Badge>}
          {row.late_minutes ? <Badge tone='warning'>{row.late_minutes} min late</Badge> : null}
        </div>
      ),
    },
  ]

  return (
    <Section
      title='Leave and outings'
      action={
        <Button variant='outline' size='sm' asChild>
          <Link
            to='/hostel/leaves'
            search={{ tab: 'leaves', page: 1, search: admission.student.admission_no }}
          >
            Open leave & passes
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      <div className='-mx-4 -mb-4 border-t sm:-mx-5 sm:-mb-5'>
        <DataTable
          rows={leaves.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={leaves.isFetching}
          error={leaves.isError ? leaves.error.message : null}
          onRetry={() => leaves.refetch()}
          empty={{
            icon: LogOut,
            title: 'No leave yet',
            description: 'Home leave, outings and medical leave appear here.',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold'>{LEAVE_KIND[row.kind]}</span>
                <Badge tone={LEAVE_STATUS[row.status].tone} dot className='shrink-0'>
                  {LEAVE_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                <span className='font-mono'>{row.leave_no}</span> · {formatDate(row.from_date)}
                {row.to_date !== row.from_date ? ` to ${formatDate(row.to_date)}` : ''}
              </span>
              <span className='line-clamp-2 text-sm'>{row.reason}</span>
              {row.overdue && (
                <Badge tone='danger' className='w-fit'>
                  Overdue
                </Badge>
              )}
            </div>
          )}
          pagination={{
            page,
            limit: 20,
            total: leaves.data?.total ?? 0,
            label: 'leaves',
            onPageChange: setPage,
          }}
        />
      </div>
    </Section>
  )
}

export function ResidentConductTab({ admission }: { admission: AdmissionDetail }) {
  const cases = useCases({ page: 1, limit: 20, admission_id: admission.id })
  const rows = cases.data?.items ?? []

  const columns: Column<DisciplineCase>[] = [
    {
      key: 'case',
      header: 'Case',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{DISCIPLINE_CATEGORY[row.category]}</span>
          <span className='font-mono text-xs text-muted-foreground'>{row.case_no}</span>
        </div>
      ),
    },
    {
      key: 'incident_at',
      header: 'When',
      cell: (row) => (
        <span className='text-muted-foreground'>{formatDateTime(row.incident_at)}</span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (row) => (
        <Badge tone={SEVERITY[row.severity].tone}>{SEVERITY[row.severity].label}</Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-muted-foreground'>
          {row.action ? DISCIPLINE_ACTION[row.action] : '—'}
          {row.fine_amount ? ` · ${rupees(row.fine_amount)}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={CASE_STATUS[row.status].tone} dot>
          {CASE_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  return (
    <Section
      title={
        rows.length && rows[0].strikes
          ? `Discipline · ${rows[0].strikes} ${rows[0].strikes === 1 ? 'strike' : 'strikes'}`
          : 'Discipline'
      }
      action={
        <Button variant='outline' size='sm' asChild>
          <Link
            to='/hostel/discipline'
            search={{ page: 1, search: admission.student.admission_no }}
          >
            Open discipline
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      <div className='-mx-4 -mb-4 border-t sm:-mx-5 sm:-mb-5'>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={cases.isFetching}
          error={cases.isError ? cases.error.message : null}
          onRetry={() => cases.refetch()}
          empty={{
            icon: Gavel,
            title: 'No discipline cases',
            description: 'A clean record in the hostel.',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold'>{DISCIPLINE_CATEGORY[row.category]}</span>
                <Badge tone={CASE_STATUS[row.status].tone} dot className='shrink-0'>
                  {CASE_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                <span className='font-mono'>{row.case_no}</span> · {formatDateTime(row.incident_at)}
              </span>
              <span className='flex flex-wrap gap-1.5'>
                <Badge tone={SEVERITY[row.severity].tone}>{SEVERITY[row.severity].label}</Badge>
                {row.action && <Badge tone='neutral'>{DISCIPLINE_ACTION[row.action]}</Badge>}
              </span>
            </div>
          )}
        />
      </div>
    </Section>
  )
}
