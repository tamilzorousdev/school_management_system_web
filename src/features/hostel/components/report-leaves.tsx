import { DoorOpen, LogOut, TimerOff, UsersRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { useLeavesReport, type LateResident, type ReportParams } from '../api-reports'
import { LEAVE_KIND, LEAVE_SOURCE, LEAVE_STATUS } from '../labels'
import { labelFor, minutesText } from './report-helpers'
import { BarList, CardFacts, ReportFrame, ResidentCell, Section, StatGrid } from './report-parts'

const columns: Column<LateResident>[] = [
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
    key: 'late_returns',
    header: 'Late returns',
    align: 'right',
    cell: (row) => <span className='font-bold text-warning'>{row.late_returns}</span>,
  },
  {
    key: 'total',
    header: 'Total late',
    align: 'right',
    cell: (row) => minutesText(row.total_late_minutes),
  },
  {
    key: 'max',
    header: 'Longest',
    align: 'right',
    cell: (row) => minutesText(row.max_late_minutes),
  },
]

export function LeavesReportView({ params }: { params: ReportParams }) {
  const query = useLeavesReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => {
        const late = data.late_returns
        return (
          <>
            <StatGrid>
              <StatCard
                label='Leaves and outings'
                value={data.total}
                hint={`${data.outings} outings · ${data.overnight_leaves} overnight leaves`}
                icon={LogOut}
              />
              <StatCard
                label='Open now'
                value={data.open_now}
                hint={`${data.out_now} residents out right now`}
                icon={DoorOpen}
                tone={data.out_now > 0 ? 'warning' : 'neutral'}
              />
              <StatCard
                label='Late returns'
                value={late.count}
                hint={`Average ${minutesText(late.average_late_minutes)} · longest ${minutesText(late.max_late_minutes)}`}
                icon={TimerOff}
                tone={late.count > 0 ? 'danger' : 'success'}
              />
              <StatCard
                label='Raised by parents'
                value={data.parent_initiated}
                hint={`${data.warden_initiated} by wardens · ${data.office_initiated} by the office`}
                icon={UsersRound}
                tone='neutral'
              />
            </StatGrid>

            <div className='grid gap-6 lg:grid-cols-3'>
              <Section title='By kind'>
                <BarList
                  items={data.by_kind.map((row) => ({
                    key: row.key,
                    label: labelFor(LEAVE_KIND, row.key),
                    value: row.count,
                  }))}
                />
              </Section>
              <Section title='By status'>
                <BarList
                  items={data.by_status.map((row) => ({
                    key: row.key,
                    label: labelFor(LEAVE_STATUS, row.key),
                    value: row.count,
                    tone: LEAVE_STATUS[row.key as keyof typeof LEAVE_STATUS]?.tone,
                  }))}
                />
              </Section>
              <Section title='Raised by'>
                <BarList
                  tone='info'
                  items={data.by_source.map((row) => ({
                    key: row.key,
                    label: labelFor(LEAVE_SOURCE, row.key),
                    value: row.count,
                  }))}
                />
              </Section>
            </div>

            <Section
              title='Late returns by resident'
              description='Returns in the period after the expected time'
              flush
            >
              <DataTable
                rows={late.residents}
                columns={columns}
                rowKey={(row) => row.admission_id}
                empty={{ icon: TimerOff, title: 'No late returns in this period' }}
                card={(row) => (
                  <div className='grid gap-2'>
                    <ResidentCell
                      admissionId={row.admission_id}
                      student={row.student}
                      hostelName={row.hostel_name}
                    />
                    <CardFacts
                      items={[
                        { label: 'Late returns', value: row.late_returns },
                        { label: 'Total late', value: minutesText(row.total_late_minutes) },
                        { label: 'Longest', value: minutesText(row.max_late_minutes) },
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
