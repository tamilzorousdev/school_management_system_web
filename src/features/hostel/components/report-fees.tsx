import { Building2, IndianRupee, PiggyBank, ReceiptText, Wallet } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { rupees } from '@/features/fees/labels'
import {
  useFeesReport,
  type FeesDueResident,
  type FeesHostel,
  type SnapshotParams,
} from '../api-reports'
import { ADMISSION_STATUS } from '../labels'
import { humanize, percent } from './report-helpers'
import { CardFacts, ReportFrame, ResidentCell, Section, StatGrid } from './report-parts'

const statusBadge = (status: string) => {
  const known = ADMISSION_STATUS[status as keyof typeof ADMISSION_STATUS]
  return <Badge tone={known?.tone ?? 'neutral'}>{known?.label ?? humanize(status)}</Badge>
}

const hostelColumns: Column<FeesHostel>[] = [
  {
    key: 'hostel',
    header: 'Hostel',
    cell: (row) => <span className='font-semibold'>{row.hostel_name}</span>,
  },
  {
    key: 'residents',
    header: 'Residents billed',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => row.residents_billed,
  },
  { key: 'billed', header: 'Billed', align: 'right', cell: (row) => rupees(row.billed) },
  { key: 'collected', header: 'Collected', align: 'right', cell: (row) => rupees(row.collected) },
  {
    key: 'outstanding',
    header: 'Outstanding',
    align: 'right',
    cell: (row) => <span className='font-semibold'>{rupees(row.outstanding)}</span>,
  },
  {
    key: 'percent',
    header: 'Collected %',
    align: 'right',
    cell: (row) => percent(row.collection_percent),
  },
  {
    key: 'dues',
    header: 'With dues',
    align: 'right',
    hideBelow: 'xl',
    cell: (row) => row.residents_with_dues,
  },
]

const dueColumns: Column<FeesDueResident>[] = [
  {
    key: 'resident',
    header: 'Resident',
    cell: (row) => (
      <ResidentCell
        admissionId={row.admission_id}
        student={row.student}
        hostelName={row.hostel_name}
      />
    ),
  },
  {
    key: 'status',
    header: 'Stay',
    hideBelow: 'lg',
    cell: (row) => statusBadge(row.admission_status),
  },
  { key: 'billed', header: 'Billed', align: 'right', cell: (row) => rupees(row.billed) },
  { key: 'paid', header: 'Paid', align: 'right', cell: (row) => rupees(row.paid) },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (row) => <span className='font-bold text-destructive'>{rupees(row.balance)}</span>,
  },
]

export function FeesReportView({ params }: { params: SnapshotParams }) {
  const query = useFeesReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => {
        const totals = data.totals
        const deposits = data.deposits
        const year = data.academic_year ?? 'the academic year being viewed'
        return (
          <>
            <StatGrid>
              <StatCard
                label='Rent billed'
                value={rupees(totals.billed)}
                hint={`Academic year ${year}`}
                icon={ReceiptText}
                tone='neutral'
              />
              <StatCard
                label='Collected'
                value={rupees(totals.collected)}
                hint={`${percent(totals.collection_percent)} of billed`}
                icon={Wallet}
                tone='success'
              />
              <StatCard
                label='Outstanding'
                value={rupees(totals.outstanding)}
                hint={`${totals.residents_with_dues} residents owe`}
                icon={IndianRupee}
                tone={totals.outstanding > 0 ? 'warning' : 'success'}
              />
              <StatCard
                label='Deposits held'
                value={rupees(deposits.held)}
                hint={`${deposits.held_count} residents · ${rupees(deposits.unpaid)} not paid yet`}
                icon={PiggyBank}
              />
            </StatGrid>

            <Section
              title='Rent by hostel'
              description={`Academic year ${year}; cancelled invoices left out. The date range does not apply.`}
              flush
            >
              <DataTable
                rows={data.hostels}
                columns={hostelColumns}
                rowKey={(row) => row.hostel_id}
                empty={{ icon: Building2, title: 'No hostel rent billed this year' }}
                card={(row) => (
                  <div className='grid gap-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='font-semibold'>{row.hostel_name}</span>
                      <span className='tabular text-sm font-bold'>
                        {percent(row.collection_percent)}
                      </span>
                    </div>
                    <CardFacts
                      items={[
                        { label: 'Billed', value: rupees(row.billed) },
                        { label: 'Collected', value: rupees(row.collected) },
                        { label: 'Outstanding', value: rupees(row.outstanding) },
                      ]}
                    />
                  </div>
                )}
              />
            </Section>

            <Section title='Caution deposits'>
              <dl className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-6'>
                {[
                  { label: 'Billed', value: rupees(deposits.billed) },
                  {
                    label: 'Held',
                    value: rupees(deposits.held),
                    hint: `${deposits.held_count} residents`,
                  },
                  {
                    label: 'Settled at checkout',
                    value: rupees(deposits.settled),
                    hint: `${deposits.settled_count} residents`,
                  },
                  { label: 'Deductions', value: rupees(deposits.deductions) },
                  { label: 'Refunded', value: rupees(deposits.refunded) },
                  { label: 'Not paid', value: rupees(deposits.unpaid) },
                ].map((item) => (
                  <div key={item.label} className='grid min-w-0 gap-0.5'>
                    <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                      {item.label}
                    </dt>
                    <dd className='tabular truncate text-lg font-bold'>{item.value}</dd>
                    {item.hint && <dd className='text-xs text-muted-foreground'>{item.hint}</dd>}
                  </div>
                ))}
              </dl>
            </Section>

            <Section title='Highest dues' flush>
              <DataTable
                rows={data.top_dues}
                columns={dueColumns}
                rowKey={(row) => row.admission_id}
                empty={{ icon: Wallet, title: 'No hostel rent due' }}
                card={(row) => (
                  <div className='grid gap-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <ResidentCell
                        admissionId={row.admission_id}
                        student={row.student}
                        hostelName={row.hostel_name}
                      />
                      {statusBadge(row.admission_status)}
                    </div>
                    <CardFacts
                      items={[
                        { label: 'Billed', value: rupees(row.billed) },
                        { label: 'Paid', value: rupees(row.paid) },
                        { label: 'Balance', value: rupees(row.balance) },
                      ]}
                    />
                  </div>
                )}
              />
            </Section>
          </>
        )
      }}
    </ReportFrame>
  )
}
